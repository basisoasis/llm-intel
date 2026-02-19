import { execSync } from "node:child_process";

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "node",
  format: "esm",
  naming: {
    entry: "[dir]/[name].mjs",
  },
});

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "node",
  format: "cjs",
  naming: {
    entry: "[dir]/[name].js",
  },
});

execSync(
  "dts-bundle-generator --out-file ./dist/index.d.ts ./src/index.ts --no-check"
);