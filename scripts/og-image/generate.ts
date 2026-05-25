import { chromium } from 'playwright';
import { join } from 'path';
import { unlinkSync } from 'fs';
import { LLMIntel } from "../../src";
import { getProviders } from '../../docs/src/lib/utils';


const client = await LLMIntel.create({ provider: "openrouter" });
const models = await client.getModels();
const providers = getProviders(models.data);

const templatePath = join(import.meta.dir, 'template.html');
const tempPath = join(import.meta.dir, 'template.tmp.html');
const output = join(import.meta.dir, '../../dist/og.png');

async function inlineFonts(html: string): Promise<string> {
  const fonts = [
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;600&display=swap',
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap',
  ];
 
  let styleBlock = '';
 
  for (const cssUrl of fonts) {
    const css = await fetch(cssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }).then(r => r.text());
 
    const urls = [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map(m => m[1]);
 
    let inlined = css;
    for (const url of urls) {
      if (!url) continue;
      const buf = await fetch(url).then(r => r.arrayBuffer());
      const b64 = Buffer.from(buf).toString('base64');
      inlined = inlined.replace(url, `data:font/woff2;base64,${b64}`);
    }
 
    styleBlock += inlined;
  }
 
  return html.replace('</head>', `<style>${styleBlock}</style></head>`);
}

const template = await Bun.file(templatePath).text();

const filled = template
  .replace('{{STAT_1_VALUE}}', (models?.data?.length ?? 0).toString())
  .replace('{{STAT_1_LABEL}}', 'MODELS')
  .replace('{{STAT_2_VALUE}}', (providers?.length ?? 0).toString())
  .replace('{{STAT_2_LABEL}}', 'PROVIDERS');

const html = await inlineFonts(filled);

await Bun.write(tempPath, html);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(`file://${tempPath}`, { waitUntil: 'networkidle' });
await page.screenshot({ path: output });
await browser.close();

unlinkSync(tempPath);

console.log(`OG image saved to ${output}`);