# Deployment

alberta.wiki is a static build in S3, served through CloudFront. There are two
environments and one rule: **nothing reaches alberta.wiki without a person
looking at it on staging first.**

```
merge to main
  └─ Deploy to staging  (automatic)
       └─ https://d11nekqs1klb33.cloudfront.net
            └─ you look at it
                 └─ Deploy to production  (manual, from the Actions tab)
                      └─ https://alberta.wiki
```

Both environments run the *same* workflow (`deploy-site.yml`), called with
different inputs. Staging is only a useful rehearsal if it rehearses the real
thing, so the build, upload order, cache headers and verification are identical.

## The two environments

| | Staging | Production |
|---|---|---|
| URL | `d11nekqs1klb33.cloudfront.net` | `alberta.wiki` |
| Bucket | `ab-wiki-staging` | `ab-wiki-static` |
| Distribution | `E1MJ7GJA8392IY` | `EV8YWL5VFBSQE` |
| Deploys | automatically on merge to `main` | manually, from the Actions tab |
| Search engines | blocked with `X-Robots-Tag: noindex, nofollow` | indexed |

Both buckets are private, in `ca-west-1` (Calgary), and readable only by their
own CloudFront distribution through Origin Access Control. Neither is public.

Staging is a **separate bucket**, not a prefix on the production one. Buckets
cost nothing; sharing one would put a `--delete` sync a single typo away from
wiping the live site.

## Promoting to production

1. Merge to `main`. Staging deploys on its own.
2. Open the staging URL and check the figures — especially any chart whose data
   changed.
3. Actions → **Deploy to production** → Run workflow, on `main`, and tick
   *"I have looked at the staging site and it is correct"*.

The tick box is not ceremony. It is the only thing between a merge and the live
site, and it exists so that promoting is a decision somebody made rather than
something that happened.

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

Done on 2026-09-01, in account `ACCOUNT_ID_REDACTED`. You should not need to repeat any
of it; this section exists so it can be audited or rebuilt.

- OIDC provider for `token.actions.githubusercontent.com`
- IAM role `alberta-wiki-deploy`
- Staging bucket, Origin Access Control, response-headers policy, distribution
- GitHub variables and the role-ARN secret

### The deploy role

GitHub Actions assumes it with a short-lived OIDC token. **No AWS access keys
are stored in GitHub.** The trust policy accepts exactly one subject:

```
repo:albertawiki/abwiki:ref:refs/heads/main
```

so a workflow on any other branch — or in a fork — cannot assume it at all.

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
commit: check it out on `main` and run **Deploy to production** again, or revert
the offending commit and promote the revert. With bucket versioning enabled you
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
