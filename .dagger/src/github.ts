import { dag, type Container, type Secret } from "@dagger.io/dagger";
import type { ModelDiff } from "./types";

interface OpenPrOptions {
  githubToken: Secret;
  githubRepo: string;
  githubActor: string;
  version: string;
  changelog: string;
  diff: ModelDiff;
  /** Container with updated src/generated/model-ids.ts */
  scriptContainer: Container;
}

/**
 * Commit CHANGELOG.md + package.json + src/generated/model-ids.ts
 * on a new branch, and open a PR to main.
 */
export async function openPr(opts: OpenPrOptions): Promise<void> {
  const {
    githubToken,
    githubRepo,
    githubActor,
    version,
    changelog,
    diff,
    scriptContainer,
  } = opts;

  const branch = `sync/openrouter-v${version}`;
  const prTitle = `chore: sync OpenRouter models v${version}`;

  const addedList = diff.added
    .map((m) => `- ${m.name} (\`${m.id}\`)`)
    .join("\n");
  const removedList = diff.removed
    .map((m) => `- ${m.name} (\`${m.id}\`)`)
    .join("\n");

  const prBody = [
    `## OpenRouter model sync v${version}\n`,
    diff.added.length > 0
      ? `### Added (${diff.added.length})\n${addedList}`
      : "",
    diff.removed.length > 0
      ? `### Removed (${diff.removed.length})\n${removedList}`
      : "",
    diff.updated.length > 0
      ? `\n_${diff.updated.length} model(s) had field-level updates._`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const script = [
    "set -e",
    "",
    "# Setup netrc for git auth",
    'echo "machine github.com login x-access-token password $GH_TOKEN" > ~/.netrc',
    "chmod 600 ~/.netrc",
    "",
    "# Git config",
    'git config --global user.name "$ACTOR"',
    'git config --global user.email "$ACTOR@users.noreply.github.com"',
    "",
    "# Clone repo",
    'git clone --depth=1 "https://github.com/$REPO.git" /repo',
    "cd /repo",
    "",
    "# Create branch",
    'git checkout -b "$BRANCH"',
    "",
    "# Copy files",
    "cp /tmp/CHANGELOG.md CHANGELOG.md",
    "cp /tmp/package.json package.json",
    "mkdir -p src/generated",
    "cp /tmp/model-ids.ts src/generated/model-ids.ts",
    "",
    "# Commit and push",
    "git add CHANGELOG.md package.json src/generated/model-ids.ts",
    'git commit -m "chore: sync OpenRouter models v$VERSION"',
    'git push origin "$BRANCH"',
    "",
    "# Build JSON payload",
    'jq -n --arg title "$PR_TITLE" --arg head "$BRANCH" --arg body "$(cat /tmp/pr_body.txt)" \'{title: $title, body: $body, head: $head, base: "master"}\' > /tmp/pr_payload.json',
    "",
    "# Open PR",
    "curl -X POST \\",
    '  -H "Content-Type: application/json" \\',
    '  -H "Authorization: Bearer $GH_TOKEN" \\',
    "  -d @/tmp/pr_payload.json \\",
    '  "https://api.github.com/repos/$REPO/pulls" \\',
    "  | jq .",
    "",
  ].join("\n");

  const prContainer = dag
    .container()
    .from("alpine/git:latest")
    .withExec(["apk", "add", "--no-cache", "curl", "jq"])
    .withSecretVariable("GH_TOKEN", githubToken)
    .withEnvVariable("REPO", githubRepo)
    .withEnvVariable("ACTOR", githubActor)
    .withEnvVariable("BRANCH", branch)
    .withEnvVariable("VERSION", version)
    .withEnvVariable("PR_TITLE", prTitle)
    .withNewFile("/tmp/pr_body.txt", prBody)
    .withFile("/tmp/package.json", scriptContainer.file("package.json"))
    .withFile(
      "/tmp/model-ids.ts",
      scriptContainer.file("src/generated/model-ids.ts"),
    )
    .withNewFile("/tmp/CHANGELOG.md", changelog)
    .withNewFile("/tmp/sync.sh", script)
    .terminal();

  await prContainer.terminal().withExec(["sh", "/tmp/sync.sh"]).sync();
}

/**
 * Read version from package.json on main and cut a GitHub Release
 * using CHANGELOG.md as release notes.
 */
export async function cutRelease(
  githubToken: Secret,
  githubRepo: string,
): Promise<string> {
  const container = dag
    .container()
    .from("alpine:latest")
    .withExec(["apk", "add", "--no-cache", "curl", "jq"])
    .withSecretVariable("GH_TOKEN", githubToken)
    .withEnvVariable("REPO", githubRepo);

  // Read version from package.json on main
  const packageJsonB64 = await container
    .withExec([
      "sh",
      "-c",
      `curl -f -H "Authorization: Bearer $GH_TOKEN" \
        "https://api.github.com/repos/$REPO/contents/package.json" | jq -r '.content'`,
    ])
    .stdout();

  const packageJson = JSON.parse(
    Buffer.from(packageJsonB64.trim(), "base64").toString("utf-8"),
  );
  const version: string = packageJson.version;
  const tag = `v${version}`;

  // Read CHANGELOG.md on main
  const changelogB64 = await container
    .withExec([
      "sh",
      "-c",
      `curl -f -H "Authorization: Bearer $GH_TOKEN" \
        "https://api.github.com/repos/$REPO/contents/CHANGELOG.md" | jq -r '.content'`,
    ])
    .stdout();

  const changelog = Buffer.from(changelogB64.trim(), "base64").toString(
    "utf-8",
  );

  const script = [
    "set -e",
    "",
    "# Build release payload",
    "jq -n \\",
    '  --arg tag "$TAG" \\',
    '  --arg body "$(cat /tmp/changelog.md)" \\',
    "  '{tag_name: $tag, name: $tag, body: $body, draft: false, prerelease: false}' > /tmp/release_payload.json",
    "",
    "# Cut release",
    "curl -f -X POST \\",
    '  -H "Authorization: Bearer $GH_TOKEN" \\',
    '  -H "Content-Type: application/json" \\',
    "  -d @/tmp/release_payload.json \\",
    '  "https://api.github.com/repos/$REPO/releases" | jq .',
  ].join("\n");

  await container
    .withEnvVariable("TAG", tag)
    .withNewFile("/tmp/changelog.md", changelog)
    .withNewFile("/tmp/release.sh", script)
    .withExec(["sh", "/tmp/release.sh"])
    .sync();

  return tag;
}
