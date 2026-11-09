# Spec — santawheel.com 外链持续提交（第二批）

## 1. 目标与范围

- 目标：为 `https://santawheel.com`（免费 Secret Santa / White Elephant 抽签生成器）持续获取可验证的外链与目录收录。
- 本轮范围：**只做外链提交与发布**。不做站内内容、SEO 改写、付费投放。
- 硬约束（用户明确）：
  1. 所有提交表单的邮箱字段一律填 `dengxiaohongaikimi@gmail.com`（覆盖此前的 `xiaohongaiweno@163.com`）。
  2. 不购买任何付费加急（AlternativeTo $9 已拒绝）。
  3. 需要登录 / 收信确认 / 人机验证的最后一两步由用户本人完成；不做绕过。
  4. Reddit（r/SideProject 等）已遭全站风控删除，不再尝试。

## 2. 当前事实状态（唯一事实来源：`.backlink/ledger.json`）

`ledger.mjs stats` 输出：22 条记录 / 21 个唯一域名；submitted 8、rejected 4、candidate 8、drafted 2。

已提交且有页面级证据：

| 目标 | 证据要点 |
|---|---|
| anoox.com | "Good Job - Your Site with URL of: https://santawheel.com" |
| activesearchresults.com/addwebsite.php | urladdedconfirm.php 感谢页 |
| 9sites.net/addurl.php | "Submission received. Our editor will review your submission." |
| 247webdirectory.com/submit | 免费档 + 数学验证码，pending review |
| qualityinternetdirectory.com/submit.php | free normal 档，2–3 个月审核 |
| Product Hunt | 排期 2026-11-10 12:01am PT（北京 16:01） |
| exactseek.com/add.html | 已提交，**待用户点邮件确认链接** |
| educatorstechnology / wishes.app | 外联邮件已发出（drafted） |

已判定无效（有证据，勿重试）：finest4、elitesitesdirectory、onepagelove、localpages、ctrlalt、freead1、cuspera、apprater、nextgentools、llmstxt、appsandwebsites、awesomeindie、startupbase、somuch、freeprwebdirectory、mojeek、brave、yep、qwant、Hacker News（Show HN 限流）、sideprojects.net（launch date 满）、ABILogic(/submit 404)、Gimpsy、Secret Search Engine Labs。

## 3. 在飞三条（表单已完成，卡在人工环节）

### T1 Site Promotion Directory（浏览器 session `sp`）
- URL: `https://www.sitepromotiondirectory.com/submit.php`
- 表单已填（FormData 实测）：`LINK_TYPE=normal`（免费档）、`CATEGORY_ID=610`（Shopping » Gifts）、`TITLE=SantaWheel - Free Secret Santa Generator`、`URL=https://santawheel.com`、`OWNER_NAME=SantaWheel`、`OWNER_EMAIL=dengxiaohongaikimi@gmail.com`、`DESCRIPTION_limit=246`、`AGREERULES=true`（已补勾）。
- 唯一缺口：`CAPTCHA`（文本型图片验证码），需用户输入并点提交。

### T2 Cipinet（session `cp`）
- URL: `https://www.cipinet.com/suggest.php?action=addlink&TID=sf`
- 表单已填：`type=free`、`catlevelid[0]=133 Shopping` → `catlevelid[1]=139 Gifts & Occasions` → `catlevelid[2]=792 Christmas`、`url=https://santawheel.com`、`title=SantaWheel - Free Secret Santa Generator`、`description` 193 字符（上限 200）、`email=dengxiaohongaikimi@gmail.com`、`cipinettos=true`。
- 唯一缺口：reCAPTCHA v2 复选；评审周期 4–5 个月（免费档）。

### T3 Link Centre（session `lc`）
- URL: `https://www.linkcentre.com/get-started/create/?from=addurl&url=https%3A%2F%2Fsantawheel.com`
- 流程：Create Account → Verify Email → Submit Listing → Dashboard（当前 0%）。
- 待填字段：`first_name / last_name / email / username / password / business_name / country / marketing_consent`。
- 需用户确认：是否授权我代填密码（建议由用户自己填密码与收信验证，我只填其余字段）。

## 4. 本轮新增目标筛选方法（不再重复读文件，直接跑命令）

数据源：`/Users/xiaohongaiweno/.trae-cn/skills/backlink/data/submission-targets.json`（1032 条）
筛选器：`targets-select.mjs`，默认读取当前工作目录的 `.backlink/ledger.json`，自动排除已 submitted/rejected 域名。

执行命令（在 `/Users/workspace/ai_workspace/santawheel` 下）：

```bash
node /Users/xiaohongaiweno/.trae-cn/skills/backlink/scripts/targets-select.mjs \
  --cohort open --free-only --limit 40 --min-traffic 0 --format table
```

判定规则（避免重复踩坑）：
- 命中「需要回链 / 需要登录 / 页面 404 / 域名不可达 / 品类错配 / 付费墙」→ 记账 `rejected` 并写证据。
- 表单含 `AGREERULES`/`agree`、`*_limit` 字数计数器、`paid` 单选 → 必须显式设成免费档 + 勾选 + 同步计数器。
- 数学题验证码可自算；图片/reCAPTCHA/Turnstile 交用户。

## 5. 记账规范（每次提交后立即写）

```bash
cd /Users/workspace/ai_workspace/santawheel && \
node /Users/xiaohongaiweno/.trae-cn/skills/backlink/scripts/ledger.mjs upsert \
  --file .backlink/ledger.json --url "<submit-url>" --domain <domain> && \
node /Users/xiaohongaiweno/.trae-cn/skills/backlink/scripts/ledger.mjs transition \
  --file .backlink/ledger.json --url "<submit-url>" --state submitted \
  --evidence "<返回页原文摘要>"
```

## 6. 验证标准（Definition of Done）

1. `ledger.json` 中每条新提交都处于 `submitted` 且 `evidence` 含真实页面原文（不接受"看起来成功了"）。
2. 所有表单邮箱字段均为 `dengxiaohongaikimi@gmail.com`（提交前用 `FormData` dump 复核）。
3. `ledger.mjs stats` 的 `submitted` 数量较本轮开始时净增 ≥ 3。
4. 无法完成的环节（邮件确认、图片验证码、账号密码）明确列给用户，不静默跳过。

## 7. 需用户确认的点

- 是否授权代填 Link Centre 账号密码（默认：不代填密码，只填姓名/邮箱/用户名/公司/国家）。
- ExactSeek 确认邮件、Link Centre 验证邮件需用户在自己的 Gmail 中点击。
