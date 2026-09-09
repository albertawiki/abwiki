# Deployment

alberta.wiki is a static build in S3, served through CloudFront. There are two
environments and one rule: **nothing reaches alberta.wiki without a person
looking at it on staging first.**

```
branch
  └─ Deploy to staging  (Actions tab, any branch)
       └─ https://d11nekqs1klb33.cloudfront.net
            └─ you look at it
                 └─ pull request, checks pass, merge
                      └─ Deploy to production  (automatic on main)
                           └─ https://alberta.wiki
```

Staging takes any branch on demand, so a change is reviewable before it is
merged. Merging to `main` publishes. The look at staging happens where it is
useful — while the change can still be turned down.

## `main` is protected

That rule used to depend on remembering it. For a while it was not kept: six
changes went straight to `main` and published without anyone seeing them on
staging first. The branch is now protected, so the sequence is enforced rather
than intended.

- **A pull request is required.** A direct push to `main` is rejected with
  *"Changes must be made through a pull request."*
- **Three checks must pass** before a merge: `Build and test`, `Does it still
  look right`, and `What numbers changed`.
- **`Verify against sources` is deliberately not required.** It is advisory by
  design, because a source revision is a correction to schedule rather than a
  reason to block an unrelated change. `data-freshness.yml` is what raises it.
- **The branch must be up to date** with `main` before merging.
- **Force pushes and deletion are refused**, and the rules apply to
  administrators, so the repository owner cannot bypass them either.
- **Approvals are set to zero**, because a single maintainer cannot approve
  their own pull request and a rule nobody can satisfy is a rule that gets
  switched off.

To change any of this: Settings → Branches → `main`. Turning off *Do not allow
bypassing* is the escape hatch if a required check ever breaks and blocks a
fix.

Both environments run the *same* workflow (`deploy-site.yml`), called with
different inputs. Staging is only a useful rehearsal if it rehearses the real
thing, so the build, upload order, cache headers and verification are identical.

## The two environments

| | Staging | Production |
|---|---|---|
| URL | `d11nekqs1klb33.cloudfront.net` | `alberta.wiki` |
| Bucket | `ab-wiki-staging` | `ab-wiki-static` |
| Distribution | `E1MJ7GJA8392IY` | `EV8YWL5VFBSQE` |
| Deploys | any branch, on demand from the Actions tab | automatically on push to `main` |
| Search engines | blocked with `X-Robots-Tag: noindex, nofollow` | indexed |

Both buckets are private, in `ca-west-1` (Calgary), and readable only by their
own CloudFront distribution through Origin Access Control. Neither is public.

Staging is a **separate bucket**, not a prefix on the production one. Buckets
cost nothing; sharing one would put a `--delete` sync a single typo away from
wiping the live site.

## Previewing a branch

1. Push the branch.
2. Actions → **Deploy to staging** → Run workflow, and pick the branch from the
   dropdown.
3. Open the staging URL and check the figures, especially any chart whose data
   changed.

There is one staging bucket and the last run wins, so staging shows whichever
branch was deployed most recently. The run summary records the branch and
commit; check it before trusting what you are looking at. With one person
working on the site this is the whole cost of sharing an environment, and it
buys not having a CloudFront distribution to tear down for every branch.

Staging is blocked from search engines with `X-Robots-Tag: noindex, nofollow`,
so an unreviewed branch sitting there is not something the public will find.

## Publishing

Merge the pull request. Pushing to `main` runs **Deploy to production**, which
builds, runs the tests, syncs and verifies before the change is live.

Merging is the decision to publish, which is why the preview happens on the
branch. Nothing else stands between `main` and alberta.wiki, so do not merge a
branch you have not looked at on staging.

**Deploy to production** can also be run by hand from the Actions tab against
`main`. That is for re-running a deploy of a commit already on `main` — after a
failed run, or a CloudFront change — not for shipping something new. It refuses
to run on any other branch: the workflow guards on the branch name, the
`production` environment's branch policy allows only `main`, and the deploy
role's trust policy is scoped to the production environment.

## Prerendered routes

The site is a client-rendered React app, so for a while every URL served the
same `index.html` and every title, description and Open Graph tag was applied
by JavaScript. Search engines run JavaScript; social scrapers do not, so every
shared figure link previewed as the site default whichever chart was shared.

