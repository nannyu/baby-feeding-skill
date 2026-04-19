# 宝宝辅食规划（babyfeeding）

**这是一个帮家长给 6 个月以上宝宝安排辅食、记吃饭反应、并导出日历文件的本地小工具，用固定规则算「能吃什么、怎么排」，数据存在你自己电脑上的数据库里。**

它不是看病软件，也不替代医生；遇到呼吸困难、脸肿、剧烈呕吐等情况，请直接就医，工具里也会按规则提示停掉「自动加新食材」。

---

## 你能用它做什么

- **给宝宝建档**：姓名、生日、过敏风险等基础信息。
- **生成一周辅食安排**：按月龄给出多天的餐次建议（具体菜谱由内置模板和规则组合出来）。
- **记录吃完的反应**：例如是否过敏、爱不爱吃；严重不适会触发保护逻辑。
- **导出苹果日历（ICS）**：把计划导入手机日历，方便提醒。

---

## 怎么用（本地运行）

适合愿意打开终端、复制命令使用的家长或开发者。

**第 0 步：准备环境**

- 已安装 [Node.js](https://nodejs.org/)（建议 18 或以上）
- 已安装 [pnpm](https://pnpm.io/)（没有的话可先装：`npm install -g pnpm`）

**第 1 步：下载代码并进入目录**

```bash
git clone https://github.com/nannyu/baby-feeding-skill.git
cd baby-feeding-skill
```

**第 2 步：安装依赖并编译**

```bash
pnpm install
pnpm run build
```

**第 3 步：试着跑一条命令**

先给宝宝建个档案（示例里是默认演示数据，你可改参数）：

```bash
pnpm run baby-feeding -- profile
```

再生成一周计划：

```bash
pnpm run baby-feeding -- plan
```

命令行里会出现 `plan_id` 之类信息；若要导出日历文件：

```bash
pnpm run baby-feeding -- ics <把这里的 plan_id 换成上一步输出的>
```

终端里打印出来的是 **ICS 文本**，你可以复制保存成 `某某周.ics`，再用系统日历「导入」。

想确认计划内容时：

```bash
pnpm run baby-feeding -- show-plan <plan_id>
```

**数据存哪儿？**

默认在项目目录下的 `data/baby-feeding.sqlite`（数据库文件）。想换位置可设置环境变量 `BABY_FEEDING_DB_PATH` 指向别的路径。

---

## 和 OpenClaw（智能助手）一起用

OpenClaw 要能「看到」本技能，需要把本仓库放到它扫描的 **`skills`** 目录里，并完成 **`pnpm install` + `pnpm run build`**。下面给你两种方式。

### 一条命令安装（推荐：在自己电脑终端里执行）

复制下面**整行**，在 macOS「终端」或 Windows「PowerShell/WSL」里粘贴回车（需要已安装 `git` 和 `curl`，并能访问 GitHub）：

```bash
curl -fsSL https://raw.githubusercontent.com/nannyu/baby-feeding-skill/main/scripts/install-openclaw-skill.sh | bash
```

脚本会做三件事：在默认目录 `~/.openclaw/workspace/skills/baby-feeding` **克隆或更新**代码 → **安装依赖** → **编译**。  
若你的 OpenClaw 工作区不在默认路径，可先设置环境变量再执行同一行命令，例如：

```bash
export OPENCLAW_WORKSPACE="$HOME/你的路径/openclaw-workspace"
curl -fsSL https://raw.githubusercontent.com/nannyu/baby-feeding-skill/main/scripts/install-openclaw-skill.sh | bash
```

装完后：**新开一轮对话**，或按你环境的要求**重启 Gateway**；再在终端执行 `openclaw skills list`，应能看到 **`baby-feeding`**。之后助手会按根目录 **`SKILL.md`** 的说明，用 `exec` 去调本项目里的命令。

> **若 `curl` 访问 raw.githubusercontent.com 失败**：请改用「手动克隆」那一节（上面「第 1 步」），把仓库克隆到 `你的OpenClaw工作区/skills/baby-feeding/`，再在该目录执行 `pnpm install && pnpm run build`。

### 复制到 OpenClaw 对话里让助手执行（可选）

前提：你的 OpenClaw **允许助手执行终端/系统命令**（例如 `exec`），且本次执行你点了**允许联网**（要拉 GitHub 脚本和代码）。

把下面**整段**复制进 OpenClaw 对话即可（只有一行命令，减少助手改写字面量的机会）：

```text
请在主机上执行（需联网、可能需要我批准）：curl -fsSL https://raw.githubusercontent.com/nannyu/baby-feeding-skill/main/scripts/install-openclaw-skill.sh | bash
```

若助手拆成多步执行也可以，只要最终等价于：下载并运行上述脚本。执行成功后同样要**新开会话或重启 Gateway**，再检查 `openclaw skills list`。

### 想做成「点一下工具」那种原生能力

需要额外写一个 OpenClaw 插件（`registerTool`），见 **`docs/OpenClaw原生工具.md`**。

---

## 源码与详细文档

- **GitHub 仓库**：[nannyu/baby-feeding-skill](https://github.com/nannyu/baby-feeding-skill)
- **产品说明书（最全）**：`docs/开发规划方案.md`
- **文档目录**：`docs/README.md`（架构、路线图、工程规范等）
- **给 AI 助手的短约定**：`CLAUDE.md`

---

## 参与开发或改代码

```bash
pnpm install
pnpm run build
pnpm test
```

更细的协作规范见 `docs/工程规范.md`。
