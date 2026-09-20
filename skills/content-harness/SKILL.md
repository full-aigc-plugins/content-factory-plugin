---
name: content-harness
description: Orchestrates Content Factory by resolving host, source, target channel, content format, task intent, approved vendor capabilities, runtime-kernel gates, and external media factories. This is the only plugin-local skill.
---

# Content Harness

Content Harness is the orchestration layer for Content Factory.

It MUST:
- keep execution host, source platform, target channel, content format, locale, goal, account, and requested action separate;
- resolve a ChannelProfile and ContentRecipe before channel-specific writing;
- select only admitted and installed vendor capabilities;
- submit vendor outputs to Runtime Kernel validation before canonical acceptance;
- delegate generated visuals to Image Factory;
- preserve explicit approval and delivery verification boundaries;
- report unsupported or not-run capabilities without inventing completion.

It MUST NOT:
- install skills during a content run;
- infer a destination from a source URL;
- treat a vendor result as approval, detector success, or verified delivery;
- silently switch to a higher-privilege or reverse-engineered provider;
- generate visual assets locally.