`scripts/prerender-routes.mjs` now writes one HTML file per route at build
time, each carrying its own metadata from `metaForRoute` in
`src/figures/catalogue.mjs`. React applies the same values on navigation,
because a single-page app changing route does not re-fetch the document, and a
test asserts the two agree for every route.

Figure pages additionally carry schema.org `Dataset` markup, which is what
puts a chart into a dataset search. It is built by `src/figures/structuredData.mjs`
from the figure's own `dataset()` record — the same title, unit, geography,
`lastChecked` and sources a reader is shown — rather than from a transcription
of them, so it cannot drift from what the page says. The build script reads the
app's data modules directly to do it; `scripts/lib/app-modules.mjs` explains
how, and why a second copy of the metadata was not the answer.

The markup licenses the compilation, not the data. `license` is CC BY 4.0,
covering this site's charts and calculations; the numbers appear as `citation`
and `isBasedOn` pointing at the bodies that published them, and `usageInfo`
says so in the footer's own words. Two datasets have no reporting period in
their rows — a snapshot compared across provinces, and grades against a
guideline — and declare `temporalCoverage` in their `meta` instead. Everything
else derives it, taking fiscal years as April-to-March and quarters as their
three months, because a reference period flattened to a bare year is how a
series gets silently shifted.

Each figure also offers its own chart as the picture a shared link previews
with. `scripts/render-og-images.mjs` photographs `/og/<figure>` — a page that
draws the figure at 1200x630 with the question, the unit, the chart and the
publisher, and nothing else — into `build/og/<figure>.png` at twice that
density. It is a separate page rather than a screenshot of the real card
because the real card carries buttons, a link to itself and a column width set
by the page around it, none of which survives being flattened into an image and
all of which would be in the picture.

It is not part of `npm run build`, because it needs a browser and a chromium
download does not belong in front of every local build. The deploy runs it
between building and uploading, and then checks that one of the images actually
serves as a PNG — a figure whose card is missing previews as a broken image,
and the only place that shows is somebody else's timeline.

The renderer measures the card after drawing it and fails if the chart has been
pushed past its box. The chart components declare a height in pixels, being
built for a page that scrolls, so a title that wraps to a second line squeezes
the chart rather than the card: the first version of the layout did that to four
figures by up to 31px and wrote seventeen perfectly valid PNGs, four of them
with a legend sitting on the source rule.

Two consequences for the deploy:

- **Route objects need an explicit content type.** The URLs have no extension,
  so neither do the files, and `aws s3 sync` types an extensionless object as
  `binary/octet-stream`, which a browser downloads rather than renders. A third
  upload pass re-puts each one as `text/html`. The list comes from
  `scripts/list-routes.mjs`, so adding a figure needs no workflow change.
- **Every route is invalidated**, not just the four unhashed paths. Still never
  `/*`: a fingerprinted asset is a new URL when it changes and never needs it.

The deploy then fetches a figure permalink and fails if it comes back with the
site default title, which is the check that would have caught the original
problem.

## Cost

Effectively nothing.

- CloudFront has no fixed monthly fee and a perpetual free tier of 1 TB out and
  10 million requests. Both distributions are `PriceClass_100` (North America
  and Europe edges only).
- The site is about 2 MB, so S3 storage is a rounding error.
- Access logging is CloudFront **standard** logging to S3, which carries no
  CloudFront charge at all: you pay S3 storage and PUT requests on a few
  megabytes a month, and a lifecycle rule expires them at 90 days. Standard
  logging v2 and real-time logs both bill per GB ingested and buy nothing this
  site needs.
- No WAF, no NAT gateway, and no Route 53 changes for staging — it uses the
  free `*.cloudfront.net` domain and certificate.

The one thing that could cost real money is a runaway invalidation loop. The
deploy invalidates four fixed paths, never `/*`, and only unhashed ones —
fingerprinted assets never need invalidating, because a changed file is a new URL.

## What is already set up

Done on 2026-09-01. You should not need to repeat any of it; this section
exists so it can be audited or rebuilt.

