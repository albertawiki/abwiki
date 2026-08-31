# Deployment

alberta.wiki is a static build in S3, served through CloudFront. Pushing to
`main` builds, tests, uploads and invalidates automatically.

```
GitHub push to main
  └─ .github/workflows/deploy.yml
       ├─ npm ci → test → build
       ├─ assume an AWS role via OIDC (no long-lived keys)
       ├─ sync build/static/*  → S3, cached one year, immutable
       ├─ sync everything else → S3, must-revalidate, --delete
       ├─ CloudFront invalidation (waits for completion)
       └─ verify https://alberta.wiki returns 200
```

## One-time AWS setup

You need this once. Everything after is automatic.

Set these shell variables to match your account, then paste the blocks below.

```bash
AWS_ACCOUNT_ID=123456789012
BUCKET=alberta-wiki-site              # your existing bucket
DISTRIBUTION_ID=E1234567890ABC        # the CloudFront distribution for alberta.wiki
GITHUB_REPO=albertawiki/abwiki
```

To find the distribution ID for the current site:

```bash
aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(Aliases.Items, 'alberta.wiki')].[Id,DomainName]" \
  --output text
```

### 1. Let GitHub Actions assume a role (OIDC)

This replaces long-lived access keys. GitHub presents a short-lived token; AWS
trusts it only for this repository.

Create the identity provider once per account:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

If it already exists, that command errors harmlessly.

### 2. Create the deploy role

```bash
cat > trust-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:${GITHUB_REPO}:ref:refs/heads/main"
      }
    }
  }]
}
JSON

aws iam create-role \
  --role-name alberta-wiki-deploy \
  --assume-role-policy-document file://trust-policy.json
```

The `sub` condition is the important line: it restricts the role to this
repository's `main` branch. A fork or a pull request branch cannot assume it.

### 3. Grant it exactly what it needs

```bash
cat > deploy-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::${BUCKET}"
    },
    {
      "Sid": "WriteObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::${BUCKET}/*"
    },
    {
      "Sid": "InvalidateCache",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::${AWS_ACCOUNT_ID}:distribution/${DISTRIBUTION_ID}"
    }
  ]
}
JSON

aws iam put-role-policy \
  --role-name alberta-wiki-deploy \
  --policy-name alberta-wiki-deploy \
  --policy-document file://deploy-policy.json
```

No `s3:PutBucketPolicy`, no `cloudfront:UpdateDistribution`. If the workflow is
ever compromised it can replace site content — which a deploy role must be able
to do — but it cannot make the bucket public or repoint the distribution.

### 4. Tell GitHub about it

```bash
gh variable set AWS_REGION --body "ca-central-1"
gh variable set AWS_S3_BUCKET --body "$BUCKET"
gh variable set CLOUDFRONT_DISTRIBUTION_ID --body "$DISTRIBUTION_ID"
gh secret   set AWS_DEPLOY_ROLE_ARN --body "arn:aws:iam::${AWS_ACCOUNT_ID}:role/alberta-wiki-deploy"
```

Variables are visible in the Actions log; the role ARN is a secret only because
it names the account. Nothing here is a credential.

### 5. Protect the environment (optional but recommended)

In **Settings → Environments → production**, add yourself as a required
reviewer if you want to approve each deploy, and restrict the environment to the
`main` branch. Since it is a public data site, the more useful protection is the
branch rule below.

### 6. Protect `main`

In **Settings → Rules → Rulesets**, require:

- a pull request before merging,
- the `Build and test` status check to pass,
- branches to be up to date before merging.

Even working alone this is worth having: it means the deploy workflow only ever
runs on code that built and passed tests.

## Cache behaviour

| Path | `Cache-Control` | Why |
|---|---|---|
| `/static/**` | `max-age=31536000, immutable` | Filenames contain a content hash, so a changed file is a new URL. |
| `/index.html` and everything else | `max-age=0, must-revalidate` | Stable names. Must never be served stale, or a deploy is invisible for hours. |

The workflow uploads `/static/**` **before** the entry point, so a visitor never
receives an `index.html` referencing assets that are not uploaded yet.

Only unhashed paths are invalidated. Invalidating `/*` on every deploy is
wasteful — the hashed assets never need it, and CloudFront charges beyond the
first 1,000 paths a month.

## Single-page routing

The site uses client-side routing, so `/faq` and `/contribute` are not objects in
S3. This already works on the live distribution: requests for missing paths
return `/index.html` with a 200. If you rebuild the distribution, reproduce it
with a CloudFront custom error response:

- HTTP error code `403` (S3 with OAC) or `404` (S3 website endpoint)
- Response page path `/index.html`
- HTTP response code `200`

## Rolling back

Deploys are just file uploads, so the fastest rollback is to redeploy a known
good commit:

```bash
gh workflow run deploy.yml --ref <good-commit-sha>
```

Or revert the offending commit on `main` and let the push deploy it. If you
enable S3 object versioning on the bucket, you can also restore previous object
versions directly, which is worth turning on:

```bash
aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled
```

## Manual deploy

If you ever need to deploy from a laptop:

```bash
npm ci && npm run build
aws s3 sync build/ "s3://$BUCKET/" --exclude "*" --include "static/*" \
  --cache-control "public, max-age=31536000, immutable"
aws s3 sync build/ "s3://$BUCKET/" --exclude "static/*" \
  --cache-control "public, max-age=0, must-revalidate" --delete
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" \
  --paths "/" "/index.html"
```

Prefer the workflow — it runs the tests first.
