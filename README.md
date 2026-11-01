# rea-dsh-purge

把 [dsh-purge](https://github.com/YuJunZhiXue/dsh-purge) 的红队 / 提示注入能力融合进
[REA](https://github.com/morluto/rea)（逆向工程 MCP 服务）的项目。

## 完整融合仓库（含 REA 全部源码 + dsh-purge 集成）

本 GitHub 仓库因当前构建环境的出口网络限制，仅托管**本次融合新增的 dsh-purge 集成层与文档**。
完整可运行的融合代码（REA 全部源码 + 集成）在 Gitee 镜像：

**https://gitee.com/poseidonan/rea-dsh-purge**

## 本仓库包含

- `scripts/dsh-purge-mcp.mjs` — 零依赖 MCP stdio 服务
- `scripts/dsh-purge-cli.mjs` — `rea dsh-purge` 子命令调度器
- `src/dshPurge/assets/` — 移植的提示注入模板（Apache-2.0）
- `docs/dsh-purge-integration.md` — 集成说明
- `NOTICE` — 许可声明

## 暴露的 MCP 工具

1. `dsh_purge_list_presets`
2. `dsh_purge_list_target_models`
3. `dsh_purge_route_intent`
4. `dsh_purge_render_prompt`

## 运行（在完整仓库中）

```bash
rea dsh-purge mcp                         # 启动 MCP 服务
rea dsh-purge prompt --task "..." --role recon   # 直接渲染提示词
```

详见 Gitee 完整仓库的 `docs/dsh-purge-integration.md`。

## 许可

REA 代码 MIT；dsh-purge 移植部分 Apache-2.0。仅限授权安全研究使用。
