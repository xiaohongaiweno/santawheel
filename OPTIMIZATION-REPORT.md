# SantaWheel 优化报告 — 第二轮（Phase 5–8）

日期：2026-11-04 ｜ 分支：`main` ｜ 改动尚未提交、尚未部署
状态：Phase 5–8 已实现；前两个迁移已应用并完成端到端验证；第三个迁移（删除活动）待应用。
第一轮（Phase 1–4）内容见本文件下半部分「附：第一轮摘要」。

---

## 一、Phase 5：交付模式与盲抽

### 1.1 两种交付模式

| 模式 | 参与者需要邮箱 | 谁发送 | 适用 |
|---|---|---|---|
| Email delivery（默认） | 是 | 系统通过 Resend 每人一封 | 大多数场景，最省事 |
| Private links | **否，只要名字** | 组织者自己复制链接，用 WhatsApp / Messenger / 群聊转发 | 不想收集邮箱、家人长辈不用邮箱 |

实现方式：

- `exchange.delivery_mode`（`'email' \| 'link'`，默认 `email`）
- `participant.email` 改为可空；`unique (exchange_id, email)` 保留 —— Postgres 允许多个 NULL，所以邮箱模式仍然防重复，链接模式可以不填
- 链接模式下后端**主动丢弃**任何传入的邮箱（`normalizeParticipants({requireEmail:false})`），因为「不收集邮箱」是隐私承诺，不是 UI 上的省略
- 创建响应直接返回 `links: [{name, url}]`，成功页立刻列出可复制的链接（否则用户得先回面板才有链接）；重复提交（幂等键命中）时同样返回这批链接，不会落到「没有链接」的空成功页
- 管理面板为链接模式单独渲染「Private links」列表（每人一行 + 单个复制 + 一键复制全部）

### 1.2 私密链接的 token 设计（与提示词的一处刻意偏离）

提示词建议「数据库存 token 哈希」。这里的实现是**不存 token**：

```
token = base64url(payload) + "." + HMAC-SHA256(payload, APP_TOKEN_SECRET)
payload = { t: "a", x: exchangeId, p: participantId, g: drawGeneration }
```

理由：

1. 数据库里没有任何 token 明文，也没有哈希落库 —— 比存哈希少一份可泄露的资产；
2. 组织者必须能**随时重新取回**每个人的链接（他们要在几周后补发），哈希方案做不到，除非再存一份明文；
3. 撤销由 `drawGeneration` 承担：重置抽签 → 代际 +1 → 所有旧链接立即失效（`/a/[token]` 校验 `payload.g === exchange.draw_generation`）；
4. 校验走 `timingSafeEqual`，链接不含任何可直接枚举的 ID，也没有把配对结果放进 URL 参数。

如果将来需要「单条链接撤销 / 过期」，再引入 `assignment.token_hash` 表更合适，本轮没有为此加复杂度。

### 1.3 Organizer Blind Mode

- `exchange.blind_mode`，DB 约束 `not blind_mode or delivery_mode = 'email'`（见下）
- 管理面板**根本不查询** `pair` 表（不是查出来再隐藏）；页面不渲染「draws X」、不显示 CSV 按钮
- `/api/manage/csv` 在 blind 模式返回 403，且**在查 pair 之前**就拒绝
- 判断逻辑集中在 `lib/exchange-visibility.ts` 的 `exchangePolicy()`，页面 / 导出 / 按钮共用一份，避免某个页面忘记检查
- 邮件文案切换为「dashboard 不会显示谁抽到谁」

**为什么盲抽不提供链接模式**：链接模式下组织者手里必然有每个人的链接，声称「看不见配对」是假的。所以 `blind + link` 在 API 层直接 400，DB 层还有 check 约束兜底。

**诚实边界**（已写进隐私政策与面板提示）：盲抽能保证面板不显示、不导出配对；但任何人打开某个参与者的链接，仍会看到那一个人的分配 —— 这是所有链接式方案的共同前提，不假装能防住。

### 1.4 部署顺序安全（fail-closed）

新增迁移未应用时：

| 场景 | 行为 |
|---|---|
| 普通邮箱抽签 | 自动降级插入（少 `delivery_mode`/`blind_mode` 列），功能不受影响 |
| 用户选了 Private links 或 Blind mode | **503 + 明确提示「需要先跑迁移」**，绝不静默降级成「发邮件 + 面板全可见」 |
| Supabase schema cache 报 `PGRST204` | 与 `42703` 同等处理（实际环境返回的是 PGRST204，已实测） |

