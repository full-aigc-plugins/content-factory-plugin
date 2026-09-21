import assert from "node:assert/strict";
import test from "node:test";

import { renderThemedDocument } from "../packages/core/src/render/theme.ts";
import { findChromiumExecutable, withChromiumPage } from "../scripts/chromium-harness.mjs";

const viewports = [
  { width: 375, height: 884 },
  { width: 390, height: 884 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1280, height: 1024 }
];

const content = {
  title: "跨平台渲染回归",
  body: "中英文 mixed content 保持可读。",
  code: "const veryLongIdentifier = 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(8);",
  table: [["平台", "验证"], ["Content Factory", "不修改正文，只改变样式"]],
  imageSrc: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'%3E%3Crect width='1600' height='900' fill='%2399c'/%3E%3C/svg%3E"
};

test("CF-023 three themes preserve text while changing style only", () => {
  const rendered = ["simple", "technical", "brand"].map(theme =>
    renderThemedDocument({ theme, content })
  );
  assert.equal(new Set(rendered.map(item => item.contentHash)).size, 1);
  assert.equal(new Set(rendered.map(item => item.styleHash)).size, 3);
  for (const item of rendered) {
    assert.match(item.html, /跨平台渲染回归/u);
    assert.match(item.html, /veryLongIdentifier/u);
  }
});

test("CF-023 real Chromium layout stays within 375 390 430 768 and 1280 pixel viewports", async t => {
  if (!findChromiumExecutable()) {
    t.skip("pinned local Chromium executable unavailable");
    return;
  }
  for (const theme of ["simple", "technical", "brand"]) {
    const document = renderThemedDocument({ theme, content, includeLayoutProbe: true });
    for (const viewport of viewports) {
      const result = await withChromiumPage({ ...viewport, html: document.html }, async page => ({
        viewport: await page.evaluate("window.innerWidth"),
        layoutOk: await page.evaluate("document.body.dataset.layoutOk")
      }));
      assert.equal(result.viewport, viewport.width, `${theme}@${viewport.width} viewport`);
      assert.equal(result.layoutOk, "true", `${theme}@${viewport.width} layout`);
    }
  }
});

test("CF-023 real Chromium produces reviewable screenshots at requested mobile tablet and desktop sizes", async t => {
  if (!findChromiumExecutable()) {
    t.skip("pinned local Chromium executable unavailable");
    return;
  }
  const document = renderThemedDocument({ theme: "technical", content });
  for (const viewport of viewports.filter(item => [390, 768, 1280].includes(item.width))) {
    const png = await withChromiumPage({ ...viewport, html: document.html }, page => page.screenshot());
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.ok(png.length > 1000);
    assert.equal(png.readUInt32BE(16), viewport.width);
    assert.equal(png.readUInt32BE(20), viewport.height);
  }
});
