import { LLMIntel } from "../../src";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const client = await LLMIntel.create({ provider: "openrouter" });
const models = await client.getModels();

const __dirname = dirname(fileURLToPath(import.meta.url));

writeFileSync(
  join(__dirname, "../../assets/providers.json"),
  JSON.stringify(models, null, 2),
);

console.log(`Written ${models.data.length} models to model.json`);
