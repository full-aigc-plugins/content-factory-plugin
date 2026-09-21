# Visual brief boundary

Create a `VisualBrief` only after the target content revision and paragraph anchor are known. The brief describes the communication purpose, requested asset kind, aspect ratio, visible-text constraints, and supporting source references.

The brief does not authorize image generation. It starts with `generationStatus: not-requested`; the runtime kernel separately checks Image Factory availability, user consent, and budget before any paid request.

Classify imported assets by their real origin:

- `screenshot`: a real captured interface or observed state;
- `user-image`: an image supplied by the user;
- `licensed`: an asset with recorded license basis;
- `generated`: an asset backed by an Image Factory receipt.

Never relabel a screenshot as generated, or an asset with unknown rights as owned. A missing visual may leave a working draft usable, while formal completion must either bind the required assets or record an explicit no-image decision.