The account id is deliberately not written down here. This repository is
public, and an account id is not a credential but is not worth broadcasting
either. Run `aws sts get-caller-identity` to see which account you are in.

- OIDC provider for `token.actions.githubusercontent.com`
- IAM role `alberta-wiki-deploy`
- Staging bucket, Origin Access Control, response-headers policy, distribution
- GitHub variables and the role-ARN secret
- Access logging, the default root object, and the spend alarms (2026-09-09),
  by `scripts/setup-cloudfront.sh`

### Access logs

Server-side, because the alternative is a script in every reader's browser.
A site that asks to be trusted about data should not be running surveillance on
the people reading it, and a request log answers everything this project set out
to measure: which figures get opened, which permalinks get shared, where readers
arrive from, whether they come back. Wikipedia works this way; Our World in Data
runs Google Analytics behind a cookie banner, which is the thing being avoided.
No script, no cookie, no consent banner, no third party.

Logs land in `s3://ab-wiki-access-logs/cloudfront/production/`, public access
blocked, cookies not logged, and a lifecycle rule deletes them after 90 days —
the same retention Wikimedia applies, and long enough to be useful without
accumulating a pile of raw request data indefinitely.

`scripts/setup-cloudfront.sh` is idempotent and is the record of what was
done. Three things in it are not obvious, and each cost a failed run:

- **The bucket cannot be in an opt-in region.** CloudFront standard logging
  refuses one, and Canada West (Calgary) — where the site's own buckets live —
  is opt-in. The error talks about bucket ACLs and permissions, so it sends you
  looking somewhere else entirely. The log bucket is in Canada Central instead.
- **ACLs have to be enabled** (`BucketOwnerPreferred`). CloudFront delivers logs
  by ACL grant and cannot write to a bucket created with the modern
  `BucketOwnerEnforced` default. That failure is silent: logging reports enabled
  and no file ever arrives.
- **Every bucket call needs an explicit `--region`,** because the CLI default is
  the site's region and the log bucket is not in it.

Staging is deliberately not logged. Its traffic is deploy checks.

### If someone floods the site

The architecture is close to the best case for this, and the site would very
likely stay up: static files behind CloudFront, S3 reachable only through
Origin Access Control with all public access blocked, `GET` and `HEAD` only, no
database or server to exhaust. Shield Standard is on automatically and free and
covers the volumetric layer. The cache policy is CachingOptimized, so query
strings are not in the cache key and `?cachebust=` tricks do not work.

**The exposure is the bill, not availability.** Past the perpetual free tier of
1 TB out and 10 million requests a month, it is roughly $1 per million requests
and $0.085/GB out. Measured against real response sizes: a naive flood of `/`
pulls 721 bytes a time and a day of 1,000 req/s costs on the order of $80; the
same volume aimed at a 125 KB social card is nearer $900 a day.

That second number is the one to understand, because the edge cache does not
help with it. **CloudFront bills for bytes delivered to the viewer whether they
came from the cache or the origin.** A cache hit protects S3 and the origin
transfer; it does nothing for egress. So the cards, and the 196 KB JavaScript
bundle, are as expensive on their millionth hit as their first. It takes a
deliberate choice of a large object to run that up — a dumb flood of `/` is
cheap — but it is not a hard choice to make.

Nothing in AWS caps spending. A budget notifies; it does not throttle. So how
fast you are told is the whole of the exposure, and billing data trails by up
to a day, which is why the two CloudWatch alarms exist: they run on
CloudFront's free default metrics at one-minute granularity and fit inside the
ten-alarm free tier.

- `alberta-wiki-request-spike` — more than 50,000 requests in five minutes,
  about 167 a second. Above anything organic, including a link doing well.
- `alberta-wiki-egress-spike` — more than 50 GiB in an hour, roughly
  thirty-five times a normal hour against the free tier.

Both notify the `alberta-wiki-alerts` SNS topic in us-east-1. An email
subscription has to be confirmed from the message AWS sends before it can
deliver anything.

### The kill switch

Alerts assume somebody is awake. A second tier of alarm is wired to a Lambda
that takes the site off the internet instead:

- `alberta-wiki-egress-emergency` — more than 150 GiB in an hour, roughly $13
  an hour of transfer and climbing.
