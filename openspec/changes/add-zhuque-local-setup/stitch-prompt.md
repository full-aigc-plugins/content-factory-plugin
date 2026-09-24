# Stitch screen prompt · Zhuque local setup

[Context]
Design a desktop web page (1280×1024 viewport) for the built-in local API-key setup of the Content Factory plugin. This screen is only for saving a Tencent Cloud EdgeOne Makers Zhuque API Key on the user's own computer. It does not verify the API, upload an article, or perform AI-content detection. Match the Google Stitch MCP setup-page visual language described here without using its name or logo: airy white canvas; subtle radial washes of ice blue at left, pale lime near upper right, and light aqua at lower right; calm black typography; centered brand, headline, and subtitle; one wide white card with soft corners and restrained shadow. The interface copy is Simplified Chinese. Use only CSS-drawn branding and no external image/font requests.

[Layout]
1. Center a narrow brand line near the top: a small rounded black square containing a white CF glyph, followed by "Content Factory", a thin separator, and serif italic "Zhuque".
2. Below it, show a large single-line desktop headline: "只需一个 Key，就能为 Content Factory 配置朱雀检测". Muted centered subtitle: "安全保存在本机，后续检测由插件按需读取".
3. Center an approximately 800px-wide white card with 24px radius and generous 42px horizontal padding. Start with compact icon and "朱雀检测 API Key".
4. Put one horizontal status bar for local configuration state. It must say "未配置" in the initial design; do not use "已授权" or imply provider authentication. Under it, put a small explanatory hint that only local presence is checked.
5. Put one inset password input and a black "保存" button in the same row. Below it, a non-secret status message. Then a short three-step list: obtain key from Tencent Cloud EdgeOne Makers, save locally, return to the agent and request detection after confirming article transmission.
6. At bottom, keep a restrained single-line safety note "保存成功 ≠ 检测通过" and an advanced hint that process `ZHUQUE_API_KEY` overrides the local file. No extra panels, charts, fake metrics, or sign-in button.

[Components]
- Password input placeholder: "粘贴腾讯云 EdgeOne Makers API Key"; keyboard-accessible label "Makers API Key"; never display a real key.
- Status bar: neutral gray, copy "未配置". Saved state is "已保存在本机" and must not claim API validity.
- Primary action: compact black button, copy "保存". Link: "前往腾讯云官方说明".
- Use responsive behavior at 390×884: wrap headline into 2–3 balanced lines, keep the card within 12px side gutters, and prevent horizontal overflow. At 768×1024 the card remains centered with comfortable padding.
- Maintain clear focus states and readable contrast. No external requests except an explicit user click on the official documentation link.
