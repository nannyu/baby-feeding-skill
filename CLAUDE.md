# babyfeeding（宝宝辅食 OpenClaw 技能）

## 文档索引（人类协作）

- `docs/README.md`：文档总目录
- `docs/架构说明.md`：分层、依赖方向、数据流、扩展点
- `docs/路线图.md`：M1–M4 与当前状态
- `docs/工程规范.md`：分支/commit、测试门禁、变更顺序、安全底线
- 根目录 `README.md`：快速开始

## 单一事实来源

- 产品/技术/数据结构与里程碑以 `docs/开发规划方案.md` 为准。
- 实现变更若影响对外行为或数据结构，先更新该文档再改代码。

## 技术栈

- Node.js >= 18，包管理使用 **pnpm**。
- 语言：**TypeScript**；构建：**tsup**；测试：**Vitest**。
- 存储：**better-sqlite3**（本地 SQLite 单文件），规则与食材库为 **JSON 配置**。

## 目录约定

- `src/index.ts`：对外 API 与类型再导出。
- `src/tools/`*：各工具的业务入口（可被 CLI / 未来 MCP 调用）。
- `src/rules/*`：规则引擎与状态机（不得把约束逻辑塞进 Prompt）。
- `src/storage/*`：数据库连接、migrations、repositories。
- `data/*`：配置化规则与食材/模板数据。
- `tests/*`：单测与集成测试；夹具放 `tests/fixtures`。

## 命令

- `pnpm install`：安装依赖。
- `pnpm run build`：构建到 `dist/`。
- `pnpm test`：运行 Vitest。
- `pnpm run baby-feeding -- <command>`：本地 CLI（见 `src/cli.ts`）。

## 环境变量

- `BABY_FEEDING_DB_PATH`：SQLite 文件路径；未设置时默认 `./data/baby-feeding.sqlite`（相对于进程 cwd）。

## Git

- Commit message 使用英文，简洁描述意图。
- 不在未要求时执行 `git push`。

## 安全

- 禁止将密钥、token、密码写入仓库。
- 高风险症状命中时：阻断新食材推荐、更新状态、写入审计（见文档安全红线）。

