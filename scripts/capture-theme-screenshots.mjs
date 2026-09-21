import { mkdir, writeFile } from "node:fs/promises";

import { renderThemedDocument } from "../packages/core/src/render/theme.ts";
import { withChromiumPage } from "./chromium-harness.mjs";

const output = new URL("../docs/verification/screenshots/CF-023/", import.meta.url);
const viewports = [
  { width: 390, height: 884 },
  { width: 768, height: 1024 },
  { width: 1280, height: 1024 }
];
const content = {
  title: "Content Factory 跨平台渲染回归",
  body: "正文、表格、图片与长代码在移动端、平板和桌面端保持可读。",
  code: "const immutableContentIdentity = 'content-factory-theme-regression'.repeat(12);",
  table: [["平台", "验收结果"], ["Codex / ZCode / Kimi", "正文不变，主题仅调整样式"]],
  imageSrc: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'%3E%3Crect width='1600' height='900' fill='%2399c'/%3E%3C/svg%3E"
};

await mkdir(output, { recursive: true });
for (const theme of ["simple", "technical", "brand"]) {
  const document = renderThemedDocument({ theme, content });
  for (const viewport of viewports) {
    const name = `${theme}-${viewport.width}x${viewport.height}.png`;
    const png = await withChromiumPage({ ...viewport, html: document.html }, page => page.screenshot());
    if (png.readUInt32BE(16) !== viewport.width || png.readUInt32BE(20) !== viewport.height) {
      throw new Error(`Unexpected screenshot dimensions for ${name}`);
    }
    await writeFile(new URL(name, output), png);
  }
}
