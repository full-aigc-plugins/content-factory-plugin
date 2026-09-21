# Third-Party Notices

Content Factory vendors reviewed external skills as immutable snapshots declared in `skills.lock.json`.

## full-aigc-skills/baoyu-skills

- Repository: https://github.com/full-aigc-skills/baoyu-skills
- Release: `v1.63.0`
- Commit: `c1e1526c84fd07d71d9d12e9845dceeb366d1b42`
- License: MIT
- License evidence: https://github.com/full-aigc-skills/baoyu-skills/blob/v1.63.0/LICENSE
- Vendored skills:
  - `baoyu-format-markdown`
  - `baoyu-markdown-to-html`

The vendored files remain attributable to their upstream authors and are kept byte-identical to the locked upstream snapshot.

Plugin-local `content-harness` is not third-party content and is protected by `plugin-local-skills.json`.

## Runtime document parsing dependencies

- `fflate@0.8.3` — MIT License — used only for bounded DOCX ZIP extraction.
  Source: https://github.com/101arrowz/fflate
- `pdfjs-dist@6.3.289` — Apache License 2.0 — used for local text-layer PDF parsing.
  Source: https://github.com/mozilla/pdf.js

These dependencies are pinned to exact package versions. Content Factory does not invoke OCR or remote document-conversion services in CF-010.