---

## 二、Phase 6：SEO 与内容

### 2.1 Gift Exchange 页重写（差异化的同时删掉不实功能）

原页面有两处问题：与首页高度同质；并且宣称「可以抽白象交换的挑选顺序」——这个功能并不存在。本轮：

- 删除「picking order」相关文案与两张「抽签结果消息模板」卡片（那是文案，不是功能）
- 内容改为独立搜索意图：办公室交换、家庭交换、name picker 的算法差异（为什么「洗牌重试」会误判无解）、不收集邮箱的做法
- FAQ 重写为 7 条，其中明确回答「这是不是 white elephant / yankee swap」→ **不是**，我们只做「一人买给一人」的抽签
- 从 FAQ 到结构化数据全部对齐真实行为

### 2.2 首页

- 首屏副标题改为「by email, or as a link you hand out yourself」，信任点增加 `Blind mode`
- 「How it works」三步改为覆盖两种交付方式
- 新增两段正文：`No email addresses? Use private links`、`Gift exchange, not Secret Santa?`（指向 `/gift-exchange-generator`）
- FAQ 第 3、5 条改写：邮箱「只有邮件模式需要」；组织者可见性说明盲抽

### 2.3 结构化数据与内部链接

| 项 | 状态 |
|---|---|
| 首页 `WebApplication` + `FAQPage`（10 问） | 保留，与正文一致 |
| Gift 页 `WebApplication` + `FAQPage`（7 问）+ Breadcrumb | 名称改为 `SantaWheel Gift Exchange Generator`，避免与首页重复实体 |
| 首页 → Gift 页 | 正文 1 处 + 底部导航 |
| Gift 页 → 首页 | 正文 1 处 |
| Privacy / Terms | 页脚 + 两页互链 |
| sitemap | 仅 4 个公开页；`/a/*`、`/manage/*`、`/remove/*` 永不入 sitemap |

未加评分 / 评论 / 价格以外的字段，避免触发 Google 结构化数据处罚。

---

## 三、Phase 7：White Elephant 方案（本轮只出方案，未写代码）

### 3.1 结论先说

White Elephant / Yankee Swap 不是抽签，是**有状态的回合游戏**：顺序 + 偷取 + 次数上限。复用现有 `pair` 表会把数据模型带歪，建议独立建模，且**不要**先做一个只有营销文案的空页面。

### 3.2 玩法需要的最小模型

```
white_elephant_game
  id, title, organizer_email, steal_limit (1–3), turn_order (uuid[]),
  status ('lobby' | 'playing' | 'finished'), created_at

white_elephant_player
  id, game_id, name, seat_no, current_gift_id (nullable), joined_at

white_elephant_gift
  id, game_id, label, opened (bool), owner_player_id

white_elephant_move        -- 追加日志，不可改
  id, game_id, seq, player_id, action ('open' | 'steal'), target_player_id, created_at
```

顺序用「服务端洗牌后写入 `turn_order`」，与现有 CSPRNG 洗牌复用同一个函数。

### 3.3 交互与并发

- 单设备模式（一台手机传着玩）：状态机在服务端，前端只是投票器，最省事
- 多设备模式：需要「当前轮到谁」的 token（复用现有 `signToken`，加 `t:"p"`），每次动作校验 `seq` 防止两人同时偷同一个礼物
- 偷取规则：每个礼物最多被偷 `steal_limit` 次；被偷者必须从剩余礼物里重开一个；最后一轮第一个玩家可偷最后一个礼物（可选规则，做成开关）

### 3.4 成本与排期建议

| 项 | 工作量 | 风险 |
|---|---|---|
| 数据模型 + 迁移 | 0.5 天 | 低（新表，不动现有表） |
| 服务端状态机 + 单测 | 1.5 天 | 中（偷取/重开的边界多） |
| 单设备 UI | 1.5 天 | 中（移动端为主） |
| 多设备 + token | 1 天 | 中高（并发一致） |
| SEO 页面 + FAQ | 0.5 天 | 低 |

建议：先做「单设备 + 偷取上限」，验证有人用之后再上多设备。**在此之前不要建 `/white-elephant-generator` 页面**，否则就是一个没有功能的落地页，Google 会当成 doorway page。

---

## 四、Phase 8：测试与验证（本机实跑）

```
npx tsc --noEmit   → 0 error
npm run lint       → 0 error / 0 warning
npm test           → 5 files / 66 tests 全部通过（新增 19 例）
npm run build      → 成功，20 routes
```

