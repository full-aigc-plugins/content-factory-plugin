import { createHash } from "node:crypto";

export type CanonicalFields = {
  variantId: string;
  title: string;
  summary: string;
  body: string;
  captions: string[];
  citations: string[];
};

export type FrozenCanonicalText = CanonicalFields & {
  canonicalizationVersion: "1";
  visibleText: string;
  textHash: string;
};

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function freezeCanonicalText(fields: CanonicalFields): FrozenCanonicalText {
  const copy: CanonicalFields = {
    ...fields,
    captions: [...fields.captions],
    citations: [...fields.citations]
  };
  const visibleText = [
    copy.title,
    copy.summary,
    copy.body,
    ...copy.captions,
    ...copy.citations
  ].filter(value => value.length > 0).join("\n\n");
  return {
    ...copy,
    canonicalizationVersion: "1",
    visibleText,
    textHash: digest(visibleText)
  };
}

export function canonicalizeWechatLinks(body: string): {
  body: string;
  citations: string[];
} {
  const citations: string[] = [];
  const converted = body.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gu,
    (_match, label: string, url: string) => {
      const index = citations.push(url);
      return `${label}[${index}]`;
    }
  );
  if (citations.length === 0) {
    return { body, citations };
  }
  const references = citations.map((url, index) => `[${index + 1}] ${url}`).join("\n");
  return {
    body: `${converted}\n\n参考资料\n${references}`,
    citations
  };
}