- `alberta-wiki-request-emergency` — more than three million requests in five
  minutes, ten thousand a second.

Egress does the work. Requests bill at about a dollar a million, so even 667 a
second all day is under $60, and taking the site down over that would trade
real downtime for a small bill. The request trigger sits where it can only mean
an attack.

**This is a genuine trade and worth naming.** An automatic kill switch hands an
attacker a cheap way to take the site down and keep it down. For a project
funded out of somebody's pocket, an hour offline is recoverable and a
four-figure invoice is not — that is the trade being made, not an oversight.
Disabling also propagates over five to fifteen minutes, so it caps the damage
rather than stopping it dead.

Four things the function will not do: turn the site back on, act on a recovery
notification, act twice when the distribution is already disabled, or act while
disarmed. It publishes to the same topic it subscribes to, so it also ignores
any message that is not a CloudWatch alarm — otherwise it would answer itself
forever.

```bash
# the off switch, for launch week or any expected spike
aws ssm put-parameter --name alberta-wiki-killswitch --value disarmed   --overwrite --region us-east-1

# ...and back on
aws ssm put-parameter --name alberta-wiki-killswitch --value armed   --overwrite --region us-east-1

# after it fires: read the logs first, then
bash scripts/cloudfront-enable.sh            # re-enable, switch left disarmed
bash scripts/cloudfront-enable.sh --rearm    # re-enable and arm
```

Recovery is deliberately manual and deliberately separate from the thing that
fires. An automatic recovery would just hand an attacker a loop: flood, get
switched off, wait, flood again.

The function's IAM policy allows exactly three actions on exactly one
distribution. Something that can disable the site should not be able to do
anything else to it.

It was tested end to end against the **staging** distribution — disabled it,
confirmed the second firing was a no-op, re-enabled it, and restored the
production-only policy. The disarmed, recovery-notification and
ignore-its-own-message paths were tested directly. Testing a kill switch by
reading it is not testing it.

If an alarm fires and it really is a flood, the fast lever is an AWS WAF
rate-based rule attached to the distribution: about $5 a month for the web ACL,
$1 per rule, and $0.60 per million requests inspected. It is not kept on
permanently because it bills per request and the whole point of this stack is
that it costs nothing at rest. Shield Advanced would cover the overage but
costs $3,000 a month, which is not proportionate to a static site.

Thresholds are first guesses made with no traffic history. Revisit them once
there is a month of real numbers to compare against.

### The deploy role

GitHub Actions assumes it with a short-lived OIDC token. **No AWS access keys
are stored in GitHub.** The trust policy accepts exactly two subjects:

```
repo:albertawiki/abwiki:environment:staging
repo:albertawiki/abwiki:environment:production
```

Note these are **environment** subjects, not branch ones. When a job declares an
`environment:`, GitHub changes the OIDC token's `sub` claim from the ref form
(`repo:owner/name:ref:refs/heads/main`) to the environment form. A trust policy
written against the ref form fails with *"Not authorized to perform
sts:AssumeRoleWithWebIdentity"* even though the workflow is on the right branch —
which is exactly how this was first configured, and how it first failed.

Branch restriction is therefore enforced on the GitHub side instead, per
environment:

- **`production`** has a deployment branch policy allowing only `main`.
- **`staging`** has no branch policy, so any branch can deploy to it. That is
  what makes a branch previewable before it is merged.

```bash
gh api repos/albertawiki/abwiki/environments/production/deployment-branch-policies   --jq '.branch_policies[].name'
```

A workflow on a branch other than `main` cannot select the `production`
environment, so it never gets a token the role will accept for the production
bucket. Both subjects share one role, so the role's policy grants write access
to both buckets; the environment is what decides which one a given run can
reach. **Known weakness.** One role serving both environments means a staging token
carries production permissions that only the workflow's inputs keep it from
using. A branch preview runs the workflow file *from that branch*, so someone
with push access could edit `deploy-site.yml` on a branch to point a staging run
at the production bucket. Before staging accepted branches this was impossible,
because no branch but `main` could get a token at all.

The fix is two roles, one bucket each, trusted by one environment each. Until
then the control is that push access is the control: everyone who can open a
branch here can already merge to `main`.

