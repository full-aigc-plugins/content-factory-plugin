import assert from "node:assert/strict";
import test from "node:test";

import { createFormatAdapter } from "../adapters/content-methods/format.ts";
import {
  canonicalizeWechatLinks,
  freezeCanonicalText
} from "../packages/core/src/render/canonical-text.ts";
import { renderFrozenVariant } from "../packages/core/src/render/pipeline.ts";

const content = {
  variantId: "variant-1",
  title: "Source 与 Claim",
  summary: "保留事实与引用。",
  body: "运行 `npm test`，查看 [原始资料](https://example.com/source)。",
  captions: ["图 1：真实流程"],
  citations: []
};

test("CF-022 WeChat visible-link conversion happens before canonical text freeze", () => {
  const converted = canonicalizeWechatLinks(content.body);
  assert.equal(
    converted.body,
    "运行 `npm test`，查看 原始资料[1]。\n\n参考资料\n[1] https://example.com/source"
  );

  const before = freezeCanonicalText(content);
  const after = freezeCanonicalText({ ...content, body: converted.body });
  assert.notEqual(after.textHash, before.textHash);
  assert.match(after.visibleText, /原始资料\[1\]/u);
  assert.match(after.visibleText, /https:\/\/example\.com\/source/u);
});

test("CF-022 deterministic format and HTML rendering preserve every substantive field", async () => {
  const frozen = freezeCanonicalText(content);
  const adapter = createFormatAdapter({
    async format(fields) {
      return { ...fields, markdown: `# ${fields.title}\n\n${fields.body}` };
    },
    async render(markdown, fields) {
      return {
        html: `<h1>${fields.title}</h1><p>${fields.body}</p>`,
        visibleFields: fields,
        markdown
      };
    }
  });

  const first = await renderFrozenVariant({ frozen, adapter, themeRevision: "simple@1" });
  const second = await renderFrozenVariant({ frozen, adapter, themeRevision: "simple@1" });

  assert.equal(first.status, "succeeded");
  assert.equal(first.renderHash, second.renderHash);
  assert.equal(first.textHash, frozen.textHash);
  assert.match(first.html ?? "", /npm test/u);
});

test("CF-022 rejects renderer rewrites and unsafe HTML instead of accepting a format-only change", async () => {
  const frozen = freezeCanonicalText(content);
  const rewritingAdapter = createFormatAdapter({
    async format(fields) {
      return { ...fields, title: "AI invented title", markdown: "rewritten" };
    },
    async render(markdown, fields) {
      return { html: `<p>${markdown}</p>`, visibleFields: fields, markdown };
    }
  });
  assert.deepEqual(
    await renderFrozenVariant({ frozen, adapter: rewritingAdapter, themeRevision: "simple@1" }),
    { status: "failed", reason: "substantive-content-changed" }
  );

  const unsafeAdapter = createFormatAdapter({
    async format(fields) {
      return { ...fields, markdown: fields.body };
    },
    async render(markdown, fields) {
      return {
        html: `<script>alert(1)</script><a href="javascript:alert(1)">${markdown}</a>`,
        visibleFields: fields,
        markdown
      };
    }
  });
  assert.deepEqual(
    await renderFrozenVariant({ frozen, adapter: unsafeAdapter, themeRevision: "simple@1" }),
    { status: "failed", reason: "unsafe-rendered-html" }
  );
});
