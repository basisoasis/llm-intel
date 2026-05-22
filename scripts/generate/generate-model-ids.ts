import { join, dirname } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";

const cacheDir = join(process.cwd(), "./.cache/openrouter-models.json");
const modelInfo = await readFile(cacheDir, "utf-8");

const models = JSON.parse(modelInfo);
const modelIds = models
  .map((x: { canonical_slug: string }) => x.canonical_slug)
  .sort();
const output = `
// AUTO-GENERATED: do not edit manually
export const MODEL_IDS = ${JSON.stringify(modelIds, null, 2)} as const;

export type ModelId = typeof MODEL_IDS[number];
`;

const generatedPath = join(process.cwd(), "./src/generated/model-ids.ts");
await mkdir(dirname(generatedPath), { recursive: true });
await writeFile(generatedPath, output, "utf-8");
