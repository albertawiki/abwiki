#!/usr/bin/env bash
#
# The production CloudFront setup that is not in a workflow: access logging,
# the default root object, and the alarms that say something is wrong before
# the bill does.
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
# bill. Run it without, and the topic and alarms are still created — only the
# subscription is skipped. (Written as a placeholder rather than the usual
# example.com address because check-secrets refuses any address not on its
# allow list, which is the correct behaviour and not worth an exception.)

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
# alarms and the topic they notify have to live there too.
ALARM_REGION="us-east-1"
TOPIC_NAME="alberta-wiki-alerts"

# Roughly 167 requests a second sustained for five minutes. Comfortably above a
# link doing well on Reddit, comfortably below nothing. Tune it once there is a
# month of real traffic to compare against.
REQUEST_THRESHOLD=50000
REQUEST_PERIOD=300

# 50 GB in an hour, against a free tier of 1 TB a month — about thirty-five
# times a normal hour. This is the one that matters: CloudFront bills for bytes
# delivered to the viewer whether they came from the edge cache or the origin,
# so egress is the number that turns into money.
BYTES_THRESHOLD=53687091200   # 50 GiB
BYTES_PERIOD=3600

# Every bucket call passes --region explicitly. The CLI's configured default is
# the site's own region, and a bucket call sent to the wrong regional endpoint
# fails complaining about a location constraint rather than about the region,
# which is not where you would look first.

# The canonical id of the AWS account CloudFront delivers standard logs from.
# It is the same in every commercial region and is documented by AWS; it is not
# a secret and not specific to this account.
LOG_DELIVERY_CANONICAL_ID="c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0"

# Only used to read and rewrite the distribution config. `python` is not always
# on PATH on Windows, where it resolves to a Store stub.
PYTHON_BIN="${PYTHON_BIN:-python3}"
command -v "$PYTHON_BIN" >/dev/null || PYTHON_BIN=python
command -v "$PYTHON_BIN" >/dev/null || {
  echo "No python found. Set PYTHON_BIN to an interpreter." >&2
  exit 1
}

# On Git Bash the AWS CLI and Python are native Windows programs and cannot see
# a POSIX path: `file:///tmp/...` fails to load. cygpath translates; everywhere
# else this is the identity.
native() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}

say() { printf '\n== %s\n' "$1"; }

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
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET" --region "$REGION" \
  --lifecycle-configuration "{
    \"Rules\": [{
      \"ID\": \"expire-access-logs\",
      \"Status\": \"Enabled\",
      \"Filter\": { \"Prefix\": \"${PREFIX}\" },
      \"Expiration\": { \"Days\": ${RETENTION_DAYS} },
      \"AbortIncompleteMultipartUpload\": { \"DaysAfterInitiation\": 7 }
    }]
  }"
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
CONFIG="$(mktemp)"
UPDATED="$(mktemp)"
trap 'rm -f "$CONFIG" "$UPDATED"' EXIT

aws cloudfront get-distribution-config --id "$DISTRIBUTION" > "$CONFIG"
ETAG="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["ETag"])' "$(native "$CONFIG")")"

# Edit only the two fields and send the rest back untouched. The update API
# replaces the entire configuration, so anything dropped here is a live change
# to how the site is served.
"$PYTHON_BIN" - "$(native "$CONFIG")" "$(native "$UPDATED")" "$BUCKET" "$REGION" "$PREFIX" <<'PYTHON'
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
  --distribution-config "file://$(native "$UPDATED")" \
  --query 'Distribution.DistributionConfig.{Logging:Logging,DefaultRootObject:DefaultRootObject}' \
  --output json

# ---------------------------------------------------------------------------
# Alarms
#
# The only existing alert is an AWS Budget, and billing data trails by up to a
# day. Nothing in AWS caps spending — a budget notifies, it does not throttle —
# so how fast you are told is the whole of the exposure. These are on
# CloudFront's free default metrics at one-minute granularity, and fit inside
# the ten-alarm CloudWatch free tier.
# ---------------------------------------------------------------------------

say "Alert topic ${TOPIC_NAME} (${ALARM_REGION})"
TOPIC_ARN="$(aws sns create-topic --name "$TOPIC_NAME" --region "$ALARM_REGION" --query TopicArn --output text)"
echo "   ${TOPIC_ARN//[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]/<account>}"

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

say "Alarm: request rate"
aws cloudwatch put-metric-alarm \
  --region "$ALARM_REGION" \
  --alarm-name "alberta-wiki-request-spike" \
  --alarm-description "CloudFront requests far above anything organic. Check the access logs before assuming a flood; a link doing well looks similar at first." \
  --namespace AWS/CloudFront --metric-name Requests --statistic Sum \
  --dimensions Name=DistributionId,Value="$DISTRIBUTION" Name=Region,Value=Global \
  --period "$REQUEST_PERIOD" --evaluation-periods 1 \
  --threshold "$REQUEST_THRESHOLD" --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions "$TOPIC_ARN" --ok-actions "$TOPIC_ARN"
echo "   > ${REQUEST_THRESHOLD} requests in ${REQUEST_PERIOD}s"

say "Alarm: egress"
aws cloudwatch put-metric-alarm \
  --region "$ALARM_REGION" \
  --alarm-name "alberta-wiki-egress-spike" \
  --alarm-description "CloudFront is sending far more data than a normal hour. This is the one that turns into money: egress is billed whether the bytes came from the edge cache or the origin." \
  --namespace AWS/CloudFront --metric-name BytesDownloaded --statistic Sum \
  --dimensions Name=DistributionId,Value="$DISTRIBUTION" Name=Region,Value=Global \
  --period "$BYTES_PERIOD" --evaluation-periods 1 \
  --threshold "$BYTES_THRESHOLD" --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions "$TOPIC_ARN" --ok-actions "$TOPIC_ARN"
echo "   > $((BYTES_THRESHOLD / 1024 / 1024 / 1024)) GiB in ${BYTES_PERIOD}s"

say "Done."
echo "   Logs:   s3://${BUCKET}/${PREFIX}"
echo "   Alarms: ${ALARM_REGION} / alberta-wiki-request-spike, alberta-wiki-egress-spike"
echo ""
echo "   If an alarm fires and it really is a flood, the fast lever is a WAF"
echo "   rate-based rule attached to the distribution. It is not kept on"
echo "   permanently because it bills per request inspected."
