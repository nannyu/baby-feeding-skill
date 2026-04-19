# 在 OpenClaw 中做成「原生工具」（registerTool）

> 目标：模型在对话里直接调用 `baby_feeding_*` 这类工具，而**不要求**模型自己拼 `exec` + shell 命令。  
> 前提：你使用的 OpenClaw Gateway 版本支持官方 **Plugin SDK**（见 OpenClaw 文档 *Building Plugins* / *Plugins*）。

---

## 1. 原理：Skill ≠ Tool

| 形态 | OpenClaw 做什么 | 谁执行业务 |
|------|------------------|-----------|
| **Skill**（`SKILL.md`） | 把说明注入系统提示，教模型「何时、怎么用能力」 | 通常靠 `exec` / 你自建的脚本 |
| **Plugin + `registerTool`** | 在 Gateway 内注册**具名工具**与 JSON Schema | 你的 `execute()` 里跑 TS/调库 |

因此「原生工具一条命令」指的是：**用户侧一条安装/启用插件的命令**（例如 `openclaw plugins install ...`），开发侧则需要**单独做一个 OpenClaw 插件包**，在 `register()` 里挂上多个 `registerTool`。

---

## 2. 推荐仓库形态（单仓双包或分包）

**包 A（已有）**：`baby-feeding-skill` — 纯库 + CLI + `SKILL.md`，不依赖 OpenClaw。

**包 B（新建）**：例如 `@your-scope/openclaw-baby-feeding` — 仅含 OpenClaw 插件入口：

- `openclaw.plugin.json`（manifest）
- `package.json`（声明 `openclaw.extensions` 指向入口文件，compat 版本与官方文档对齐）
- `src/index.ts`：`definePluginEntry` → 多次 `api.registerTool({ name, description, parameters, execute })`

在包 B 里用 **npm 依赖** 引用包 A：

- 若都未发布：`"baby-feeding-skill": "file:../baby-feeding-skill"`（路径按 monorepo 调整）
- 若 A 已发布 npm：`"baby-feeding-skill": "^0.1.0"`

`execute()` 内：**创建（或复用）数据库连接**，调用 A 中已存在的函数，例如：

- `createOrUpdateBabyProfile(db, …)`
- `generateWeeklyMealPlan(db, data, …)`（需 `loadDataBundle` 或把 `createRuntime()` 抽到 A 的公共 API）

把工具返回值整理成 OpenClaw 期望的形态（官方示例为 `return { content: [{ type: "text", text: "..." }] }`，以你当前 Gateway 版本文档为准）。

---

## 3. 插件最小骨架（示意，以官方文档为准）

以下与 OpenClaw 官方 *Quick start: tool plugin* 同结构，仅把工具名换成业务语义：

**`openclaw.plugin.json`**

```json
{
  "id": "baby-feeding",
  "name": "Baby Feeding",
  "description": "Baby feeding planner tools (profile, weekly plan, reactions, ICS)",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "databasePath": { "type": "string", "description": "SQLite file path" }
    }
  }
}
```

**`package.json`（节选）**

- `type: "module"`
- `dependencies`: `baby-feeding-skill`（指向你的核心包）+ `openclaw` 相关 peer 按官方模板
- `openclaw.extensions`: 指向 `./src/index.ts`（或构建后的 `./dist/index.js`，以官方推荐为准）

**`src/index.ts`（逻辑示意）**

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
// import { createRuntime, ... } from "baby-feeding-skill";

export default definePluginEntry({
  id: "baby-feeding",
  name: "Baby Feeding",
  description: "Planner tools",
  register(api) {
    api.registerTool({
      name: "baby_feeding_profile_upsert",
      description: "Create or update baby profile",
      parameters: Type.Object({
        nickname: Type.String(),
        dob: Type.String(),
        allergy_risk: Type.Union([
          Type.Literal("low"),
          Type.Literal("medium"),
          Type.Literal("high"),
        ]),
      }),
      async execute(_id, params) {
        // const { db, data } = createRuntimeFromPluginConfig(api);
        // const result = createOrUpdateBabyProfile(db, { ...params, make_active: true });
        return { content: [{ type: "text", text: JSON.stringify({ ok: true }) }] };
      },
    });
  },
});
```

实际实现时把注释替换为真实调用，并统一处理 `db.close()`（若每 call 新建连接）或使用连接池策略（需自行设计，避免泄漏）。

---

## 4. 用户侧「一条命令」装插件

开发完成后，用户典型路径为：

```bash
openclaw plugins install @your-scope/openclaw-baby-feeding
# 或本地开发链接：
openclaw plugins install -l /path/to/openclaw-baby-feeding
openclaw gateway restart
```

在 `openclaw.json` 里为该插件打开 `plugins.entries.baby-feeding.enabled`（以及若工具声明为 `optional: true`，还要配 `tools.allow`，见官方 *Registering agent tools*）。

---

## 5. 你必须提前想清楚的工程点

1. **Gateway 进程内 native 模块**：核心包使用 `better-sqlite3`，插件与 Gateway 同进程加载时，需与 Gateway 的 **Node 版本 / 架构** 一致，否则预编译二进制不匹配。
2. **工作目录与 DB 路径**：插件里不要用「当前 shell cwd」隐式决定 SQLite 路径；应用 `openclaw.plugin.json` 的 `configSchema`（例如 `databasePath`）或固定目录。
3. **`loadDataBundle(import.meta.url)`**：在**插件包**内调用时，`import.meta.url` 指向插件文件；需保证 `data/*.json` 仍被打进插件发布物（`files` 字段）或通过 A 包从 npm 路径读取。
4. **版本对齐**：`package.json` 里 `openclaw.compat` / `pluginApi` 与官方模板一致；OpenClaw 升级后可能要跟测。
5. **已知风险**：社区曾报告 `registerTool` 与 agent 运行时可见性相关问题；若工具未出现在模型侧，用 `openclaw plugins inspect` 与官方 issue 对照排查。

---

## 6. 备选：MCP 工具（非 OpenClaw 内嵌 registerTool）

若你更希望 **MCP 标准** 暴露工具：可单独实现一个 MCP Server，在进程里调用本仓库的 TS API；OpenClaw 侧是否接入取决于当前版本对 MCP 插件/通道的支持（见官方 *Plugin Bundles* / MCP 相关说明）。这与「OpenClaw native plugin」是两条不同集成链。

---

## 7. 相关链接（官方）

- Plugins 总览：<https://github.com/openclaw/openclaw/blob/main/docs/tools/plugin.md>
- Building Plugins（含 `registerTool` 示例）：<https://github.com/openclaw/openclaw/blob/main/docs/plugins/building-plugins.md>
- Skills 加载规则（与插件并存）：<https://github.com/openclaw/openclaw/blob/main/docs/tools/skills.md>

本仓库当前交付以 **Skill + CLI** 为主；**原生工具**请以上述「包 B 插件」方式扩展。
