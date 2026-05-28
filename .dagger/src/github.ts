import {
  dag,
  type Directory,
  type Container,
  type Secret,
  ReturnType,
} from "@dagger.io/dagger";
import { Changelog } from "./changelog";

interface OpenPrOptions {
  githubToken: Secret;
  githubRepo: string;
  githubActor: string;
  version: string;
  changelog: string;
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
    scriptContainer,
  } = opts;

  const branch = `sync/openrouter-v${version}`;
  const prTitle = `chore: sync OpenRouter models v${version}`;

  const existingChangelog = Changelog.parse(await scriptContainer.file("CHANGELOG.md").contents());
  const incomingChangelog = Changelog.parse(changelog);
  const mergedChangelog = existingChangelog.merge(incomingChangelog).toString();

  const prBody = [`## OpenRouter model sync v${version}`, changelog].join(
    "\n\n",
  );

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
    "# Create or reset branch",
    'if git ls-remote --exit-code --heads origin "$BRANCH"; then',
    '  git fetch --depth=1 origin "$BRANCH"', // fetch the branch first
    '  git checkout -b "$BRANCH" "FETCH_HEAD"', // then create from FETCH_HEAD
    "else",
    '  git checkout -b "$BRANCH"',
    "fi",
    "",
    "# Copy files",
    "cp /tmp/CHANGELOG.md CHANGELOG.md",
    "cp /tmp/package.json package.json",
    "mkdir -p src/generated",
    "cp /tmp/model-ids.ts src/generated/model-ids.ts",
    "mkdir -p docs/public",
    "cp /tmp/og-image.png docs/public/og-image.png",
    "",
    "# Commit and push",
    "git add CHANGELOG.md package.json src/generated/model-ids.ts docs/public/og-image.png",
    'git commit -m "chore: sync OpenRouter models v$VERSION" || echo "Nothing to commit"',
    'git push origin "$BRANCH"',
    "",
    "# Check if PR already exists for this branch",
    "EXISTING_PR=$(curl -s \\",
    '  -H "Authorization: Bearer $GH_TOKEN" \\',
    '  "https://api.github.com/repos/$REPO/pulls?head=${REPO%%/*}:$BRANCH&state=open" \\',
    "  | jq '.[0].number // empty')",
    "",
    'if [ -n "$EXISTING_PR" ]; then',
    '  echo "Updating existing PR #$EXISTING_PR"',
    '  jq -n --arg title "$PR_TITLE" --arg body "$(cat /tmp/pr_body.txt)" \'{ title: $title, body: $body }\' > /tmp/pr_payload.json',
    "  curl -X PATCH \\",
    '    -H "Content-Type: application/json" \\',
    '    -H "Authorization: Bearer $GH_TOKEN" \\',
    "    -d @/tmp/pr_payload.json \\",
    '    "https://api.github.com/repos/$REPO/pulls/$EXISTING_PR" \\',
    "    | jq .",
    "else",
    '  echo "Opening new PR"',
    '  jq -n --arg title "$PR_TITLE" --arg head "$BRANCH" --arg body "$(cat /tmp/pr_body.txt)" \'{ title: $title, body: $body, head: $head, base: "master" }\' > /tmp/pr_payload.json',
    "  curl -X POST \\",
    '    -H "Content-Type: application/json" \\',
    '    -H "Authorization: Bearer $GH_TOKEN" \\',
    "    -d @/tmp/pr_payload.json \\",
    '    "https://api.github.com/repos/$REPO/pulls" \\',
    "    | jq .",
    "fi",
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
      "/tmp/og-image.png",
      scriptContainer.file("docs/public/og-image.png"),
    )
    .withFile(
      "/tmp/model-ids.ts",
      scriptContainer.file("src/generated/model-ids.ts"),
    )
    .withNewFile("/tmp/CHANGELOG.md", mergedChangelog)
    .withNewFile("/tmp/sync.sh", script);

  await prContainer.withExec(["sh", "/tmp/sync.sh"]).sync();
}

/**
 * Read version from package.json on main and cut a GitHub Release
 * using CHANGELOG.md as release notes.
 */
export async function cutRelease(
  source: Directory,
  githubToken: Secret,
  githubRepo: string,
): Promise<string> {
  const packageJson = JSON.parse(await source.file("package.json").contents());
  const tag = `v${packageJson.version}`;
  const changelog = await source.file("CHANGELOG.md").contents();

  // Extract only the section for this release
  const body = Changelog.parse(changelog).section(tag);

  const payload = JSON.stringify({
    tag_name: tag,
    target_commitish: "master", // ensure tag is created against master
    name: tag,
    body,
    draft: false,
    prerelease: false,
  });

  const output = await dag
    .container()
    .from("alpine:latest")
    .withExec(["apk", "add", "--no-cache", "curl"])
    .withSecretVariable("GH_TOKEN", githubToken)
    .withEnvVariable("REPO", githubRepo)
    .withNewFile("/tmp/payload.json", payload)
    .withExec(
      [
        "sh",
        "-c",
        `curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
      -H "Authorization: Bearer $GH_TOKEN" \
      -H "Content-Type: application/json" \
      -d @/tmp/payload.json \
      "https://api.github.com/repos/$REPO/releases"`,
      ],
      { expect: ReturnType.Any },
    )
    .stdout();

  if (output.includes('"already_exists"')) {
    console.log(`Release ${tag} already exists, skipping.`);
    return tag;
  }

  return tag;
}