Its permissions are deliberately narrow:

| Allowed | On |
|---|---|
| `s3:ListBucket` | the two site buckets |
| `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` | objects in those two buckets |
| `cloudfront:CreateInvalidation`, `cloudfront:GetInvalidation` | the two distributions |

It **cannot** make a bucket public, reconfigure or repoint a distribution, touch
any other bucket in the account, or create users, keys or roles. If the workflow
were ever compromised it could replace site content — which a deploy role must be
able to do — and nothing else.

To audit it:

```bash
aws iam get-role --role-name alberta-wiki-deploy \
  --query 'Role.AssumeRolePolicyDocument'
aws iam get-role-policy --role-name alberta-wiki-deploy \
  --policy-name alberta-wiki-deploy
```

### GitHub configuration

Variables are visible in Actions logs; the role ARN is a secret only because it
names the account. None of these is a credential.

| | |
|---|---|
| `AWS_REGION` | `ca-west-1` |
| `AWS_S3_BUCKET` | `ab-wiki-static` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `EV8YWL5VFBSQE` |
| `AWS_S3_BUCKET_STAGING` | `ab-wiki-staging` |
| `CLOUDFRONT_DISTRIBUTION_ID_STAGING` | `E1MJ7GJA8392IY` |
| `STAGING_URL` | the staging CloudFront domain |
| `AWS_DEPLOY_ROLE_ARN` *(secret)* | the role above |

## Recommended, not yet done

- **Stop using root access keys locally.** The account's CLI credentials are
  root keys, which is the highest-risk credential AWS issues — they cannot be
  scoped, and revoking them means rotating everything that used them. Create an
  IAM user or an IAM Identity Center login for day-to-day work and delete the
  root keys. This does not affect deploys, which use the OIDC role and no keys.
- **Enable versioning on the production bucket**, so a bad deploy can be rolled
  back object by object rather than only by redeploying:

  ```bash
  aws s3api put-bucket-versioning --bucket ab-wiki-static \
    --versioning-configuration Status=Enabled
  ```

  Pennies at this size. Pair it with a lifecycle rule expiring noncurrent
  versions after 30 days.
- **Protect `main`** — require a pull request and the `Build and test` check
  before merging. Worth having even working alone: it means a deploy only ever
  runs on code that built and passed its tests.

## Cache behaviour

| Path | `Cache-Control` | Why |
|---|---|---|
| `/static/**` | `max-age=31536000, immutable` | Filenames contain a content hash, so a changed file is a new URL. |
| `/index.html` and everything else | `max-age=0, must-revalidate` | Stable names. Must never be served stale, or a deploy is invisible for hours. |

The workflow uploads `/static/**` **before** the entry point, so a visitor never
receives an `index.html` referencing assets that are not uploaded yet.

## Single-page routing

The site uses client-side routing, so `/faq` and `/contribute` are not objects in
S3. Both distributions map a 403 from S3 to `/index.html` with a 200, which is
what makes those URLs work. If you rebuild a distribution, reproduce it:

- HTTP error code `403` (S3 with Origin Access Control — what we use) or `404`
  (S3 website endpoint)
- Response page path `/index.html`
- HTTP response code `200`

## Rolling back

Deploys are file uploads, so the fastest rollback is to redeploy a known good
commit: revert the offending commit on `main` and let the push deploy the
revert, or check out the last good commit on `main` and run **Deploy to
production** by hand. With bucket versioning enabled you
can also restore previous object versions directly.

## Manual deploy

Prefer the workflow, which runs the tests first. If you ever need to deploy from
a laptop:

```bash
npm ci && npm run build

BUCKET=ab-wiki-staging      # or ab-wiki-static for production
DIST=E1MJ7GJA8392IY         # or EV8YWL5VFBSQE

aws s3 sync build/ "s3://$BUCKET/" --exclude "*" --include "static/*" \
  --cache-control "public, max-age=31536000, immutable"
aws s3 sync build/ "s3://$BUCKET/" --exclude "static/*" \
  --cache-control "public, max-age=0, must-revalidate" --delete
aws cloudfront create-invalidation --distribution-id "$DIST" \
  --paths "/" "/index.html"
```