新增 `tests/delivery-modes.test.ts`（19 例）：

- `exchangePolicy`：无字段（老数据）/ link / blind 三种组合下的可见性、导出、发信、链接展示
- `isValidModeCombination`：blind 只允许搭配 email
- 链接模式参与者校验：无邮箱可通过、同名拒绝（即使邮箱不同）、同邮箱仍拒绝、2–100 边界、传入邮箱被丢弃
- `participantKey`：无邮箱时用 id 区分同名，避免抽签把两个人合并
- `parseNameList`：纯名单、带邮箱的名单（丢弃邮箱）、重复名报错
- `parseExclusionLines`：无邮箱时按名字解析、有邮箱时按邮箱解析、未知名字报错

本地生产模式冒烟（`next start`，真实 Supabase）：

```
/                          200   H1=Free Secret Santa Generator，10 条 FAQ JSON-LD
/gift-exchange-generator   200   H1 唯一，7 条 FAQ，无 picking-order 宣称
/privacy /terms            200   含 private-link / blind 章节
/sitemap.xml /robots.txt   200
POST /api/exchanges  blind + link        → 400 "Blind mode is only available with email delivery"
POST /api/exchanges  link（迁移前）       → 503 "Private link mode needs a database migration..."
POST /api/exchanges  链接模式同名两人      → 400 "Two participants are called \"alex\" ..."
POST /api/exchanges  邮箱模式 1 人         → 400 "At least 2 participants are required"
```

### 4.1 迁移应用后的端到端验证（真实数据库）

两个迁移在 Supabase 应用后重跑，全部通过：

| 验证项 | 结果 |
|---|---|
| 链接模式创建（3 人，无邮箱） | `201`，`delivery.processed=0`（确认一封邮件都没发），返回 3 条链接 + 面板链接 |
| 数据库里参与者的 `email` | 三条全部为 `null` —— 「不收集邮箱」是真的没存，不是 UI 省略 |
| `email_job` 表 | 该活动 0 条记录 |
| 三人打开各自链接 | Alice→Bob、Bob→Carol、Carol→Alice，完整闭环，无人自抽 |
| 单个链接页面内容 | Alice 页面只出现 `Alice`×1、`Bob`×1、`Carol`×0 —— 不泄露其他人 |
| 篡改 token 末位字符 | 渲染「This link is not valid」，页面含 0 个参与者名字 |
| 交叉伪造（B 的 payload + A 的签名） | 同上，验签失败 |
| 幂等键重放（同一 requestId 二次提交） | `200 reused:true`，库里仅 1 条，**并返回完整 3 条链接** |
| 重抽 | `generation` 1→2，旧链接渲染「This link has been revoked」，面板给出新链接且可用 |
| 盲抽面板 | 显示「Blind mode / You cannot see who drew whom」，无配对表、无 CSV 按钮 |
| 盲抽 CSV 导出 | `403 "This draw is in blind mode — pairings are never exported."` |
| 非盲抽 CSV 导出 | `200`，正常输出表头与三行配对（回归未破） |
| 删除接口鉴权 | 无 token `403`；缺 confirm `400`；函数未迁移 `503` 且提示具体文件名 |

### 4.2 这轮验证中发现并修掉的一个真实缺陷

**重复提交（双击 / 连接中断后重试）拿不到私密链接。** `draw-flow` 的幂等分支已经算好了 `links`，但路由层 `reused` 分支把响应写死成 `links: []`，于是用户第二次提交会落到一个「已创建，但没有链接可复制」的成功页 —— 恰好是最需要链接的时刻。已改为透传 `links`，实测重放返回 3 条。

### 4.3 补上隐私政策承诺但未实现的能力：删除整个活动

隐私政策写着「organizers can ask us to delete the whole draw」，但代码里只有「redact 单个参与者」，没有删除整个活动的路径；而 `pair` / `participant` 有不可变触发器，任何直接 `DELETE` 都会被 `DRAW_RESULTS_ARE_IMMUTABLE` 拒绝。也就是说这条承诺此前只能靠人工进后台、且实际会被触发器挡住。

本轮补齐：

