#!/usr/bin/env bash
#
# The production CloudFront setup that is not in a workflow: access logging,
# the default root object, the alarms that say something is wrong before the
# bill does, and the kill switch that takes the site offline when it is costing
# real money.
#
# There is no infrastructure-as-code in this repository — the AWS setup was
# done by hand and written down in docs/DEPLOYMENT.md. This script is the same
# idea in a form that can be re-run, and it is idempotent, so re-running it is
# the way to check nothing has drifted.
#
#   NOTIFY_EMAIL='<your address>' bash scripts/setup-cloudfront.sh
#
# NOTIFY_EMAIL is only needed the first time, and is deliberately not written
# down here: this repository is public and the alarms are about somebody's AWS
# bill. Run it without, and everything is still created — only the email
# subscription is skipped. (Written as a placeholder rather than the usual
# example.com address because check-secrets refuses any address not on its
# allow list, which is correct and not worth an exception.)

set -euo pipefail

DISTRIBUTION="EV8YWL5VFBSQE"   # alberta.wiki (production)

BUCKET="ab-wiki-access-logs"
PREFIX="cloudfront/production/"
RETENTION_DAYS=90

# Not ca-west-1, where the site's own buckets live. CloudFront standard logging
# refuses a bucket in an opt-in region, and Canada West (Calgary) is one — the
# update fails with an access-denied message about bucket ACLs, which sends you
# looking in the wrong place entirely. Canada Central is a standard region, so
# it works, and the logs stay in Canada.
REGION="ca-central-1"

# CloudFront's own metrics are global and only exist in us-east-1, so the
# alarms, the topic they notify and the function they trigger live there too.
ALARM_REGION="us-east-1"
TOPIC_NAME="alberta-wiki-alerts"

# --- Tier one: tell me -----------------------------------------------------
# Roughly 167 requests a second sustained for five minutes. Comfortably above a
# link doing well on Reddit, comfortably below nothing.
REQUEST_THRESHOLD=50000
REQUEST_PERIOD=300

# 50 GB in an hour, against a free tier of 1 TB a month — about thirty-five
# times a normal hour. This is the one that matters: CloudFront bills for bytes
# delivered to the viewer whether they came from the edge cache or the origin,
# so egress is the number that turns into money.
BYTES_THRESHOLD=$((50 * 1024 * 1024 * 1024))
BYTES_PERIOD=3600

# --- Tier two: pull the plug -----------------------------------------------
# Wired to the kill switch, which takes the site off the internet. Nothing
# organic reaches these.
#
# Egress does the work here. 150 GiB an hour is roughly $13 an hour of transfer
# beyond the free tier, and climbing; that is worth an hour of downtime to a
# project funded out of somebody's pocket. Requests are a far weaker signal —
# they bill at about a dollar a million, so even 667 a second all day is under
# $60, and taking the site down over that trades real downtime for a small
# bill. The request trigger sits where it can only mean an attack.
# Written as arithmetic rather than the literal, which is readable and also
# keeps a twelve-digit byte count from tripping the account-id check in
# scripts/check-secrets.mjs.
EMERGENCY_BYTES_THRESHOLD=$((150 * 1024 * 1024 * 1024))
EMERGENCY_BYTES_PERIOD=3600
EMERGENCY_REQUEST_THRESHOLD=3000000      # 3M in five minutes: 10,000 a second
EMERGENCY_REQUEST_PERIOD=300

LAMBDA_NAME="alberta-wiki-killswitch"
LAMBDA_ROLE="alberta-wiki-killswitch-role"
# A flat name, not a /path/one. Git Bash rewrites any argument that looks
# like an absolute POSIX path into a Windows path, so "/alberta-wiki/..."
# arrives at SSM as "C:/Program Files/Git/alberta-wiki/..." and is rejected
# as not fully qualified. A flat name is legal and portable.
ARM_PARAMETER="alberta-wiki-killswitch"

# Every bucket call passes --region explicitly. The CLI's configured default is
# the site's own region, and a bucket call sent to the wrong regional endpoint
# fails complaining about a location constraint rather than about the region,
# which is not where you would look first.

