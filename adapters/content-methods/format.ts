import type { CanonicalFields } from "../../packages/core/src/render/canonical-text.ts";

export type FormattedFields = CanonicalFields & { markdown: string };
export type RenderedFields = {
  html: string;
  markdown: string;
  visibleFields: CanonicalFields;
};

export type FormatAdapter = {
  vendorBaseline: "baoyu-format-markdown+baoyu-markdown-to-html@v1.63.0";
  format(fields: CanonicalFields): Promise<FormattedFields>;
  render(markdown: string, fields: CanonicalFields): Promise<RenderedFields>;
};

export function createFormatAdapter(ports: {
  format(fields: CanonicalFields): Promise<FormattedFields>;
  render(markdown: string, fields: CanonicalFields): Promise<RenderedFields>;
}): FormatAdapter {
  return {
    vendorBaseline: "baoyu-format-markdown+baoyu-markdown-to-html@v1.63.0",
    format: ports.format,
    render: ports.render
  };
}
