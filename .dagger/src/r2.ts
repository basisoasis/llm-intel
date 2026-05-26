import { dag, type Container, type Secret } from "@dagger.io/dagger";

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
  const accountId = await r2AccountId.plaintext();
  const bucket = await r2Bucket.plaintext();

  return dag
    .container()
    .from("amazon/aws-cli:latest")
    .withExec([
      "aws",
      "configure",
      "set",
      "default.s3.request_checksum_calculation",
      "when_required",
    ])
    .withExec([
      "aws",
      "configure",
      "set",
      "default.s3.response_checksum_validation",
      "when_required",
    ])
    .withSecretVariable("AWS_ACCESS_KEY_ID", r2AccessKeyId)
    .withSecretVariable("AWS_SECRET_ACCESS_KEY", r2SecretAccessKey)
    .withEnvVariable("AWS_DEFAULT_REGION", "auto")
    .withEnvVariable("BUCKET", bucket)
    .withEnvVariable(
      "BUCKET_ENDPOINT",
      `https://${accountId}.r2.cloudflarestorage.com`,
    );
}

/**
 * Fetch a file from R2. Returns null if the file does not exist (first run).
 */
export async function fetchFromR2(
  base: Container,
  key: string,
): Promise<string | null> {
  const safeKey = key.replace(/[^a-zA-Z0-9.-]/g, "_");
  const tmpPath = `/tmp/${safeKey}`;
  const tmpPathSuccess = `/tmp/success-${safeKey}`;
  const tmpPathFailure = `/tmp/failure-${safeKey}`

  try {
    const result = await base
      .withExec([
        "sh",
        "-c",
        `aws s3api get-object --bucket $BUCKET --key ${key} ${tmpPath} --endpoint-url $BUCKET_ENDPOINT > ${tmpPathSuccess} 2>${tmpPathFailure} && cat ${tmpPath} || echo '__NOT_FOUND__'`,
      ])
      .stdout();
    const trimmed = result.trim();
    return trimmed === "__NOT_FOUND__" ? null : trimmed;
  } catch {
    return null;
  }
}

export async function uploadToR2(
  base: Container,
  key: string,
  content: string,
  contentType: string = "application/json",
): Promise<void> {
  const safeKey = key.replace(/[^a-zA-Z0-9.-]/g, "_");
  const tmpPath = `/tmp/${safeKey}`;
  const tmpPathSuccess = `/tmp/success-${safeKey}`;
  const tmpPathFailure = `/tmp/failure-${safeKey}`;

  await base
    .withNewFile(tmpPath, content)
    .withExec([
      "sh",
      "-c",
      `aws s3api put-object --bucket $BUCKET --key ${key} --body ${tmpPath} --content-type ${contentType} --endpoint-url $BUCKET_ENDPOINT > ${tmpPathSuccess} 2>${tmpPathFailure}`,
    ])
    .sync();
}