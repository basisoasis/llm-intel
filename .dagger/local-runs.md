# Local Runs & CI Setup

## Why not `.env` files?

`.env` files are the most common way to manage secrets locally - and the most
dangerous. The risks are not theoretical:

- **Accidental git commits**: `.env` is easy to forget in `.gitignore`,
  especially in monorepos or when initialising a new project. Once committed,
  the secret is in git history permanently, even after deletion.
- **Accidental sharing**: `.env` files get attached to Slack messages, copied
  into Notion, pasted into support tickets, and checked into dotfiles repos.
  Secrets travel with the file.
- **No audit trail**: there is no record of who has a copy, who read a value,
  or when a secret was last rotated. If a key leaks, you have no idea how.
- **No revocation**: if a `.env` file is compromised, every developer who has
  a copy needs to be tracked down manually before the secret can safely be
  rotated.

Secrets should never touch the filesystem. They should be injected directly
into the process environment at runtime, scoped to a single execution, and
never written to disk.

---

## Alternatives

There is no shortage of secrets management tools. The main options worth
knowing about:

**Cloud-native (provider-locked)**

- **AWS Secrets Manager**: deeply integrated with the AWS ecosystem. The
  right choice if you are all-in on AWS and want managed rotation with native
  IAM policies. Not practical outside of AWS.
- **Azure Key Vault**: Microsoft's equivalent for the Azure ecosystem.
  Excellent for enterprises already running on Azure. Similarly locked to one
  cloud.
- **GCP Secret Manager**: Google Cloud's offering. Same tradeoff: great
  within GCP, irrelevant outside of it.

**Self-hosted / open source**

- **HashiCorp Vault**: the industry standard for large-scale secrets
  management. Extremely powerful: dynamic secrets, PKI, encryption-as-a-service,
  multi-cloud. Also extremely complex - requires dedicated infrastructure,
  operational expertise, and ongoing maintenance. Overkill for most projects.

**Developer-first SaaS**

- **Doppler**: purpose-built for developer workflows. Excellent CI/CD
  integrations, clean CLI, environment syncing across dev/staging/prod.
  Managed service only (not open source).
- **Infisical**: open source, self-hostable, and growing fast. Modern UI,
  strong CLI, and covers secrets management, certificate management, and secret
  scanning in one platform. Cloud managed or self-hosted.

---

## Why Doppler and Infisical

The cloud-native options (AWS Secrets Manager, Azure Key Vault) are excellent
within their ecosystems but introduce vendor lock-in and are overkill for a
project that is not exclusively on one cloud. HashiCorp Vault is the most
capable tool available but requires infrastructure and operational overhead
that is not justified here.

Doppler and Infisical hit the right point on the curve: no `.env` files, no
vendor lock-in, minimal setup, and a developer experience that does not get
in the way. Both have a clean CLI, first-class CI/CD support, and make secret
rotation a one-step operation. Infisical adds the option to self-host if that
ever becomes a requirement.

---

## Secrets reference

Your secrets must be named exactly as follows in Infisical under the
`production` environment:

| Secret name                      | Description                        |
|----------------------------------|------------------------------------|
| `LLM_INTEL_OPEN_ROUTER_API_KEY`  | OpenRouter API key                 |
| `R2_ACCOUNT_ID`                  | Cloudflare account ID              |
| `R2_ACCESS_KEY_ID`               | R2 API token - access key ID       |
| `R2_SECRET_ACCESS_KEY`           | R2 API token - secret access key   |
| `R2_BUCKET`                      | R2 bucket name                     |
| `GITHUB_TOKEN`                   | GitHub personal access token       |

---

## CI setup - Infisical + GitHub Actions

The workflows authenticate to Infisical using **OIDC** - no static credentials
stored in GitHub at all. GitHub issues a short-lived token at runtime, Infisical
verifies it, and secrets are injected into the workflow environment for the
duration of the job only.

### 1. Create a Machine Identity in Infisical

