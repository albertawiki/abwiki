#!/usr/bin/env bash
#
# Turn on CloudFront access logging for alberta.wiki.
#
# Server-side logs, because the alternative is a script in every reader's
# browser. A site that asks to be trusted about data should not be running
# surveillance on the people reading it, and there is nothing in the plan for
# this project that a request log cannot answer: which figures get opened,
# which permalinks get shared, where readers arrive from, whether they come
# back. Wikipedia works this way. Our World in Data runs Google Analytics with
# a cookie banner, which is the thing being avoided.
#
# Costs effectively nothing. This is CloudFront *standard* logging to S3, which
# carries no CloudFront charge at all — you pay S3 storage and PUT requests on
# a few megabytes a month. Standard logging v2 and real-time logs both bill per
# GB ingested; neither buys anything this site needs.
#
# Idempotent: safe to re-run. Run it once, by hand, with credentials for the
# account that owns the distribution.
#
#   bash scripts/setup-cloudfront-logging.sh
#
# There is no infrastructure-as-code in this repository — the AWS setup was
# done by hand and is written down in docs/DEPLOYMENT.md. This script is the
# same idea: the record of what was done, in a form that can be re-run.

set -euo pipefail

BUCKET="ab-wiki-access-logs"

# Not ca-west-1, where the site's own buckets live. CloudFront standard logging
# refuses a bucket in an opt-in region, and Canada West (Calgary) is one — the
# update fails with an access-denied message about bucket ACLs, which sends you
# looking in the wrong place entirely. Canada Central is a standard region, so
# it works, and the logs stay in Canada.
REGION="ca-central-1"

DISTRIBUTION="EV8YWL5VFBSQE"   # alberta.wiki (production)
PREFIX="cloudfront/production/"
RETENTION_DAYS=90

# Every bucket call passes --region explicitly. The CLI's configured default is
# the site's own region, and a bucket call sent to the wrong regional endpoint
# fails complaining about a location constraint rather than about the region,
# which is not where you would look first.

# The canonical id of the AWS account CloudFront delivers standard logs from.
# It is the same in every commercial region and is documented by AWS; it is not
# a secret and not specific to this account.
LOG_DELIVERY_CANONICAL_ID="c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0"

# Only used to read and rewrite one field of the distribution config. `python`
# is not always on PATH on Windows, where it resolves to a Store stub.
PYTHON_BIN="${PYTHON_BIN:-python3}"
command -v "$PYTHON_BIN" >/dev/null || PYTHON_BIN=python
command -v "$PYTHON_BIN" >/dev/null || {
  echo "No python found. Set PYTHON_BIN to an interpreter." >&2
  exit 1
}

OWNER_CANONICAL_ID="$(aws s3api list-buckets --query 'Owner.ID' --output text)"

say() { printf '\n== %s\n' "$1"; }

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

say "Blocking public access"
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

say "Enabling logging on distribution ${DISTRIBUTION}"
CONFIG="$(mktemp)"
UPDATED="$(mktemp)"
trap 'rm -f "$CONFIG" "$UPDATED"' EXIT

# On Git Bash the AWS CLI and Python are native Windows programs and cannot see
# a POSIX path: `file:///tmp/...` fails to load. cygpath translates; everywhere
# else this is the identity.
native() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}

aws cloudfront get-distribution-config --id "$DISTRIBUTION" > "$CONFIG"
ETAG="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["ETag"])' "$(native "$CONFIG")")"

# Edit only the Logging block and send the rest back untouched. The update API
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

json.dump(config, open(target, "w"))
PYTHON

aws cloudfront update-distribution \
  --id "$DISTRIBUTION" \
  --if-match "$ETAG" \
  --distribution-config "file://$(native "$UPDATED")" \
  --query 'Distribution.DistributionConfig.Logging' --output json

say "Done. Logs appear at s3://${BUCKET}/${PREFIX} within about an hour."
echo "   CloudFront batches them, so a quiet site can wait a while for the first file."
