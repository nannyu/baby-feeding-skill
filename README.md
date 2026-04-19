# babyfeeding（宝宝辅食 / OpenClaw Skill）

规则驱动的婴幼儿辅食规划技能：周计划、反应记录、食材状态机与 ICS 导出。产品需求与里程碑以 `docs/开发规划方案.md` 为单一事实来源。

## 源码仓库

- GitHub：[https://github.com/nannyu/baby-feeding-skill](https://github.com/nannyu/baby-feeding-skill)

## 快速开始

```bash
pnpm install
pnpm run build
pnpm test
pnpm run baby-feeding -- profile
pnpm run baby-feeding -- plan
```

## OpenClaw 使用

技能说明与安装步骤见根目录 `**SKILL.md**`（含 `skills/` 放置路径、`pnpm build`、`exec` 调用示例）。

## 文档

- `docs/README.md`：文档索引
- `docs/开发规划方案.md`：产品与技术 SSOT
- `docs/架构说明.md`：分层与模块边界
- `docs/路线图.md`：里程碑与当前进度（也可用 `docs/ROADMAP.md` 打开同一入口）
- `docs/工程规范.md`：协作、测试、Git 与变更顺序
- `CLAUDE.md`：给 AI/协作者的最短工作协议

## 环境变量

- `BABY_FEEDING_DB_PATH`：SQLite 路径（默认 `./data/baby-feeding.sqlite`）

