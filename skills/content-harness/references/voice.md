# Author voice and terminology

The harness may use an `AuthorProfile` to constrain editorial work, but the profile is not a biography and is not a source of facts.

## Rules

- Sample text is analyzed for structural style only; raw sample text is not stored in the profile.
- Explicitly private facts are removed before style statistics are calculated.
- Protected brand names, product names, units, code tokens, commands and URLs must survive editorial passes unchanged unless the user explicitly approves a factual edit.
- Blocked phrases are editorial constraints, not evidence that the phrase is false.
- Updating sample texts, protected terms or blocked phrases creates a new immutable profile revision.
- A vendor humanizer receives the minimum style constraints needed for the task. It does not receive unrelated private sample content by default.
- If a candidate edit violates a protected term, the Runtime Kernel rejects or flags the candidate before it can become the canonical revision.
