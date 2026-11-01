# dsh-purge ported assets

These files are a **faithful port** of material from
[YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge), licensed
under **Apache License 2.0** (see `LICENSE.dsh-purge` in this directory).

- `prompt-inject.zh.md` — dsh-purge's Chinese red-team system-prompt template
  (from dsh-purge `lib/default-prompt-inject.zh.md`).
- `prompt-inject.en.md` — dsh-purge's English red-team system-prompt template
  (from dsh-purge `lib/default-prompt-inject.en.md`).

The intent-routing keyword map, rule titles, and web-pentest canned workflows
that the MCP server uses are extracted verbatim from `prompt-inject.zh.md`'s
"Scoped Rules — 动态路由" and "WEB PENTEST ROUTING" sections.

No changes were made to the security behaviour of the ported prompt framework.
The original DeepSeek-cordis plugin code (which only runs inside
`@deepseek-ai/*` runtimes) was intentionally **not** carried over; only the
portable prompt assets and routing knowledge were.