1. Go to your Infisical project → **Access Control → Machine Identities**
2. Click **Create Identity** - name it `llm-intel-ci`
3. Remove the default **Universal Auth** method
4. Add **OIDC Auth** and fill in the following fields:

   | Field                  | Value                                                                 |
   |------------------------|-----------------------------------------------------------------------|
   | OIDC Discovery URL     | `https://token.actions.githubusercontent.com/.well-known/openid-configuration` |
   | Issuer URL             | `https://token.actions.githubusercontent.com`                         |
   | Subject                | `repo:your-org/llm-intel:*`                                           |

   The Discovery URL and Issuer URL are fixed GitHub values - they are the same
   for every repository.

   The Subject controls which workflows can authenticate with this identity.
   Two common approaches:

   - `repo:your-org/llm-intel:ref:refs/heads/main`: locked to pushes from
     `main` only. More restrictive - `workflow_dispatch` runs from other
     branches will fail to authenticate.
   - `repo:your-org/llm-intel:*`: allows any branch and any trigger. Less
     restrictive but still scoped to your repository - no other repo can
     authenticate with this identity.

   This project uses the wildcard form so that both the schedule and manual
   `workflow_dispatch` triggers work regardless of which branch they are
   invoked from.

5. Assign the identity to your project with the **secrets-reader** role
6. Copy the **Identity ID**

### 2. Add GitHub Actions variables

These are **variables** (not secrets) - neither value is sensitive:

| Variable name                   | Value                              |
|---------------------------------|------------------------------------|
| `INFISICAL_MACHINE_IDENTITY_ID` | The Identity ID from step 1        |
| `INFISICAL_PROJECT_SLUG`        | Your Infisical project slug        |

Set these under **GitHub repo → Settings → Secrets and variables → Actions → Variables**.

### 3. Optional - Dagger Cloud

If you have a Dagger Cloud account, add `DAGGER_CLOUD_TOKEN` as a GitHub
**secret** for pipeline observability. This is purely optional.

That's it. No secrets in GitHub. The workflows handle everything else.

---

## Local runs - Prerequisites

- [Dagger CLI](https://docs.dagger.io/getting-started/installation) installed
- Docker (or compatible container runtime) running
- Either Doppler or Infisical CLI installed and authenticated

---

## Local runs - Doppler

### Setup

```bash
# Install (macOS)
brew install dopplerhq/cli/doppler

# Authenticate
doppler login

# Link your project (run from repo root)
doppler setup
```

`doppler setup` creates a `.doppler.yaml` in the project root that records
your project and config. This file is safe to commit.

### Run sync

```bash
doppler run -- dagger call sync \
  --source=. \
  --open-router-api-key=env:LLM_INTEL_OPEN_ROUTER_API_KEY \
  --r2-account-id=env:R2_ACCOUNT_ID \
  --r2-access-key-id=env:R2_ACCESS_KEY_ID \
  --r2-secret-access-key=env:R2_SECRET_ACCESS_KEY \
  --r2-bucket=env:R2_BUCKET \
  --github-token=env:GITHUB_TOKEN \
  --github-repo=your-org/llm-intel \
  --github-actor=your-username
```

### Run release

```bash
doppler run -- dagger call release \
  --github-token=env:GITHUB_TOKEN \
  --github-repo=your-org/llm-intel
```

---

## Local runs - Infisical

### Setup

```bash
# Install (macOS)
brew install infisical/get-cli/infisical

# Authenticate
infisical login

# Link your project (run from repo root)
infisical init
```

`infisical init` creates a `.infisical.json` in the project root that records
your project ID. This file is safe to commit.

### Run sync

```bash
infisical run \
  --env=production \
  -- dagger call sync \
    --source=. \
    --open-router-api-key=env:LLM_INTEL_OPEN_ROUTER_API_KEY \
    --r2-account-id=env:R2_ACCOUNT_ID \
    --r2-access-key-id=env:R2_ACCESS_KEY_ID \
    --r2-secret-access-key=env:R2_SECRET_ACCESS_KEY \
    --r2-bucket=env:R2_BUCKET \
    --github-token=env:GITHUB_TOKEN \
    --github-repo=your-org/llm-intel \
    --github-actor=your-username
```

### Run release

```bash
infisical run \
  --env=production \
  -- dagger call release \
    --github-token=env:GITHUB_TOKEN \
    --github-repo=your-org/llm-intel
```

---

## Notes

- Secrets are never logged or cached in plaintext: Dagger treats all `env:`
  values as `Secret` typed, which are scrubbed from traces automatically.
- `--github-actor` should match your GitHub username exactly: it is used for
  the git commit author on the sync branch.
- To trigger a one-off sync without waiting for the schedule, use
  `workflow_dispatch` in the GitHub Actions UI.