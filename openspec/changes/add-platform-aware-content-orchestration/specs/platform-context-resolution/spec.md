# Platform context resolution

## ADDED Requirements

### Requirement: CPR-001 Execution host and content destination SHALL be separate
The system SHALL maintain independent HostContext, SourceContext and ChannelIntent records. Host, source domain, or installed publisher SHALL NOT implicitly choose the target channel.

#### Scenario: YouTube source for a WeChat article
- **WHEN** a user asks for a WeChat article based on a YouTube video
- **THEN** YouTube is a source and wechat-article is the target; a caption source is not a YouTube publishing request

#### Scenario: Codex host for Xiaohongshu
- **WHEN** Codex executes a request for a Xiaohongshu note
- **THEN** host capability routing and Xiaohongshu editorial strategy are both applied independently

### Requirement: CPR-002 Ambiguity SHALL be explicit
Resolution SHALL prefer an explicit target, then an explicitly selected variant/account. Conflicts or ambiguous channel families SHALL produce needs_clarification rather than silently selecting a publisher.

#### Scenario: Ambiguous WeChat request
- **WHEN** a request says only “发微信” without format or destination context
- **THEN** the system identifies the ambiguity between account article, Channels video and chat, and performs no remote write

#### Scenario: Conflicting target and account
- **WHEN** the user requests a Zhihu answer but selects a WeChat account
- **THEN** the conflict is reported and neither target is silently substituted

### Requirement: CPR-003 Aliases and non-channel categories SHALL resolve without conflation
The system SHALL normalize known aliases and distinguish a channel from a medium or cross-channel task domain.

#### Scenario: Twitter alias
- **WHEN** Twitter is explicitly requested as the target
- **THEN** channel_id resolves to x while preserving the requested format and locale

#### Scenario: Podcast, growth or Baidu
- **WHEN** the request names only podcast, growth or baidu
- **THEN** the system resolves the missing destination or offers an explicitly accepted script/generic export without claiming remote delivery

### Requirement: CPR-004 Format, locale and goal SHALL influence routing before writing
A resolved ChannelIntent SHALL include format, locale, audience and goal sufficient for the requested task, or mark the missing fields explicitly. Unknown host capabilities SHALL remain unknown.

#### Scenario: Douyin and TikTok
- **WHEN** the same source is requested for Douyin and TikTok
- **THEN** two distinct channel/locale/profile decisions are recorded rather than treating the accounts as interchangeable

#### Scenario: Unknown host
- **WHEN** the executing host cannot be identified
- **THEN** it is not labeled as WorkBuddy, Codex or another known host and incompatible tool calls are not attempted
