"""
Take alberta.wiki offline when it is costing real money, and say so.

CloudFront bills for bytes delivered to the viewer whether they came from the
edge cache or the origin, and nothing in AWS caps spending — a budget notifies,
it does not throttle. For a project funded out of somebody's pocket, an hour of
downtime is recoverable and a four-figure invoice is not. This is that
preference, written down and automated.

It is deliberately hard to trip. Two tiers of alarm exist: the ones that send
an email, at thresholds a busy day might reach, and the ones wired to this, at
thresholds nothing organic reaches. Only the second kind should ever get here.

What it will not do:

  - **Turn the site back on.** Re-enabling is a person's decision, made after
    looking at the access logs. `scripts/cloudfront-enable.sh`.
  - **Act on a recovery.** CloudWatch notifies on the way back to OK as well,
    and disabling a site because it stopped being attacked would be absurd.
  - **Act twice.** If the distribution is already disabled there is nothing to
    do, and repeated updates would just extend the propagation window.
  - **Act while disarmed.** `alberta-wiki-killswitch` in SSM Parameter Store
    is the off switch, for launch week or any other time a spike is expected
    and downtime is worse than a bill.

The honest limitation: disabling a distribution propagates over roughly five to
fifteen minutes, so this caps the damage rather than stopping it dead.
"""

import json
import os

import boto3

cloudfront = boto3.client("cloudfront")
sns = boto3.client("sns")
ssm = boto3.client("ssm")

DISTRIBUTION_ID = os.environ["DISTRIBUTION_ID"]
TOPIC_ARN = os.environ["TOPIC_ARN"]
ARM_PARAMETER = os.environ.get("ARM_PARAMETER", "alberta-wiki-killswitch")


def announce(subject, body):
    """Tell the same topic the alarm came from, so it reaches the same inbox."""
    sns.publish(TopicArn=TOPIC_ARN, Subject=subject[:100], Message=body)


def armed():
    """Whether the switch is live. Anything but 'armed' means it is not."""
    try:
        value = ssm.get_parameter(Name=ARM_PARAMETER)["Parameter"]["Value"]
    except ssm.exceptions.ParameterNotFound:
        # A missing parameter is not permission to take the site down.
        return False
    return value.strip().lower() == "armed"


def alarms_in(event):
    """The CloudWatch alarm notifications in an SNS event, if any.

    This function publishes to the same topic it is subscribed to, so it will
    be handed its own messages. Those are not alarm notifications and are
    filtered out here — without this it would answer itself forever.
    """
    for record in event.get("Records", []):
        raw = record.get("Sns", {}).get("Message", "")
        try:
            message = json.loads(raw)
        except (ValueError, TypeError):
            continue
        if isinstance(message, dict) and "AlarmName" in message and "NewStateValue" in message:
            yield message


def disable():
    """Set Enabled to false, leaving the rest of the configuration alone."""
    current = cloudfront.get_distribution_config(Id=DISTRIBUTION_ID)
    config = current["DistributionConfig"]

    if not config["Enabled"]:
        return False

    config["Enabled"] = False
    cloudfront.update_distribution(
        Id=DISTRIBUTION_ID,
        IfMatch=current["ETag"],
        DistributionConfig=config,
    )
    return True


def handler(event, context):
    triggers = [a for a in alarms_in(event) if a.get("NewStateValue") == "ALARM"]

    if not triggers:
        return {"action": "none", "reason": "no alarm in ALARM state in this event"}

    names = ", ".join(sorted({a["AlarmName"] for a in triggers}))
    reasons = "\n".join(f"  {a['AlarmName']}: {a.get('NewStateReason', '')}" for a in triggers)

    if not armed():
        announce(
            f"alberta.wiki: {names} fired, kill switch DISARMED",
            "The traffic alarm below fired, but the kill switch is disarmed, so\n"
            "the site is still serving and still billing.\n\n"
            f"{reasons}\n\n"
            f"Arm it again with:\n"
            f"  aws ssm put-parameter --name {ARM_PARAMETER} --value armed --overwrite\n",
        )
        return {"action": "none", "reason": "disarmed", "alarms": names}

    changed = disable()

    if not changed:
        announce(
            f"alberta.wiki: {names} fired, already offline",
            "The distribution was already disabled, so nothing was changed.\n\n"
            f"{reasons}\n",
        )
        return {"action": "none", "reason": "already disabled", "alarms": names}

    announce(
        f"alberta.wiki TAKEN OFFLINE: {names}",
        "alberta.wiki has been disabled automatically because it was serving\n"
        "enough traffic to cost real money.\n\n"
        f"{reasons}\n\n"
        "The change propagates over about five to fifteen minutes, so some\n"
        "traffic will still be served — and billed — in the meantime.\n\n"
        "Before turning it back on, look at what happened:\n"
        "  aws s3 ls s3://ab-wiki-access-logs/cloudfront/production/ --recursive\n\n"
        "Then, when you are ready:\n"
        "  bash scripts/cloudfront-enable.sh\n\n"
        "If this was a real reader spike rather than an attack, raise the\n"
        "emergency thresholds in scripts/setup-cloudfront.sh before re-enabling,\n"
        "or disarm the switch while the traffic lasts.\n",
    )

    return {"action": "disabled", "distribution": DISTRIBUTION_ID, "alarms": names}
