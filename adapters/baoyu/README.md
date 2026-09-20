# Baoyu formatting adapter baseline

CF-005 vendors the complete immutable upstream trees for:

- `baoyu-format-markdown`
- `baoyu-markdown-to-html`

The upstream snapshot is locked in `skills.lock.json`. Content Factory does not mutate these trees in place. Runtime adaptation belongs in this adapter directory and must preserve the locked vendor digest.

## Runtime policy

- Node.js 24 is the Content Factory runtime baseline.
- Nested upstream dependency metadata is retained, including `package-lock.json` files.
- Runtime code must never invoke floating `npx ...@latest` or a network installer.
- Any future patch to upstream behavior must be implemented as an adapter or an explicitly reviewed fork/patch record, never by silently editing the vendored skill.
- Formatting is not authorization to invent or rewrite substantive content; title/summary generation must remain separated from pure formatting flows.

Visual-generation Baoyu skills are intentionally excluded and remain the responsibility of Image Factory.
