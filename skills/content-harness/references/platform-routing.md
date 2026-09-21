# Platform-aware routing

Resolve execution host, source platform, and target channel as separate contexts. A host or source URL never selects the destination.

Before channel-specific research or writing:

1. Resolve `ChannelIntent`, including channel, format, locale, audience, goal, task kind, action, and optional account.
2. Stop with `needs_clarification` when the destination is ambiguous or conflicts with the selected account.
3. Select the versioned `ChannelProfile` and exact channel-format `ContentRecipe`.
4. Persist the routing decision with input hash, profile/recipe revisions, stages, and binding decisions.
5. Apply the run mode: a format-only request keeps only formatting and review stages.

`growth`, `podcast`, and `baidu` are not publishing destinations. `twitter` normalizes to `x`; WeChat Official Accounts and WeChat Channels remain distinct.
