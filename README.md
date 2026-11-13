# SantaWheel

免费在线 Secret Santa / 礼物交换抽签工具 — [santawheel.com](https://santawheel.com)

免注册、浏览器打开即用（手机与电脑均可，最多支持 100 人）：粘贴参与者名单，一键完成合法抽签——没人会抽到自己、排除规则双向生效，每位参与者收到一个只显示自己分配结果的私密链接。

## 核心功能

- **一键抽签**：粘贴名单自动配对，保证不抽到自己、不重复分配，并带重抽保护
- **排除规则**：夫妻/情侣、上下级等互不抽取，规则双向生效；规则冲突导致无法抽签时明确提示
- **多种分发方式**：邮件自动派发、私密链接（WhatsApp/短信等任意渠道，无需邮箱）、自主加入链接三种模式
- **隐私保护**：盲抽模式下连组织者也不知道谁抽了谁；支持匿名问答（尺码、喜好等），组织者不可见
- **愿望清单**：参与者可填写礼物愿望与收货地址，地址仅对抽中者可见
- **白象换礼模式**：支持 White Elephant / Yankee Swap / Dirty Santa，自动生成拆礼与偷礼顺序（含 3 次偷礼锁定规则）
- **定时开奖**：可设定具体时间自动抽取，也可随时取消或手动抽取

## 完整规则

以下规则与官网 [Secret Santa Rules](https://santawheel.com/secret-santa-rules)、[White Elephant Rules](https://santawheel.com/white-elephant-rules)、[Yankee Swap Rules](https://santawheel.com/yankee-swap-rules)、[Dirty Santa Rules](https://santawheel.com/dirty-santa-rules) 页面内容一致。

### Secret Santa（神秘圣诞老人）规则

玩法：每人匿名为另外一人准备礼物，抽签决定谁给谁买。

1. **提前约定预算**：预算写进邀请，对所有人生效。不写下来，就会有人花六十美元、有人花十美元。
2. **收集参与者**：三人起步才像抽签；两人互抽等于没有秘密。退出接收的人应整体退出抽签，保持闭环。
3. **抽签前约定排除规则**：夫妻、同居伴侣、兄弟姐妹、上下级等互不抽取。排除关系双向生效；极端情况下排除会让抽签无解，工具会明确报告而不是返回错误结果。
4. **一对一配对抽签**：每个名字只被抽到一次，每人只为一人买礼物、也从一人处收礼物。任何人不能抽到自己。
5. **私下发送分配结果**：邮件、私密链接（一人生成一条不可猜测的链接）或自主加入链接。不想知道配对的组织者可开盲抽模式。
6. **交换前保密**：分配结果是惊喜。不告诉抽到的人、不确认猜测、不在群聊里发配对表，交换当天才揭晓。

常见变通：抽签后有人退出 → 重新抽签并作废旧链接；有人没收到结果 → 后台重发，不要口头转述；临时加人 → 抽签前直接加入，抽签后必须重抽。

### White Elephant / Yankee Swap / Dirty Santa（白象换礼）规则

玩法：人人带一件包装好的无署名礼物放入一堆，按固定顺序轮流"拆新礼物或偷已拆礼物"。三个名字是同一种游戏的不同叫法（新英格兰叫 Yankee Swap，南方叫 Dirty Santa，其余多叫 White Elephant），差别主要在"冻结规则"。

基本流程：

1. **每人带一件礼物**：数量必须等于人数，预算由主持人写在邀请里（常见 15–25 美元），只用新礼物，不带易腐品和活物。
2. **随机确定顺序**：抽取顺序并在第一轮前锁定，之后不再变动。
3. **第一位玩家只能拆**：第一轮没有可偷的东西，只能从礼物堆里拆一件并展示。
4. **每轮二选一**：拆一件新礼物，或偷一件已被拆开的礼物。被偷的人立即再拆一件新礼物。
5. **偷礼次数有上限**：White Elephant 默认同一件礼物被偷 3 次后锁定，归最后持有人所有；Dirty Santa 的默认南方规则是礼物一经偷出立即"冻结"，不能再被偷。
6. **不许立刻偷回**：刚从你手里被偷走的礼物，你不能马上偷回去。
7. **礼物堆空了游戏结束**：结束时你手里的礼物就是你的，结束后不再交换。

常见变体：偷礼上限设为 0（纯按顺序拆礼，适合小孩）；每次轮次限偷一次；搞怪礼物专场；冻结次数改为 2 次。

## 技术栈

- Next.js 15 (App Router) + TypeScript + Tailwind v4
- Supabase Postgres 存储（`supabase/migrations/`）
- Resend 邮件派发，带重试队列
- Waffo Pancake 一次性 $4.99 高级解锁
- 部署在 Vercel

## 页面

| Route | Purpose |
|---|---|
| `/` | Secret Santa generator (primary landing page) |
| `/gift-exchange-generator` | Gift exchange generator (isolated copy, own keyword) |
| `/a/[token]` | Participant reveal page — signed token, shows only own pairing |
| `/manage/[token]` | Organizer dashboard — delivery status, resend, CSV, redraw, premium |
| `/remove/[token]` | GDPR data removal |

## 抽签引擎

`lib/draw/derangement.ts` — 约束集（"不抽自己"加上两两排除）本质是二部图完美匹配，用随机化 Kuhn 增广路径算法求解，可精确判定无解输入（无重试循环、无非法输出）。100 人 + 20 条排除毫秒级完成。

## 本地开发

```bash
npm install
cp .env.example .env.local   # fill in the services below
npm run dev                  # http://localhost:3000
```

Required services:

- **Supabase** — run the SQL files in `supabase/migrations/` in order
- **Resend** — API key + verified sending domain
- **Waffo** — one-time product, merchant id, private key, webhook (`Payload: Raw`)

`PAYMENTS_MODE=test` uses test credentials with card `4576 7500 0000 0110`.

## Tests

```bash
npm test          # vitest
npx tsc --noEmit  # type check
npm run build     # production build
```

## Deployment

Deployed on Vercel from `main`. Environment variables live in Vercel project
settings; see `LAUNCH-CHECKLIST.md` for the full pre-launch list.

The email retry queue is triggered by an external 5-minute cron
(cron-job.org) hitting `/api/cron/email-queue` with `Authorization: Bearer
$CRON_SECRET`, because Vercel's Hobby plan only allows daily crons.

## 关于作者

独立开发者，曾就职于 [华为] 等大厂，超过12年云计算研发，精通ES云服务，擅长JAVA, Python开发，独立运营 SnapByFace 人脸识别、照片分组项目与 SantaWheel 圣诞抽签工具，专注于 AI 工具产品

- X (Twitter)：https://x.com/@DengXiaoho71001
- YouTube：https://www.youtube.com/@xiaohongdeng-q1y
- 知乎：https://www.zhihu.com/people/exeta1
- Product Hunt：https://www.producthunt.com/products/snapbyface?launch=snapbyface
- 领英：www.linkedin.com/in/xiaohong-deng-781b1b443
- github: https://github.com/xiaohongaiweno

## 我的产品

### SnapByFace —— 离线优先的桌面端人脸搜索工具

SnapByFace 是一款离线优先的桌面端人脸搜索与整理工具，支持 macOS 与 Windows。

- **本地 AI 识别**：基于 ONNX Runtime 的人脸检测与特征提取，所有计算在本地完成，照片不离开设备
- **以图搜图**：导入一张参考人脸，即可在数万张照片中找出同一人的所有照片
- **视频支持**：不仅支持图片，还支持从视频文件中提取帧进行人脸识别
- **隐私优先**：无云端依赖，无账号体系，数据完全存储在本地 SQLite 数据库
- **多语言**：支持中文 / 英文双语界面

官网：https://snapbyface.com/

### SantaWheel —— 免费在线 Secret Santa 抽签工具

SantaWheel 是一款免注册的在线圣诞礼物交换（Secret Santa）抽签工具，浏览器打开即用，手机与电脑均可，最多支持 100 人。

- **一键抽签**：粘贴参与者名单即可自动配对，保证不会抽到自己、不会重复分配，并带重抽保护
- **排除规则**：可设置夫妻/情侣、上下级等互不抽取，规则双向生效；规则冲突导致无法抽签时会明确提示
- **多种分发方式**：邮件自动派发、私密链接（通过 WhatsApp/短信等任意渠道发放，无需邮箱）、自主加入链接三种模式
- **隐私保护**：盲抽模式下连组织者也不知道谁抽了谁；支持匿名问答（询问尺码、喜好等），组织者亦不可见
- **愿望清单**：参与者可填写礼物愿望与收货地址，地址仅对抽中者可见
- **白象换礼模式**：支持 White Elephant / Yankee Swap / Dirty Santa，自动生成拆礼与偷礼顺序（含 3 次偷礼锁定规则）
- **定时开奖**：可设定具体时间自动抽取，也可随时取消或手动抽取

官网：https://santawheel.com