# The canonical id of the AWS account CloudFront delivers standard logs from.
# It is the same in every commercial region and is documented by AWS; it is not
# a secret and not specific to this account.
LOG_DELIVERY_CANONICAL_ID="c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0"

# Only used to read and rewrite the distribution config and to zip the function.
# `python` is not always on PATH on Windows, where it resolves to a Store stub.
PYTHON_BIN="${PYTHON_BIN:-python3}"
command -v "$PYTHON_BIN" >/dev/null || PYTHON_BIN=python
command -v "$PYTHON_BIN" >/dev/null || {
  echo "No python found. Set PYTHON_BIN to an interpreter." >&2
  exit 1
}

HERE="$(cd "$(dirname "$0")" && pwd)"

# On Git Bash the AWS CLI and Python are native Windows programs and cannot see
# a POSIX path: `file:///tmp/...` fails to load. cygpath translates; everywhere
# else this is the identity.
native() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}

say() { printf '\n== %s\n' "$1"; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# ---------------------------------------------------------------------------
# Access logs
#
# Server-side, because the alternative is a script in every reader's browser. A
# site that asks to be trusted about data should not be running surveillance on
# the people reading it, and a request log answers everything this project set
# out to measure. Wikipedia works this way; Our World in Data runs Google
# Analytics behind a cookie banner, which is the thing being avoided.
#
# Standard logging carries no CloudFront charge at all — the cost is S3 storage
# and PUTs on a few megabytes a month. Standard logging v2 and real-time logs
# both bill per GB ingested and buy nothing this site needs.
# ---------------------------------------------------------------------------

OWNER_CANONICAL_ID="$(aws s3api list-buckets --query 'Owner.ID' --output text)"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

say "Log bucket: s3://${BUCKET} (${REGION})"
if aws s3api head-bucket --bucket "$BUCKET" --region "$REGION" >/dev/null 2>&1; then
  echo "   already exists"
else
  # ObjectOwnership=BucketOwnerPreferred keeps ACLs enabled. CloudFront standard
  # logging writes with an ACL grant and cannot deliver to a bucket created with
  # the modern BucketOwnerEnforced default, which is the failure mode everybody
  # hits first: logging turns on, reports success, and no file ever appears.
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration "LocationConstraint=${REGION}" \
    --object-ownership BucketOwnerPreferred >/dev/null
  echo "   created"
fi

say "Blocking public access on the log bucket"
aws s3api put-public-access-block \
  --bucket "$BUCKET" --region "$REGION" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo "   done"

say "Granting CloudFront's log delivery account write access"
# put-bucket-acl replaces the whole ACL, so the owner has to be granted again in
# the same call or the account loses access to its own bucket.
aws s3api put-bucket-acl \
  --bucket "$BUCKET" --region "$REGION" \
  --grant-full-control "id=${OWNER_CANONICAL_ID},id=${LOG_DELIVERY_CANONICAL_ID}"
echo "   done"

say "Expiring logs after ${RETENTION_DAYS} days"
# Raw request logs are the most sensitive thing this project will ever hold, and
# they are only useful while they are recent. Ninety days matches what Wikimedia
# keeps and stops storage growing without bound.
cat > "$WORK/lifecycle.json" <<JSON
{
  "Rules": [{
    "ID": "expire-access-logs",
    "Status": "Enabled",
    "Filter": { "Prefix": "${PREFIX}" },
    "Expiration": { "Days": ${RETENTION_DAYS} },
    "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
  }]
}
JSON
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET" --region "$REGION" \
  --lifecycle-configuration "file://$(native "$WORK/lifecycle.json")"
echo "   done"

# ---------------------------------------------------------------------------
# Distribution: logging on, and a default root object
#
# Without DefaultRootObject, a request for `/` asks S3 for an empty key, gets a
# 403, and falls through the `403 -> /index.html` custom error response, which
# is capped at ErrorCachingMinTTL. The home page then answers every request with
# `X-Cache: Error from cloudfront` and is re-fetched from the origin every ten
# seconds at every edge — the most-linked page on the site, effectively
# uncached. Figure pages, which are real objects, cache normally.
# ---------------------------------------------------------------------------

say "Configuring distribution ${DISTRIBUTION}"
aws cloudfront get-distribution-config --id "$DISTRIBUTION" > "$WORK/dist.json"
ETAG="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["ETag"])' "$(native "$WORK/dist.json")")"

# Edit only the two fields and send the rest back untouched. The update API
# replaces the entire configuration, so anything dropped here is a live change
# to how the site is served.
"$PYTHON_BIN" - "$(native "$WORK/dist.json")" "$(native "$WORK/dist-new.json")" \
  "$BUCKET" "$REGION" "$PREFIX" <<'PYTHON'
import json, sys

source, target, bucket, region, prefix = sys.argv[1:6]
config = json.load(open(source))["DistributionConfig"]

config["Logging"] = {
    "Enabled": True,
    # Cookies are not logged. The site sets none worth reading, and a log that
    # carries them is a log that has to be handled far more carefully.
    "IncludeCookies": False,
    "Bucket": f"{bucket}.s3.{region}.amazonaws.com",
    "Prefix": prefix,
}

# The 403 -> /index.html custom error response stays: it is what makes an
# unknown deep link render the client-side "no figure here" page instead of an
# S3 error. This only stops the home page going through it.
config["DefaultRootObject"] = "index.html"

json.dump(config, open(target, "w"))
PYTHON

aws cloudfront update-distribution \
  --id "$DISTRIBUTION" \
  --if-match "$ETAG" \
  --distribution-config "file://$(native "$WORK/dist-new.json")" \
  --query 'Distribution.DistributionConfig.{Logging:Logging,DefaultRootObject:DefaultRootObject}' \
  --output json

# ---------------------------------------------------------------------------
# Alerting
#
# The only other alert is an AWS Budget, and billing data trails by up to a day.
# Nothing in AWS caps spending — a budget notifies, it does not throttle — so
# how fast you are told is the whole of the exposure. These run on CloudFront's
# free default metrics at one-minute granularity and fit inside the ten-alarm
# CloudWatch free tier.
# ---------------------------------------------------------------------------

say "Alert topic ${TOPIC_NAME} (${ALARM_REGION})"
TOPIC_ARN="$(aws sns create-topic --name "$TOPIC_NAME" --region "$ALARM_REGION" --query TopicArn --output text)"
echo "   ${TOPIC_ARN//$ACCOUNT_ID/<account>}"

if [ -n "${NOTIFY_EMAIL:-}" ]; then
  EXISTING="$(aws sns list-subscriptions-by-topic --topic-arn "$TOPIC_ARN" --region "$ALARM_REGION" \
    --query "Subscriptions[?Endpoint=='${NOTIFY_EMAIL}'].SubscriptionArn" --output text)"
  if [ -n "$EXISTING" ] && [ "$EXISTING" != "None" ]; then
    echo "   already subscribed"
  else
    aws sns subscribe --topic-arn "$TOPIC_ARN" --protocol email \
      --notification-endpoint "$NOTIFY_EMAIL" --region "$ALARM_REGION" >/dev/null
    echo "   subscription sent — confirm it from the email before the alarms can reach you"
  fi
else
  echo "   NOTIFY_EMAIL not set; leaving subscriptions alone"
fi

alarm() {
  aws cloudwatch put-metric-alarm \
    --region "$ALARM_REGION" \
    --alarm-name "$1" --alarm-description "$2" \
    --namespace AWS/CloudFront --metric-name "$3" --statistic Sum \
    --dimensions Name=DistributionId,Value="$DISTRIBUTION" Name=Region,Value=Global \
    --period "$4" --evaluation-periods 1 \
    --threshold "$5" --comparison-operator GreaterThanThreshold \
    --treat-missing-data notBreaching \
    --alarm-actions "$TOPIC_ARN" ${6:+--ok-actions "$TOPIC_ARN"}
}

say "Alarm: request rate"
alarm "alberta-wiki-request-spike" \
  "CloudFront requests far above anything organic. Check the access logs before assuming a flood; a link doing well looks similar at first." \
  Requests "$REQUEST_PERIOD" "$REQUEST_THRESHOLD" ok
echo "   > ${REQUEST_THRESHOLD} requests in ${REQUEST_PERIOD}s"

say "Alarm: egress"
alarm "alberta-wiki-egress-spike" \
  "CloudFront is sending far more data than a normal hour. This is the one that turns into money: egress is billed whether the bytes came from the edge cache or the origin." \
  BytesDownloaded "$BYTES_PERIOD" "$BYTES_THRESHOLD" ok
echo "   > $((BYTES_THRESHOLD / 1024 / 1024 / 1024)) GiB in ${BYTES_PERIOD}s"

# ---------------------------------------------------------------------------
# The kill switch
#
# Nothing in AWS caps spending, so the only way to stop a bill is to stop
# serving. This disables the distribution when traffic reaches a level that is
# unambiguously not readers, and emails to say it did.
#
# It is a real trade and worth naming: an automatic kill switch hands an
# attacker a cheap way to take the site down and keep it down. For a project
# funded out of somebody's pocket, an hour offline is recoverable and a
# four-figure invoice is not, so that is the trade being made. The arm
# parameter is how to take it back during a launch week, or any other time a
# spike is expected and downtime would cost more than traffic.
# ---------------------------------------------------------------------------

say "Kill switch state (${ARM_PARAMETER})"
if aws ssm get-parameter --name "$ARM_PARAMETER" --region "$ALARM_REGION" >/dev/null 2>&1; then
  STATE="$(aws ssm get-parameter --name "$ARM_PARAMETER" --region "$ALARM_REGION" --query Parameter.Value --output text)"
  echo "   ${STATE} (left as it was)"
else
  # Created disarmed. Arming something that can take the site down should be a
  # deliberate act, not a side effect of running a setup script.
  aws ssm put-parameter --name "$ARM_PARAMETER" --value disarmed --type String \
    --region "$ALARM_REGION" >/dev/null
  echo "   created, disarmed"
fi

say "Kill switch role"
cat > "$WORK/trust.json" <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
JSON

if aws iam get-role --role-name "$LAMBDA_ROLE" >/dev/null 2>&1; then
  echo "   already exists"
else
  aws iam create-role --role-name "$LAMBDA_ROLE" \
    --assume-role-policy-document "file://$(native "$WORK/trust.json")" >/dev/null
  aws iam attach-role-policy --role-name "$LAMBDA_ROLE" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole >/dev/null
  echo "   created"
  # IAM is eventually consistent and Lambda will refuse a role it cannot yet
  # see. Ten seconds is the difference between this working first time and a
  # confusing InvalidParameterValueException.
  sleep 10
fi

# Scoped to exactly the three things the function does, on exactly the one
# distribution it may touch. Something that can disable the site should not be
# able to do anything else to it.
cat > "$WORK/policy.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["cloudfront:GetDistributionConfig", "cloudfront:UpdateDistribution"],
      "Resource": "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${DISTRIBUTION}"
    },
    { "Effect": "Allow", "Action": "sns:Publish", "Resource": "${TOPIC_ARN}" },
    {
      "Effect": "Allow",
      "Action": "ssm:GetParameter",
      "Resource": "arn:aws:ssm:${ALARM_REGION}:${ACCOUNT_ID}:parameter/${ARM_PARAMETER}"
    }
  ]
}
JSON
aws iam put-role-policy --role-name "$LAMBDA_ROLE" --policy-name killswitch \
  --policy-document "file://$(native "$WORK/policy.json")"
