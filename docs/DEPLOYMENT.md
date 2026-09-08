# Deployment

alberta.wiki is a static build in S3, served through CloudFront. There are two
environments and one rule: **nothing reaches alberta.wiki without a person
looking at it on staging first.**

```
branch
  └─ Deploy to staging  (Actions tab, any branch)
       └─ https://d11nekqs1klb33.cloudfront.net
            └─ you look at it
                 └─ merge the pull request
                      └─ Deploy to production  (automatic on main)
                           └─ https://alberta.wiki
```

Staging takes any branch on demand, so a change is reviewable before it is
merged. Merging to `main` publishes. The look at staging happens where it is
useful — while the change can still be turned down.

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

## Cost

Effectively nothing.

- CloudFront has no fixed monthly fee and a perpetual free tier of 1 TB out and
  10 million requests. Both distributions are `PriceClass_100` (North America
  and Europe edges only).
- The site is about 2 MB, so S3 storage is a rounding error.
- No CloudFront access logging, no WAF, no NAT gateway, and no Route 53 changes
  for staging — it uses the free `*.cloudfront.net` domain and certificate.

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