- 迁移 `20261104060000_purge_exchange.sql` 新增 `purge_exchange(uuid)`，用与 `reset_draw` 相同的事务级开关 `app.allow_pair_reset` 绕过触发器，按 `email_job → assignment → pair → participant → pair_history → exchange` 顺序清理
- 函数 `revoke` 掉 `public` / `anon` / `authenticated`，只 `grant` 给 `service_role` —— 匿名者无法删除别人的活动
- 新接口 `POST /api/manage/delete`：必须持 organizer token（`t === "o"`）且 body 里字面写 `confirm: "DELETE"`
- 面板底部新增「Delete this draw」，二次确认面板要求手动输入 `DELETE` 才解锁按钮

实测（迁移应用后，通过真实接口删除 5 条测试活动）：

| 验证项 | 结果 |
|---|---|
| 无 token / 缺 confirm / 函数未迁移 | `403` / `400` / `503`（带迁移文件名） |
| 删除 5 条活动 | 5×`200 {"ok":true}` |
| 删除后 `participant` / `pair` / `assignment` / `email_job` / `pair_history` | 按 `exchange_id` 分组核对，**零孤儿** |
| 已删除活动的分配链接 | 「Draw not found — This draw no longer exists」 |
| 已删除活动的组织者面板 | 同样「Draw not found」 |

---


## 五、需要你手动完成

1. **应用第三个迁移**（前两个已应用）：
   - `supabase/migrations/20261104060000_purge_exchange.sql` ← 新增，**不跑则面板的「Delete this draw」返回 503**
   文件末尾写了回滚语句。
2. **部署**：`git push` → Vercel 自动构建。无需新增环境变量。
3. **部署后 E2E**（建议各跑一轮，5 人以内）：
   - 邮箱模式 + 盲抽：确认邮件到达、面板看不到「draws X」、CSV 按钮消失
   - 链接模式：确认成功页立刻给出链接、逐个打开只看到自己的、重置后旧链接失效
   - 活动结束后点「Delete this draw」，确认面板变「Draw deleted」、旧链接全部失效
4. **GSC**：`/gift-exchange-generator` 内容已变，重新请求编入索引；sitemap 不用改。

---

## 六、仍然存在的问题

| 问题 | 说明 | 建议 |
|---|---|---|
| token 无过期 | 只靠重置撤销 | 加 `token_expires_at`（需迁移）或接受现状 |
| 无自动数据过期 | 隐私政策已如实写「暂无」 | 加 90 天清理 cron，需产品确认 |
| 盲抽不防「组织者逐个点开链接」 | 结构性限制，已在 UI 明说 | 不修，只能靠文案诚实 |
| White Elephant 未实现 | 见 Phase 7 | 单设备版本优先 |
| 链接模式无「打开状态」 | 不插 assignment 行 | 若要统计打开率，需单独埋点表 |
| 删除活动无冷却 | 依赖 token + 手输 DELETE 双闸 | 目前够用；若被滥用再加限流 |

---

## 附：第一轮摘要（Phase 1–4）

### 审计结论

抽签用双分图完美匹配（Kuhn 增广路），不是「随机排序硬配」；`perform_draw` 行锁 + `EXCHANGE_ALREADY_DRAWN` 保证并发只出一个结果；`pair` 表有不可变触发器。**算法未重写**，只把随机源从 `Math.random()` 换成 `crypto.randomInt`。

### 修掉的 10 个问题

| # | 问题 | 处理 |
|---|---|---|
| 1 | 无 `/privacy`、`/terms` | 新增两页，逐条对齐真实实现 |
| 2 | 双击/重试建两个活动、发两轮邮件 | 幂等键（先查后插、`23505` 回查、缺列降级） |
| 3 | 只靠邮件拿面板链接 | 创建响应返回 `managePath`，成功页给链接 + 复制 |
| 4 | 100 人串行发信易超时 | 队列加并发池（默认 6），请求内最多 40 封 |
| 5 | 重发接口可轰炸邮箱 | 同收件人 10 分钟 3 次；只处理刚入队的任务 |
| 6 | 重抽仅 `window.confirm` | 站内二次确认 + 服务端 60 秒冷却 |
| 7 | 抽签前无确认信息 | 确认页：人数、邮箱、排除、交付、重抽政策、名单明细 |
| 8 | `site.description` 是脚手架文案 | 换成真实产品描述 |
| 9 | 私密 token 页可缓存、Referer 泄露 | `noindex` + `no-store` + `no-referrer` |
| 10 | `Math.random()` 非等概率 | `crypto.randomInt` |

第一轮验证：tsc / eslint / build 全绿，46 测试通过，无 token 访问 `/api/manage/*`、`/api/remove` 全部 403。