echo "   policy applied"

say "Kill switch function"
"$PYTHON_BIN" - "$(native "$HERE/lambda/killswitch.py")" "$(native "$WORK/killswitch.zip")" <<'PYTHON'
import sys, zipfile
source, target = sys.argv[1:3]
with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as bundle:
    bundle.write(source, "killswitch.py")
PYTHON

ROLE_ARN="$(aws iam get-role --role-name "$LAMBDA_ROLE" --query Role.Arn --output text)"
ENVIRONMENT="Variables={DISTRIBUTION_ID=${DISTRIBUTION},TOPIC_ARN=${TOPIC_ARN},ARM_PARAMETER=${ARM_PARAMETER}}"

if aws lambda get-function --function-name "$LAMBDA_NAME" --region "$ALARM_REGION" >/dev/null 2>&1; then
  aws lambda update-function-code --function-name "$LAMBDA_NAME" --region "$ALARM_REGION" \
    --zip-file "fileb://$(native "$WORK/killswitch.zip")" >/dev/null
  aws lambda wait function-updated --function-name "$LAMBDA_NAME" --region "$ALARM_REGION"
  aws lambda update-function-configuration --function-name "$LAMBDA_NAME" --region "$ALARM_REGION" \
    --environment "$ENVIRONMENT" >/dev/null
  echo "   updated"
