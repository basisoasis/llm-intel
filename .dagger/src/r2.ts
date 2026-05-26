import { dag, type Container, type Secret } from "@dagger.io/dagger"

/**
 * Build a base AWS CLI container wired to Cloudflare R2
 * via the S3-compatible API.
 */
export async function awsContainer(
  r2AccountId: Secret,
  r2AccessKeyId: Secret,
  r2SecretAccessKey: Secret,
  r2Bucket: Secret,
): Promise<Container> {
  const accountId = await r2AccountId.plaintext()
  const bucket = await r2Bucket.plaintext()

  return dag
    .container()
    .from("amazon/aws-cli:latest")
    .withSecretVariable("AWS_ACCESS_KEY_ID", r2AccessKeyId)
    .withSecretVariable("AWS_SECRET_ACCESS_KEY", r2SecretAccessKey)
    .withEnvVariable("AWS_DEFAULT_REGION", "auto")
    .withEnvVariable(
      "AWS_ENDPOINT_URL",
      `https://${accountId}.r2.cloudflarestorage.com`,
    )
    .withEnvVariable("BUCKET", bucket)
}

/**
 * Fetch a file from R2. Returns null if the file does not exist (first run).
 */
export async function fetchFromR2(
  base: Container,
  key: string,
): Promise<string | null> {
  try {
    const result = await base
      .withExec([
        "sh", "-c",
        `aws s3 cp s3://$BUCKET/${key} /tmp/fetched.json 2>/dev/null && cat /tmp/fetched.json || echo '__NOT_FOUND__'`,
      ])
      .stdout()
    const trimmed = result.trim()
    return trimmed === "__NOT_FOUND__" ? null : trimmed
  } catch {
    return null
  }
}

/**
 * Upload both model files to R2.
 */
export async function uploadToR2(
  base: Container,
  modelsJson: string,
  metaJson: string,
): Promise<void> {
  await base
    .withNewFile("/tmp/openrouter-models.json", modelsJson)
    .withNewFile("/tmp/openrouter-models.meta.json", metaJson)
    .withExec([
      "sh", "-c",
      [
        "aws s3 cp /tmp/openrouter-models.json s3://$BUCKET/openrouter-models.json --content-type application/json",
        "aws s3 cp /tmp/openrouter-models.meta.json s3://$BUCKET/openrouter-models.meta.json --content-type application/json",
      ].join(" && "),
    ])
    .sync()
}