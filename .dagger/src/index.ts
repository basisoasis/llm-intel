import { dag, object, func, type Secret, type Directory } from "@dagger.io/dagger"
import { diffModels, renderChangelog } from "./diff"
import { awsContainer, fetchFromR2, uploadToR2 } from "./r2"
import { openPr, cutRelease } from "./github"
import type { MetaFile, ModelDiff } from "./types"
import type { ModelData } from "../../src/types/models"

@object()
export class LlmIntel {
  /**
   * Fetch fresh OpenRouter model data, diff against R2, upload if changed,
   * bump the patch version, and open a PR when models are structurally
   * added or removed.
   */
  @func()
  async sync(
    /** Repository root */
    source: Directory,
    /** Cloudflare account ID */
    r2AccountId: Secret,
    /** R2 S3-compatible access key ID */
    r2AccessKeyId: Secret,
    /** R2 S3-compatible secret access key */
    r2SecretAccessKey: Secret,
    /** R2 bucket name */
    r2Bucket: Secret,
    /** GitHub token with repo + PR write permissions */
    githubToken: Secret,
    /** Owner/repo e.g. "acme/llm-intel" */
    githubRepo: string,
    /** Git actor name used for commits */
    githubActor: string,
    /** OpenRouter API key (optional) */
    openRouterApiKey?: Secret,
  ): Promise<string> {

    const modelsFileName = 'openrouter-models.json';
    const modelsFileMetaName = 'openrouter-models.meta.json';

    // =====================================================================
    // 1. Run the generate script — populates .cache/ inside the container
    // =====================================================================
    let scriptContainer = dag
      .container()
      .from("oven/bun:latest")
      .withDirectory("/app", source)
      .withWorkdir("/app")
      .withEnvVariable("LLM_INTEL_CACHE_DIR", "/app/.cache")
      .withExec(["bun", "install"])
      .withExec(["bunx", "playwright", "install", "chromium", "--with-deps"])

    if (openRouterApiKey) {
      scriptContainer = scriptContainer
      .withSecretVariable("LLM_INTEL_OPEN_ROUTER_API_KEY", openRouterApiKey)
    }

    scriptContainer = scriptContainer
      .withExec(["bun", "run", "generate:model"]);

    const [newModelsJson, newMetaJson] = await Promise.all([
      scriptContainer.file(`.cache/${modelsFileName}`).contents(),
      scriptContainer.file(`.cache/${modelsFileMetaName}`).contents(),
    ])

    const newMeta: MetaFile = JSON.parse(newMetaJson)

    // =====================================================================
    // 2. Compare dataUpdatedAt against remote meta, exit early if unchanged
    // =====================================================================
    const base = await awsContainer(r2AccountId, r2AccessKeyId, r2SecretAccessKey, r2Bucket)
    const remoteMetaRaw = await fetchFromR2(base, modelsFileMetaName)
    const remoteMeta: MetaFile | null = remoteMetaRaw ? JSON.parse(remoteMetaRaw) : null

    scriptContainer
      .withNewFile('tmp/remote-meta.raw.json', remoteMetaRaw || '');


    if (remoteMeta?.dataUpdatedAt === newMeta.dataUpdatedAt) {
      return "No change detected (dataUpdatedAt unchanged). Skipping."
    }

    // =====================================================================
    // 3. Fetch previous models from R2 and compute diff
    // =====================================================================
    const remoteModelsRaw = await fetchFromR2(base, modelsFileName)
    const previousModels: ModelData[] = remoteModelsRaw ? JSON.parse(remoteModelsRaw) : []
    const newModels: ModelData[] = JSON.parse(newModelsJson)
    const diff: ModelDiff = diffModels(previousModels, newModels)

    // =====================================================================
    // 5. Structural change? Regenerate types, bump version, open PR
    // =====================================================================
    const hasStructuralChange = diff.added.length > 0 || diff.updated.length > 0 || diff.removed.length > 0

    if (!hasStructuralChange) {
      return `No changes detected. No PR opened.`
    }      

    // Regenerate TypeScript model ID types from the updated cache
    const withTypes = scriptContainer
      .withExec(["bun", "run", "generate:types"])
      .withExec(["bun", "run", "scripts/og-image/generate.ts"])
      .withExec(["bun", "pm", "version", "patch", "--no-git-tag-version"])

    // Read current version from package.json and bump patch
    const newVersion = await dag
      .container()
      .from("oven/bun:latest")
      .withDirectory("/app", source)
      .withWorkdir("/app")
      .withExec(["bun", "pm", "version", "patch", "--no-git-tag-version"])
      .file("package.json")
      .contents()
      .then((raw) => JSON.parse(raw).version as string)

    const date = new Date().toISOString().slice(0, 10)
    const changelog = renderChangelog(diff, newVersion, date)

    await openPr({
      githubToken,
      githubRepo,
      githubActor,
      version: newVersion,
      changelog,
      scriptContainer: withTypes,
    })

    // =====================================================================
    // 4. Upload both files to R2
    // =====================================================================
    await uploadToR2(base, modelsFileName, newModelsJson);
    await uploadToR2(base, modelsFileMetaName, newMetaJson);

    return (
      `Uploaded. Version bumped to v${newVersion}. PR opened. ` +
      `Added: ${diff.added.length}, Removed: ${diff.removed.length}, Updated: ${diff.updated.length}`
    )
  }

  /**
   * Read the version from package.json on main and cut a GitHub Release
   * using CHANGELOG.md as release notes.
   */
  @func()
  async release(
    /** GitHub token with contents:write */
    githubToken: Secret,
    /** Owner/repo e.g. "acme/llm-intel" */
    githubRepo: string,
  ): Promise<string> {
    const tag = await cutRelease(githubToken, githubRepo)
    return `Released ${tag}`
  }
}