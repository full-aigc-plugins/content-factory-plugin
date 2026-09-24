# Validation · local Zhuque setup

2026-09-24 source-checkout evidence:

- `openspec validate add-zhuque-local-setup --strict`: passed.
- `node --test test/zhuque-local-setup.test.mjs`: 5/5 passed. The suite first failed for missing implementation, then verified env precedence, private atomic storage, symlink rejection, Origin/Host/CSRF/Content-Type/body-size rejection, secret-free status, and CLI/MCP discovery.
- `npm run lint`, `npm run typecheck`, `npm run skills:check`: passed.
- `npm test`: 293/293 passed; its build packaged 268 files, including the three local-page assets and two Zhuque adapter files.
- Plugin creator validator: passed with the available Python environment.
- The packaged CLI served the local page on `127.0.0.1` in an isolated temporary config. Browser inspection at 390×884, 768×1024, and 1280×1024 found no layout blocker; submitting an empty field displayed a non-secret validation message.

Boundary: no real API Key was entered, no Zhuque API call or article upload was made, and no installed Codex/ZCode/Kimi host acceptance was run. These checks validate local setup, **not** authenticated detection, CF-025/CF-030 completion, or production release. This source change was not installed or published.

## Stitch visual alignment · 2026-09-24

- Used the installed Stitch Design MCP proxy to create the private [Content Factory · Zhuque Key Setup](https://stitch.withgoogle.com/projects/241725949009862614) project and generate a desktop design from [the bounded prompt](stitch-prompt.md). Provider returned project `241725949009862614`, session `3864620803118065184`, and a design component; the screen was visually inspected in the Stitch web UI.
- The provider's `list_screens` response for this project was `{}`, so no `get_screen` device/size receipt or asset export is claimed. The Stitch result is a design reference, not remote screen acceptance evidence.
- Implemented the same centered brand/title, light blue–lime–aqua ambient background, broad white card, black save action, and compact instruction stack in the packaged local page. Retained Content Factory's accurate "configured ≠ API verified" wording and did not import Stitch's auth-state claims or logo.
- Local browser checks covered 1280×1024, 768×1024, 390×884, and a 1280×740 window. At 390px, `document.documentElement.scrollWidth` equaled the 390px viewport; the empty-key action displayed its validation message. No real credential was entered.
