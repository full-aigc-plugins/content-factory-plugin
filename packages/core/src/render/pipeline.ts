import { createHash } from "node:crypto";

import type { FormatAdapter } from "../../../../adapters/content-methods/format.ts";
import type { CanonicalFields, FrozenCanonicalText } from "./canonical-text.ts";

export type RenderResult =
  | {
    status: "succeeded";
    html: string;
    markdown: string;
    textHash: string;
    renderHash: string;
  }
  | { status: "failed"; reason: "substantive-content-changed" | "unsafe-rendered-html" };

function fieldsOf(frozen: FrozenCanonicalText): CanonicalFields {
  return {
    variantId: frozen.variantId,
    title: frozen.title,
    summary: frozen.summary,
    body: frozen.body,
    captions: [...frozen.captions],
    citations: [...frozen.citations]
  };
}

function sameFields(left: CanonicalFields, right: CanonicalFields): boolean {
  return left.variantId === right.variantId
    && left.title === right.title
    && left.summary === right.summary
    && left.body === right.body
    && JSON.stringify(left.captions) === JSON.stringify(right.captions)
    && JSON.stringify(left.citations) === JSON.stringify(right.citations);
}

function unsafeHtml(html: string): boolean {
  return /<script\b/iu.test(html)
    || /\b(?:href|src)\s*=\s*["']?\s*javascript:/iu.test(html);
}

export async function renderFrozenVariant(input: {
  frozen: FrozenCanonicalText;
  adapter: FormatAdapter;
  themeRevision: string;
}): Promise<RenderResult> {
  const expected = fieldsOf(input.frozen);
  const formatted = await input.adapter.format(expected);
  if (!sameFields(expected, formatted)) {
    return { status: "failed", reason: "substantive-content-changed" };
  }

  const rendered = await input.adapter.render(formatted.markdown, expected);
  if (!sameFields(expected, rendered.visibleFields)) {
    return { status: "failed", reason: "substantive-content-changed" };
  }
  if (unsafeHtml(rendered.html)) {
    return { status: "failed", reason: "unsafe-rendered-html" };
  }

  const renderHash = createHash("sha256").update(JSON.stringify({
    textHash: input.frozen.textHash,
    themeRevision: input.themeRevision,
    vendorBaseline: input.adapter.vendorBaseline,
    markdown: rendered.markdown,
    html: rendered.html
  })).digest("hex");
  return {
    status: "succeeded",
    html: rendered.html,
    markdown: rendered.markdown,
    textHash: input.frozen.textHash,
    renderHash
  };
}
