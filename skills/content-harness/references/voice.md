# Author voice and terminology boundary

Content Factory may use user-approved writing samples to derive style statistics, but the AuthorProfile never stores raw sample text.

## Allowed style signals

- sentence-length distribution and break frequency;
- explicit voice/tone guidance supplied by the user;
- exact protected terminology supplied by the user;
- explicit expressions the user does not want used.

## Forbidden transfer

A sample-specific person, customer, company, location, event, metric, quote, anecdote, credential or private fact is not reusable factual material merely because it appeared in a voice sample.

The profile stores SHA-256 sample fingerprints for revision identity and audit. New samples produce a new profile revision. They do not mutate historical profile revisions.

Protected terms are exact strings. Downstream editing/fact-guard stages compare them before accepting a candidate revision.
