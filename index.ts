import { LLMIntel } from "./src";

const client = await LLMIntel.create({ provider: "openrouter" });
const model = await client.getModel("anthropic/claude-4.6-sonnet-20260217");
if (!model) {
  throw new Error("Model not found!");
}
const input = {
  inputTokens: 100_000,
  outputTokens: 100_000,
  cacheReadTokens: 10_000,
  cacheWriteTokens: 100_000,
};
const costResult = client.calculateCost(model, input);
const formatResult = client.formatCostResult(costResult);
console.log(JSON.stringify({ ...input, ...formatResult }, null, 2));
