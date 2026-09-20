# CF-006 Image Factory collaboration contract

Status: offline contract implementation. No image generation call was made by this task.

## Verified upstream surface

Content Factory treats generated visual production as an external Image Factory responsibility. The compatibility contract is based on:

- repository: `full-aigc-plugins/image-factory-plugin`
- schema: `schemas/artifact_receipt.schema.json`
- schema version: `1.0.0`
- plugin identity: `image-factory`

The upstream receipt requires a recomputed artifact SHA-256, byte size, dimensions, prompt hash, idempotency key, source call identity, and collection timestamp.

## Content Factory boundary

`adapters/image-factory/probe.ts` is deliberately offline and side-effect free. It accepts only explicit capability advertisement plus an exact contract/schema identity. It does not discover credentials, call a model, spend budget, or synthesize an image.

A receipt is staging evidence only. Later asset-registration work must additionally verify the referenced file exists and recompute its hash before accepting it as a deliverable asset.

Image-generation skills remain excluded from `skills.lock.json`; Content Factory owns the VisualBrief and revision linkage, while Image Factory owns generation and its artifact receipt.

## Failure behavior

- capability not probed -> `unknown`
- capability explicitly absent -> `unavailable`
- incompatible contract/schema -> `unavailable`
- malformed artifact receipt -> rejected with field-level errors
- no valid receipt -> no generated asset may be claimed deliverable

Live Image Factory generation remains NOT_RUN until a later task has explicit budget/consent.
