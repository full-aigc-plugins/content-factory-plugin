import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export type ThemeName = "simple" | "technical" | "brand";

export type ThemeContent = {
  title: string;
  body: string;
  code: string;
  table: string[][];
  imageSrc: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function loadTheme(theme: ThemeName): string {
  return readFileSync(
    new URL(`../../../../templates/${theme}/theme.css`, import.meta.url),
    "utf8"
  );
}

export function renderThemedDocument(input: {
  theme: string;
  content: ThemeContent;
  includeLayoutProbe?: boolean;
}): { html: string; contentHash: string; styleHash: string } {
  if (!(["simple", "technical", "brand"] as string[]).includes(input.theme)) {
    throw new Error(`unsupported theme: ${input.theme}`);
  }
  const theme = input.theme as ThemeName;
  const css = loadTheme(theme);
  const table = input.content.table.map((row, rowIndex) => {
    const tag = rowIndex === 0 ? "th" : "td";
    return `<tr>${row.map(cell => `<${tag}>${escapeHtml(cell)}</${tag}>`).join("")}</tr>`;
  }).join("");
  const contentMarkup = [
    `<h1>${escapeHtml(input.content.title)}</h1>`,
    `<p>${escapeHtml(input.content.body)}</p>`,
    `<pre><code>${escapeHtml(input.content.code)}</code></pre>`,
    `<table><tbody>${table}</tbody></table>`,
    `<figure><img alt="layout fixture" src="${escapeHtml(input.content.imageSrc)}"><figcaption>响应式图片</figcaption></figure>`
  ].join("\n");
  const probe = input.includeLayoutProbe
    ? `<script>(()=>{const viewport=window.innerWidth;const bounded=[document.body,document.querySelector("article"),document.querySelector("h1"),document.querySelector("p"),document.querySelector("figure"),document.querySelector("img")].every(element=>{const rect=element.getBoundingClientRect();return rect.left>=-0.5&&rect.right<=viewport+0.5;});const scrollable=[document.querySelector("pre"),document.querySelector("table")].every(element=>{const rect=element.getBoundingClientRect();return rect.left>=-0.5&&rect.right<=viewport+0.5&&getComputedStyle(element).overflowX==="auto";});document.body.dataset.viewport=String(viewport);document.body.dataset.layoutOk=String(bounded&&scrollable&&document.documentElement.scrollWidth<=viewport);})();</script>`
    : "";
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><article>${contentMarkup}</article>${probe}</body></html>`;
  return {
    html,
    contentHash: digest(JSON.stringify(input.content)),
    styleHash: digest(css)
  };
}
