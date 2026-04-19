---

## name: baby-feeding
description: 规则驱动的婴幼儿辅食周计划、反应记录与日历导出（多宝宝数据隔离；高风险症状触发阻断）。
metadata: {"openclaw":{"emoji":"🍼","requires":{"bins":["node"],"anyBins":["pnpm","npm"]}}}

# 宝宝辅食（Baby Feeding Planner）

你是「科学辅食操作系统」的协作代理：菜谱表达可以自然，但**能不能吃、怎么排、何时阻断**必须由本技能背后的规则与数据库裁决。

## 何时使用

用户要：建档/更新档案、生成一周辅食计划、记录吃后反应、导出苹果日历（ICS）。

## 硬规则（必须遵守）

- **先确定作用对象**：所有写操作必须绑定明确的 `baby_id`；若用户未指定，读取当前激活宝宝并在输出中标注。
- **高风险安全红线**：一旦出现呼吸困难、面唇/舌肿胀、持续剧烈呕吐、明显精神差等（见 `data/allergen-rules.json`），必须进入风险提示并停止继续推荐新食材（调用 `log_food_reaction` 后会体现为状态与审计）。
- **规则优先于即兴**：周计划必须由 `generateWeeklyMealPlan` 写入数据库的结果为准；不要编造未写入计划的餐次。

## 工具映射（由宿主以合适方式暴露为可执行能力）

本仓库实现为 TypeScript 库 + CLI（`pnpm run build` 后 `pnpm run baby-feeding -- ...`）。在 OpenClaw 中，你应将以下能力映射为可调用工具或脚本：

- `create_or_update_baby_profile` → `createOrUpdateBabyProfile`
- `generate_weekly_meal_plan` → `generateWeeklyMealPlan`
- `log_food_reaction` → `logFoodReaction`
- `export_calendar_ics` → `exportCalendarIcs`

## 推荐输出结构（面向用户）

1. 当前宝宝：昵称、月龄、风险级别
2. 计划摘要：本周餐次数、是否启用「暂停新食材」保护、关键规则命中摘要
3. 逐日菜谱：菜名、食材、质地、做法、观察点、是否含新食材
4. 风险提示：`risk_flags` 原文优先展示
5. 联动产物：ICS 文本或保存路径（由宿主决定）

## 本地数据

默认 SQLite：`./data/baby-feeding.sqlite`（可用环境变量 `BABY_FEEDING_DB_PATH` 覆盖）。  
在 OpenClaw 里用 `exec` 跑 CLI 时，建议把 `BABY_FEEDING_DB_PATH` 设为**固定绝对路径**（例如 `{baseDir}/data/baby-feeding.sqlite`），避免工作目录变化导致数据找不到。

## 在 OpenClaw 中安装与使用（部署）

OpenClaw 加载的是 **AgentSkills 形态**：一个目录内含 `SKILL.md`（见官方 [Skills](https://github.com/openclaw/openclaw/blob/main/docs/tools/skills.md) / [Creating Skills](https://github.com/openclaw/openclaw/blob/main/docs/tools/creating-skills.md)）。本仓库根目录即技能根目录（根上已有 `SKILL.md`）。

### 1. 把技能放进 OpenClaw 能发现的目录

任选其一（优先级从高到低常见为「当前 agent 工作区」的 `skills/`）：

- **推荐（工作区技能）**：放到当前 OpenClaw workspace 下的 `skills/baby-feeding/`，并保证该文件夹里**直接**包含本仓库的 `SKILL.md`（即把整个仓库内容放进 `skills/baby-feeding/`，或 `git clone` 到该目录名）。
- **共享技能目录**：`~/.openclaw/skills/` 或 `~/.agents/skills/`（适合多台机器共用；注意与同名技能的覆盖规则）。

示例（路径按你本机 workspace 调整）：

```bash
mkdir -p ~/.openclaw/workspace/skills
git clone https://github.com/nannyu/baby-feeding-skill.git ~/.openclaw/workspace/skills/baby-feeding
cd ~/.openclaw/workspace/skills/baby-feeding
pnpm install && pnpm run build
```

若你的 OpenClaw 版本提供「从 URL 安装技能」的 UI 或 CLI，也可指向同一 GitHub 仓库；安装后仍建议在技能目录执行一次 `pnpm install && pnpm run build`。

### 2. 让 agent 能加载到该技能

- 在 `openclaw.json`（或你环境里的 OpenClaw 配置）中检查 **skills allowlist**：不要把 `baby-feeding` 排除在外（见官方 Skills config）。
- **新开会话**或重启 Gateway，使技能快照刷新：`/new` 或 `openclaw gateway restart`（以你环境为准）。
- 验证：`openclaw skills list` 中应能看到 `baby-feeding`。

### 3. 运行时如何调用（当前实现形态）

本技能**尚未**以内置 MCP 工具名注册到 OpenClaw；模型需要通过宿主提供的 `**exec` / `run_terminal_cmd` 类能力**执行本地 Node 项目：

- 技能根目录在说明里用 `**{baseDir}`** 指代（OpenClaw 对技能目录的占位符；若你使用的客户端不支持，请改为该技能目录的真实绝对路径）。
- 所有 CLI 建议前缀：`cd {baseDir} && ...`，并已构建好 `dist/`。

示例（建档、生成计划、写反应、导出 ICS）：

```bash
cd {baseDir} && pnpm run baby-feeding -- profile
cd {baseDir} && pnpm run baby-feeding -- plan 2026-04-20
cd {baseDir} && pnpm run baby-feeding -- reaction egg_yolk mild "嘴周轻微发红"
cd {baseDir} && pnpm run baby-feeding -- ics <plan_id>
```

将命令输出（JSON 或 ICS 文本）整理后回复用户；需要持久化 ICS 时，由你把 stdout 写入用户选定的 `.ics` 路径。

### 4. 沙箱 / macOS 节点

若 agent 在 **sandbox** 或 **远端 macOS 节点** 上执行：需保证镜像/节点内同样存在 `node` 与 `pnpm` 或 `npm`，且能访问 `BABY_FEEDING_DB_PATH` 所指文件（官方文档对 `requires.bins` 在 sandbox 内有单独说明）。

### 5. 进阶：做成 OpenClaw「原生工具」（非 exec）

若要让模型直接调用 `baby_feeding_*` 这类工具名，需要单独做一个 **OpenClaw Native Plugin**，在 `register(api)` 里 `api.registerTool(...)`，并在 `execute` 中调用本仓库导出的 API。安装侧通常是 `openclaw plugins install <包名或本地路径>`。详见 **`docs/OpenClaw原生工具.md`**。

## 进一步阅读

- 产品/数据/里程碑单一事实来源：`docs/开发规划方案.md`
- 项目工程约定：`CLAUDE.md`

