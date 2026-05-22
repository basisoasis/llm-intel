import { join, dirname } from "node:path";
import { writeFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { LLMIntel } from "../../src";


const client = await LLMIntel.create({ provider: "openrouter" });
const result = await client.getModels();

const modelIds = result.data
  .map((x) => x.canonicalSlug)
  .sort();
const output = `
// AUTO-GENERATED: do not edit manually
export const MODEL_IDS = ${JSON.stringify(modelIds, null, 2)} as const;

export type ModelId = typeof MODEL_IDS[number];
`;

const generatedPath = join(process.cwd(), "./src/generated/model-ids.ts");
await mkdir(dirname(generatedPath), { recursive: true });
await writeFile(generatedPath, output, "utf-8");