else
  aws lambda create-function --function-name "$LAMBDA_NAME" --region "$ALARM_REGION" \
    --runtime python3.12 --handler killswitch.handler --role "$ROLE_ARN" \
    --zip-file "fileb://$(native "$WORK/killswitch.zip")" --timeout 30 \
    --environment "$ENVIRONMENT" >/dev/null
  echo "   created"
fi
aws lambda wait function-updated --function-name "$LAMBDA_NAME" --region "$ALARM_REGION"

LAMBDA_ARN="$(aws lambda get-function --function-name "$LAMBDA_NAME" --region "$ALARM_REGION" \
  --query Configuration.FunctionArn --output text)"

aws lambda add-permission --function-name "$LAMBDA_NAME" --region "$ALARM_REGION" \
  --statement-id sns-invoke --action lambda:InvokeFunction \
  --principal sns.amazonaws.com --source-arn "$TOPIC_ARN" >/dev/null 2>&1 || true

if aws sns list-subscriptions-by-topic --topic-arn "$TOPIC_ARN" --region "$ALARM_REGION" \
    --query "Subscriptions[?Endpoint=='${LAMBDA_ARN}']" --output text | grep -q .; then
  echo "   already subscribed to ${TOPIC_NAME}"
else
  aws sns subscribe --topic-arn "$TOPIC_ARN" --protocol lambda \
    --notification-endpoint "$LAMBDA_ARN" --region "$ALARM_REGION" >/dev/null
  echo "   subscribed to ${TOPIC_NAME}"
