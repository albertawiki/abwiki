#!/usr/bin/env bash
#
# Put alberta.wiki back on the internet after the kill switch took it off.
#
# Deliberately manual, and deliberately separate from the thing that turns it
# off. An automatic recovery would just hand an attacker a loop: flood, get
# switched off, wait, flood again. A person looking at the logs first is the
# whole point of the design.
#
#   bash scripts/cloudfront-enable.sh              # re-enable, leave disarmed
#   bash scripts/cloudfront-enable.sh --rearm      # re-enable and arm the switch
#
# It leaves the switch disarmed by default. If whatever caused this is still
# going on, re-enabling with the switch armed means going straight back off
# again, and the propagation delay makes that cycle expensive rather than safe.

set -euo pipefail

DISTRIBUTION="EV8YWL5VFBSQE"   # alberta.wiki (production)
ARM_PARAMETER="alberta-wiki-killswitch"
REARM=false

[ "${1:-}" = "--rearm" ] && REARM=true

PYTHON_BIN="${PYTHON_BIN:-python3}"
command -v "$PYTHON_BIN" >/dev/null || PYTHON_BIN=python
command -v "$PYTHON_BIN" >/dev/null || { echo "No python found. Set PYTHON_BIN." >&2; exit 1; }

native() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}

CONFIG="$(mktemp)"; UPDATED="$(mktemp)"
trap 'rm -f "$CONFIG" "$UPDATED"' EXIT

printf '\n== Recent traffic, before you turn anything on\n'
aws cloudwatch get-metric-statistics \
  --region us-east-1 --namespace AWS/CloudFront --metric-name BytesDownloaded \
  --dimensions Name=DistributionId,Value="$DISTRIBUTION" Name=Region,Value=Global \
  --start-time "$(date -u -d '6 hours ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-6H +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --period 3600 --statistics Sum \
  --query 'sort_by(Datapoints,&Timestamp)[].{Hour:Timestamp,GiB:Sum}' --output table 2>/dev/null \
  || echo "   (could not read metrics; check the console)"

echo "   Access logs: s3://ab-wiki-access-logs/cloudfront/production/"

printf '\n== Re-enabling %s\n' "$DISTRIBUTION"
aws cloudfront get-distribution-config --id "$DISTRIBUTION" > "$CONFIG"
ETAG="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["ETag"])' "$(native "$CONFIG")")"

"$PYTHON_BIN" - "$(native "$CONFIG")" "$(native "$UPDATED")" <<'PYTHON'
import json, sys
source, target = sys.argv[1:3]
config = json.load(open(source))["DistributionConfig"]
if config["Enabled"]:
    print("   already enabled; nothing to change")
config["Enabled"] = True
json.dump(config, open(target, "w"))
PYTHON

aws cloudfront update-distribution \
  --id "$DISTRIBUTION" --if-match "$ETAG" \
  --distribution-config "file://$(native "$UPDATED")" \
  --query 'Distribution.{Enabled:DistributionConfig.Enabled,Status:Status}' --output json

if [ "$REARM" = true ]; then
  printf '\n== Arming the kill switch\n'
  aws ssm put-parameter --name "$ARM_PARAMETER" --value armed --type String --overwrite >/dev/null
  echo "   armed"
else
  printf '\n== Leaving the kill switch DISARMED\n'
  aws ssm put-parameter --name "$ARM_PARAMETER" --value disarmed --type String --overwrite >/dev/null
  echo "   Re-run with --rearm once you are satisfied it is over."
fi

printf '\n== Done. Propagation takes about five to fifteen minutes.\n'
