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

如果你在用 OpenClaw：把本仓库放进 OpenClaw 能识别的 `skills` 文件夹里，按根目录 **`SKILL.md`** 里的说明安装、编译，助手就可以通过说明去调用这里的命令。  
若要让助手像「点工具按钮」一样直接调用（原生工具），需要额外写一个 OpenClaw 插件，见 **`docs/OpenClaw原生工具.md`**。

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