fi

say "Alarm: egress emergency (takes the site offline)"
alarm "alberta-wiki-egress-emergency" \
  "Egress at a level that costs real money. Wired to the kill switch: this disables the distribution." \
  BytesDownloaded "$EMERGENCY_BYTES_PERIOD" "$EMERGENCY_BYTES_THRESHOLD"
echo "   > $((EMERGENCY_BYTES_THRESHOLD / 1024 / 1024 / 1024)) GiB in ${EMERGENCY_BYTES_PERIOD}s"

say "Alarm: request emergency (takes the site offline)"
alarm "alberta-wiki-request-emergency" \
  "Request rate that can only be an attack. Wired to the kill switch: this disables the distribution." \
  Requests "$EMERGENCY_REQUEST_PERIOD" "$EMERGENCY_REQUEST_THRESHOLD"
echo "   > ${EMERGENCY_REQUEST_THRESHOLD} requests in ${EMERGENCY_REQUEST_PERIOD}s"

say "Done."
echo "   Logs:   s3://${BUCKET}/${PREFIX}"
echo "   Alarms: ${ALARM_REGION}"
echo "     tell me  — alberta-wiki-request-spike, alberta-wiki-egress-spike"
echo "     pull it  — alberta-wiki-request-emergency, alberta-wiki-egress-emergency"
echo ""
echo "   Kill switch: $(aws ssm get-parameter --name "$ARM_PARAMETER" --region "$ALARM_REGION" --query Parameter.Value --output text)"
echo "     arm     aws ssm put-parameter --name ${ARM_PARAMETER} --value armed --overwrite --region ${ALARM_REGION}"
echo "     disarm  aws ssm put-parameter --name ${ARM_PARAMETER} --value disarmed --overwrite --region ${ALARM_REGION}"
echo "     recover bash scripts/cloudfront-enable.sh"
echo ""
echo "   A WAF rate-based rule is the middle option between an email and an"
echo "   outage. It is not kept on because it bills per request inspected."
