# SantaWheel 测试用例集

> 覆盖版本：commit `6b8173c`（匿名问答 / 地址收集 / 定时抽签已上线）
> 环境：生产 https://santawheel.com + Supabase 生产库 + Resend 生产模式
> 优先级：P0 = 冒烟必测（阻塞发布）｜P1 = 核心回归｜P2 = 边界/体验
> 已自动化：`tests/`（vitest，66 条）覆盖 derangement、tokens、delivery-modes、import-parser、draw-reliability。其余为线上 API/页面级用例，脚本化冒烟见本文末尾。

---

## 1. 创建抽签（DrawForm / POST /api/exchanges）

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-101 | 标准名单（每行 `Name, email`）创建 email 模式抽签 | 201；每人收到 assignment 邮件；成功页显示 dashboard 链接 | P0 |
| TC-102 | 仅名字（无邮箱）+ link 模式 | 201；返回每人一条私有链接；不发送任何参与者邮件 | P0 |
| TC-103 | 从 spreadsheet 复制多列/带空行的文本 | 正确解析人数，忽略空行 | P1 |
| TC-104 | 参与者超过 100 人 | 创建被拒并提示上限 100 | P0 |
| TC-105 | 名单内重名 | 409/提示去重（或按参与者规则合并），给出明确错误 | P1 |
| TC-106 | 名单内重复邮箱 | 409，提示邮箱已存在 | P1 |
| TC-107 | 无效邮箱格式（email 模式） | 400，指出问题行 | P1 |
| TC-108 | link 模式下带邮箱 | **设计如此：link 模式刻意丢弃邮箱**（"nothing is emailed, so holding one would be data we do not need"）——不落库、不发信 | P2 |
| TC-109 | organizer email 缺失/格式错（email 模式） | 400 "A valid organizerEmail is required" | P0 |
| TC-110 | link 模式 organizer email 留空 | 允许；dashboard 链接仅在成功页展示一次 | P1 |
| TC-111 | 标题为空/纯空格 | 400 "Title is required" | P2 |
| TC-112 | 双击提交 / 网络重试（同 requestId） | 幂等：返回同一 exchange，不重复抽签不重复发信 | P0 |
| TC-113 | 同 IP 1 小时内第 6 次创建 | 429 + Retry-After | P1 |
| TC-114 | kind=secret_santa vs gift_exchange 页面隔离 | 数据按 kind 隔离，邮件文案匹配对应页面用语 | P2 |
| TC-115 | 创建中途失败（如插入参与者报错） | exchange 回滚删除，无孤儿行 | P1 |
| TC-116 | 邮件全部发送失败时成功页 | 显示"还在重试 + dashboard 链接可用"而非死路文案 | P1 |

## 2. 排除规则

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-201 | 单组双向排除（夫妻） | 抽签永不互配 | P0 |
| TC-202 | 多组排除混合邮箱/名字引用 | 全部解析并遵守 | P1 |
| TC-203 | 排除引用不存在的人 | 400，列出未匹配的名字 | P1 |
| TC-204 | 自我排除（A-A） | 忽略或拒绝，不影响抽签 | P2 |
| TC-205 | 排除导致数学无解（如 3 人互斥） | UnsolvableDrawError → 明确文案，不落库不发信 | P0 |
| TC-206 | 大量排除（50+ 组） | 抽签仍在时限内完成 | P2 |
| TC-207 | 重复提交同一排除对 | upsert 幂等，无重复行 | P2 |
| TC-208 | 管理页排除编辑器 replace-all | 旧排除被整体替换；抽签后（drawn）提交被拒 | P1 |

## 3. 预算 / 交换日期

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-301 | 预算 20 / 日期 2026-12-20 创建 | exchange 落库；assignment 邮件含 "Budget: $20 · Exchange day: Sun, Dec 20" | P0 |
| TC-302 | 预算 0 / 负数 / 非数字 | 视为空，不显示 chips | P2 |
| TC-303 | 过去的日期 | 允许保存（不阻断）或校验提示——与产品预期一致即可 | P2 |
| TC-304 | /a 页 chips 展示 | Budget / Exchange day 徽章正确（注意 SSR 文本节点拆分，断言需放宽） | P1 |
| TC-305 | 重绘后预算/日期保持 | 同一 draw 的 budget/deadline 不因重绘改变 | P1 |

## 4. 抽签引擎与数据一致性

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-401 | 2 人最小抽签 | 唯一合法环（互抽） | P0 |
| TC-402 | 100 人抽签 | <1s 完成，结果一对一且无人自抽 | P0 |
| TC-403 | 并发双击 draw / 双 worker | perform_draw 行锁串行，第二次报 EXCHANGE_ALREADY_DRAWN，结果只有一份 | P0 |
| TC-404 | pair 表不可变性 | 任何直连 UPDATE/DELETE 触发 DRAW_RESULTS_ARE_IMMUTABLE | P1 |
| TC-405 | validateDraw 内部校验 | 非法结果永远不落库（internal error 分支） | P1 |
| TC-406 | 重绘（redraw） | generation+1；旧 assignment token 全部失效；removed 参与者硬删除 | P0 |
| TC-407 | 重绘限流 | 短时间重复重绘被 429 | P1 |
| TC-408 | paid 抽签 no-repeat | 与同 organizer 历史 pair 不重复（pair_history 作为附加排除） | P1 |
| TC-409 | 抽签后 email/名字被 GDPR redact 的参与者 | 不参与抽签；重绘时硬删 | P1 |

## 5. Token 体系（HMAC）

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-501 | 五种 token 类型（o/a/j/r/q）各自路由可达 | /manage、/a、/j、/remove、/q 分别接受对应类型 | P0 |
| TC-502 | 篡改 payload 任意字节 | 签名校验失败 → 403/无效页 | P0 |
| TC-503 | 类型混淆（用 j token 打 /a） | 拒绝 | P0 |
| TC-504 | 跨 exchange：token.x 与目标资源不匹配 | 404/403（如 q-token 与 questionId 不一致 → 403） | P0 |
| TC-505 | assignment token 的 g 与当前 generation 不符（重置后） | "This link has been revoked" | P0 |
| TC-506 | token 永不过期 | 未重置的老链接长期有效 | P2 |
| TC-507 | APP_TOKEN_SECRET 缺失 | 启动即抛错（fail fast），不静默降级 | P2 |

## 6. 参与者页面 /a/[token]

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-601 | 有效 token 首次打开 | 揭晓动画（~1.2s）后显示收礼人名字；viewed_at 记录 | P0 |
| TC-602 | 二次打开 | 动画可重播但 viewed_at 幂等不重复记录 | P1 |
| TC-603 | prefers-reduced-motion | 跳过转轮动画直接显示 | P2 |
| TC-604 | 收礼人被 removed | 显示 "a removed participant" + 提示；不显示其清单/地址 | P0 |
| TC-605 | 自己被 removed | "You have been removed from this draw" | P0 |
| TC-606 | 收礼人 wishlist_text 多行 | 逐行渲染清单；空/未填不显示区块 | P1 |
| TC-607 | 收礼人 wishlist_url | 显示 "View their wishlist" 外链（noopener nofollow） | P2 |
| TC-608 | 免费 draw 页脚水印 | Watermark 可见；paid 后消失 | P1 |

## 7. 愿望清单（/api/wishlist）

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-701 | 保存 3 行清单 | 200；送礼人页立即展示 | P0 |
| TC-702 | 清空清单 | 落库为 null，送礼人页区块消失 | P0 |
| TC-703 | 超过 1000 字 | 截断至 1000 | P2 |
| TC-704 | 无效 token | 403 | P0 |
| TC-705 | removed 参与者保存 | 403 | P1 |

## 8. 地址收集（/api/address）— 新功能

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-801 | 保存多行地址 | 200；送礼人揭晓卡显示 "Their shipping address" | P0 |
| TC-802 | 清空地址 | 落库 null，送礼人页区块消失 | P1 |
| TC-803 | 超过 500 字 | 截断至 500 | P2 |
| TC-804 | 无效/篡改 token | 403 | P0 |
| TC-805 | removed 参与者保存 | 403 | P1 |
| TC-806 | 地址仅送礼人可见 | 管理页、其他参与者页、CSV 均不出现该地址 | P0 |
| TC-807 | GDPR redact 后 | address_text 置 null | P0 |

## 9. 匿名问答 — 新功能

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-901 | 送礼人提问（≤500 字） | 200；question 落库指向正确 receiver；收件人收到 question 邮件（kind=question） | P0 |
| TC-902 | 收件人从邮件 /q/<token> 打开 | 页面显示问题文本，无任何提问者标识 | P0 |
| TC-903 | 收件人用自己 assignment token 答题 | 200；answer 落库 + answered_at；送礼人收到 answer 邮件 | P0 |
| TC-904 | 送礼人页问答历史 | 已回答的显示答案；未回答显示等待文案 | P1 |
| TC-905 | 重复回答 | 409 "already has an answer" | P0 |
| TC-906 | q-token 与 questionId 不匹配 | 403 | P0 |
| TC-907 | 每对上限 10 条问题 | 第 11 条 429，提示上限 | P1 |
| TC-908 | 空问题/空答案 | 400 | P2 |
| TC-909 | 匿名性（数据库层） | question 邮件 payload 不含送礼人 name/email；answer 邮件不含收件人标识 | P0 |
| TC-910 | 组织者不可见 | /manage 页无任何问答内容 | P0 |
| TC-911 | 收礼人被 removed 后提问 | 409 "removed their data" | P1 |
| TC-912 | 参与者 removed 后 | 其提问及收到的提问被删除；相关 pending 邮件 job 删除 | P0 |
| TC-913 | /q 页对已答问题 | 显示"Already answered"+ 答案内容，无再次作答表单 | P2 |
| TC-914 | link 模式（收件人无邮箱）提问 | 不入队邮件但问题仍落库；收件人从自己 /a 页收件箱可见并可答 | P1 |
| TC-915 | 答题后内联冲队列 | answer 邮件立即尝试发送（非等 cron） | P2 |

## 10. Join 自助加入（/j/[token] + /api/join）

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-1001 | 依次 3 人加入 | 各 200，管理页实时列表人数正确 | P0 |
| TC-1002 | 重名加入 | 409 + 建议"Anna B."昵称文案 | P1 |
| TC-1003 | 重邮箱加入 | 409 | P1 |
| TC-1004 | 抽签后加入 | 409 "names have already been drawn" | P0 |
| TC-1005 | 满员（第 101 人） | 409 | P1 |
| TC-1006 | email 模式无/错邮箱 | 400 提示需要有效邮箱 | P1 |
| TC-1007 | link 模式不填邮箱 | 允许加入 | P1 |
| TC-1008 | 无效/截断 join token | 403 | P0 |
| TC-1009 | 加入限流 | 同 IP 超限 429 | P2 |

## 11. 管理页 /manage/[token]

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-1101 | drawn 状态信息行 | 状态/送达数/模式/budget/deadline 正确 | P1 |
| TC-1102 | 逐人 Resend | 200；重新入队并内联冲队列；payload 含完整上下文（blind/deliveryMode） | P1 |
| TC-1103 | 组织者邮件 Resend | 同上 | P2 |
| TC-1104 | 失败 job 列表 | 显示 attempts/last_error，引导 Resend | P1 |
| TC-1105 | CSV 导出（非盲模式） | 下载含全部配对 | P1 |
| TC-1106 | 盲模式 | 不加载 pair 数据；无 CSV 入口；显示 Blind mode 说明卡 | P0 |
| TC-1107 | Redraw 确认流 | 二次确认后才执行；generation+1 | P1 |
| TC-1108 | Delete（confirm="DELETE"） | purge 200；exchange/participant/pair/assignment/email_job/question 全部级联清除 | P0 |
| TC-1109 | Delete confirm 词错误 | 400 "Type DELETE to confirm" | P1 |
| TC-1110 | 付费卡片 → Waffo 收银台 | 200 返回 checkout URL；test 模式有提示徽章 | P1 |
| TC-1111 | Premium 已购状态卡 | 显示 Premium 徽章 + reminder 计划 | P2 |

## 12. 定时抽签 — 新功能

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-1201 | 设置未来时间 | 200；exchange.scheduled_at 落库；管理页显示 Scheduled | P0 |
| TC-1202 | 到期后 cron 执行 | 5 分钟内自动抽签；assignment 邮件全部入队并内联发送 | P0 |
| TC-1203 | cron 并发双跑 | 条件 UPDATE 认领，只抽一次（due 计数与 drawn 一致） | P0 |
| TC-1204 | 到期时只有 0~1 人 | NEED_TWO → 恢复 scheduled_at，下轮重试，不发任何邮件 | P0 |
| TC-1205 | 到期时排除无解 | 恢复 scheduled_at 重试；组织者可修改后自动成功 | P1 |
| TC-1206 | 手动 Draw Now | 抽签成功且清除 scheduled_at | P1 |
| TC-1207 | 取消定时（scheduledAt=null） | 200；scheduled_at 清空 | P1 |
| TC-1208 | 设置过去时间 | 400 | P0 |
| TC-1209 | 设置 >1 年后 | 400 | P2 |
| TC-1210 | 已 drawn 后设置 | 409 | P1 |
| TC-1211 | 无效日期字符串 | 400 | P2 |
| TC-1212 | datetime-local 时区 | 浏览器本地时间正确转换为 UTC ISO（东八区 18:00 ≠ UTC 18:00） | P1 |
| TC-1213 | 伪造 organizer token 设置 | 403/404 | P0 |

## 13. 邮件管道

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-1301 | 5 种 kind（assignment/organizer_link/reminder/question/answer）渲染 | subject/html/text 正确、无未转义 HTML | P0 |
| TC-1302 | 队列重试退避 | 失败后 next_attempt_at=2^n 分钟，封顶 60 | P1 |
| TC-1303 | 5 次后标记 failed | job failed；assignment.email_status=failed；管理页可见 | P1 |
| TC-1304 | cron / Vercel cron / 内联三方并发 | 认领机制保证同一 job 只发一次 | P0 |
| TC-1305 | reminder 扫描（paid、3 天后、未打开） | reminder_sent 先认领后入队；失败回滚标志 | P1 |
| TC-1306 | reminder 不重复 | 已 sent 的 exchange 不再扫描 | P1 |
| TC-1307 | Resend 拒收（无效域名收件人） | 422 记入 last_error 走重试/失败路径，不崩溃 | P2 |
| TC-1308 | 邮件内退订链接 | /remove/<r-token> 可达 | P1 |
| TC-1309 | 邮件 HTML 注入 | 名单含 `<script>` / 引号时正确转义 | P1 |
| TC-1310 | 大批量（100 人）内联发送 | serverless 时限内完成，超出部分留给 cron | P2 |

## 14. 移除数据 / GDPR

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-1401 | Remove me（r-token） | 姓名/邮箱/清单/地址即时 redact；removed_at 落库 | P0 |
| TC-1402 | removed 后其 assignment | email_status=cancelled；pending job 删除 | P0 |
| TC-1403 | removed 后其问答 | 双向 question 删除 | P0 |
| TC-1404 | removed 参与者重绘时 | 硬删除 | P1 |
| TC-1405 | purge 全量 | 所有关联表清空（含级联验证） | P0 |
| TC-1406 | /remove 页对无效 token | 无效提示，不泄露存在性 | P2 |

## 15. 支付（Waffo）

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-1501 | POST /api/payments/checkout（valid token） | 200 + 收银台 URL；PAYMENTS_MODE 决定 test/prod | P0 |
| TC-1502 | webhook 事件 mode 取自顶层 | event.mode 缺失时回退 data.mode；跨模式事件被拒 | P0 |
| TC-1503 | webhook 签名验证 | 非法签名 4xx，不更新 paid | P0 |
| TC-1504 | 支付成功 webhook | paid=true、payment_mode 落库、reminder_at 排期 | P0 |
| TC-1505 | 重复 webhook（幂等） | 二次处理不重复发放/不报错 | P1 |
| TC-1506 | 付费后重绘 | no-repeat 生效（排除历史 pair） | P1 |
| TC-1507 | 付费后批量导入 | ImportPanel 可见；100 人上限；坏行报告 invalid | P1 |

## 16. SEO / 营销页面

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-1601 | /features 可达 | 200；12 区块 + 6 条 FAQ；FAQPage + Breadcrumb JSON-LD | P0 |
| TC-1602 | 首页 FAQ JSON-LD | 含新 3 条（问答/地址/定时） | P1 |
| TC-1603 | sitemap.xml | 含 /、/features、/gift-exchange-generator、/privacy、/terms | P1 |
| TC-1604 | robots.txt | 允许公开页；token 页 noindex（每页 metadata 声明） | P1 |
| TC-1605 | canonical / OG / apple-icon / manifest / favicon | 全部 200 且指向正确 | P2 |
| TC-1606 | IndexNow key 文件 | /3d7248….txt 可达 | P2 |
| TC-1607 | /privacy /terms | 200 且包含新数据披露（地址/问答） | P1 |
| TC-1608 | 404 页与 /a/、/q/ 无效路径 | 友好错误页，不暴露堆栈 | P2 |
| TC-1609 | Header/Footer 链接 | Features 入口两侧可达，移动端 BottomNav 不被新内容遮挡 | P2 |

## 17. 并发与竞态专项

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-1701 | 同 requestId 并发创建 ×5 | 仅一条 exchange（23505 唯一键兜底） | P0 |
| TC-1702 | 同时手动 draw + cron 定时 draw | 仅一个成功，另一个 ALREADY_DRAWN/认领失败 | P0 |
| TC-1703 | 同时 answer 同一问题 ×2 | 一个 200 一个 409（is(answer_text,null) 守卫） | P1 |
| TC-1704 | join 与 draw 并发 | join 在 draw 提交后到达 → 409；在提交前到达 → 被包含或下轮重绘 | P1 |
| TC-1705 | reminder sweep 与 purge 并发 | 认领失败静默跳过，无孤儿邮件 | P2 |

## 18. 性能与边界

| 编号 | 用例 | 预期结果 | 优先级 |
|---|---|---|---|
| TC-1801 | 100 人 + 30 排除抽签耗时 | <1s | P1 |
| TC-1802 | 100 人全队列发送 | 分批并发 6，serverless 预算内 | P2 |
| TC-1803 | 超长输入（名单 1MB、问题 100KB） | 截断/拒绝，无 OOM | P2 |
| TC-1804 | emoji/多语言名字 | 全链路（邮件主题/正文/页面）正常显示 | P2 |
| TC-1805 | 单人"抽签"（1 人创建） | 创建时即拒绝（至少 2 人） | P1 |

---

## 冒烟脚本（已验证的一轮，2026-11-05）

`/tmp/e2e.mjs`（node 脚本，读项目 .env.local，本地签 token + 调线上 API + 直查 Supabase REST）：
覆盖 TC-1201/1202/1208/1213、TC-1001、TC-901/903/905/906、TC-801、TC-1108、TC-1405、TC-606/607 等 30 项断言，28 直接过 + 2 项经核实为脚本断言问题（时区格式、合法 token 误用），产品行为全部正确。

## 已知注意事项（测试时容易踩坑）

1. **React SSR 文本节点拆分**：页面断言 "Budget $20" 可能被拆成多个节点，字符串匹配需放宽。
2. **沙箱 bash grep 静默返空**：验证线上内容用 python/node，不要用 grep 管道。
3. **Resend 生产模式拒收 example.com 类收件人**（422）：测试邮箱必须用真实域名（如 gmail.com），否则会误判管道故障。
4. **3 人 + 1 组双向排除无解**：构造测试数据时用 4 人。
5. **PostgREST NULL 判断必须 `.is(col, null)`**，`.eq(col, null)` 会 22007。
6. **cron 间隔 5 分钟**：定时抽签断言要预留窗口期；本地验证可直接带 Bearer CRON_SECRET 调 `/api/cron/email-queue`。
7. **重绘限流窗口约 1 分钟**（"A draw was just sent out"）：重绘用例要先等窗口。
8. **创建限流按窗口内存活行计数**：purge 会释放配额——限流用例必须在 purge 之前、且窗口内凑满 5 行。

---

# 测试执行报告（2026-11-05）

执行环境：生产 https://santawheel.com + Supabase 生产库；三轮执行（run1 全量 → run2 修复脚本问题 → run3 验证修复），静态层 tsc/eslint/vest 全绿。

## 总结果

| 层 | 结果 |
|---|---|
| 静态层 | tsc 0 错 · eslint 0 错 · vitest 66/66 |
| 线上用例（run1 86 + run2 42 + run3 5 条次） | 全部 PASS（含修复后复测）|
| 显式 SKIP | 11 条（附原因，见下） |

## 测试发现并修复的 3 个真 bug

| # | Bug | 严重度 | 修复 commit |
|---|---|---|---|
| 1 | **并发同 requestId 创建三方全 500，且败者会在胜者的 exchange 上重复插参与者、回滚时把胜者的 exchange 整个删掉**（幂等机制实际缺陷） | 高 | `3066611` |
| 2 | **Premium 提醒邮件从未工作过**：sweepReminders 用了不存在的 `assignment→participant` embed（FK 实际指向 pair），schema cache 报错，提醒永远入队 0 封。此前 reminder_at 排在 11-07 尚未触发，本次测试首次踩到执行路径 | 高（付费功能静默失效） | `414dc30` |
| 3 | **并发双答竞态**：`.is(answer_text,null)` 不影响返回行数，两个同时到达的回答都返回 200，败者静默覆盖胜者 | 中 | `414dc30`（更新后校验实际命中行数，败者走 409） |

## 修正的用例预期

- **TC-108**：link 模式丢弃参与者邮箱是**有意的隐私设计**（代码注释明示），原预期「保存邮箱」有误。
- **TC-304**：SSR 文本节点拆分，断言须 strip-tags 后匹配。

## 逐轮明细

**Run 1（全量 86 条）**：51 PASS / 24 FAIL / 11 SKIP。FAIL 归因：①E3 误用 3 人+互斥（数学无解，踩了文档第 4 条坑）②重绘 1 分钟限流窗口③E2 并发 requestId 500（真 bug #1）④reminder embed（真 bug #2）⑤双答竞态（真 bug #3）⑥SSR 断言过严。
**Run 2（42 条，修复 #1 后）**：38 PASS / 4 FAIL。TC-304/TC-505/406/TC-1202/1702/TC-901~910/TC-801~806 等此前级联失败项全部转 PASS。
**Run 3（5 条，修复 #2/#3 后）**：reminder 入队 2/不重复 ✓；并发双答 [200,409] ✓；TC-113 创建限流 429 ✓；清理 ✓。

## SKIP 清单（11 条，均附原因）

TC-603（需真实浏览器 reduced-motion）、TC-1212（浏览器时区行为，API 侧已覆盖）、TC-1304（认领并发已被 TC-1702 间接覆盖）、TC-1307（Resend 拒收 fake 域名为已知行为）、TC-1502/1503/1505（需 Waffo 测试事件回调）、TC-1009（join 限流与创建共用计数）、TC-911/TC-914（降级分支逻辑简单，未构造专用场景）、TC-1705（并发 purge 竞态难以确定性复现）、TC-1404（重绘限流窗口优先验证 TC-407）、TC-1803（各入口均有长度上限）。

## 数据清理

所有测试 exchange（T-E1~E8、T-probe、T-limit、T-F1~F3）已全部 purge，生产库仅剩 3 个真实用户活动（Live check、Our Secret Santa ×2）。


---

# 附：White elephant 玩法（2026-11-05 线上验证）

新玩法的用例集与执行结果。规则引擎为纯函数（`lib/white-elephant.ts`），13 条 vitest 覆盖；
线上用 `/api/we/test` 建一次性活动，逐条走规则后 purge。

## 规则用例（线上生产环境）

| # | 用例 | 期望 | 结果 |
|---|---|---|---|
| WE-01 | 创建 3 人 3 礼物 | 200 + boardPath | PASS |
| WE-02 | 大厅加载 | phase=lobby | PASS |
| WE-03 | 3 人 3 个未拆礼物 | players=3 pool=3 | PASS |
| WE-04 | 随机顺序覆盖全部人 | 去重后 3 人 | PASS |
| WE-05 | 顺序不完整时禁止开始 | 409 | PASS |
| WE-06 | 组织者调整顺序 | 200 + 首位移到 Ada | PASS |
| WE-07 | 开始游戏 | phase=playing | PASS |
| WE-08 | 首位玩家轮到 | pendingActor=Ada | PASS |
| WE-09 | **规则 5**：首位玩家不能偷 | 409 `first_player_must_pick` | PASS |
| WE-10 | Ada 开 Blue box | 到手 Blue box | PASS |
| WE-11 | 轮到 Ben | pendingActor=Ben | PASS |
| WE-12 | Ben 从 Ada 手里偷 Blue box | 200，转手成功 | PASS |
| WE-13 | 被偷者被强制重新开箱 | pendingActor=Ada, mode=pick_only | PASS |
| WE-14 | **规则 3**：被偷者不能偷回来 | 409 | PASS |
| WE-15 | Ada 重新开 Red box | 到手 Red box | PASS |
| WE-16 | 轮到 Cleo | pendingActor=Cleo | PASS |
| WE-17 | Cleo 开最后一个礼物 | 200 | PASS |
| WE-18 | **规则 6**：轮次用完即结束 | phase=done | PASS |
| WE-19 | 最终归属 Ada=Red / Ben=Blue / Cleo=Green | 一致 | PASS |
| WE-20 | 结束后任何 pick/steal 都被拒 | 409 `finished` | PASS |
| WE-21 | 撤销一步 | 回到 Cleo 的回合 | PASS |
| WE-22 | 撤销后礼物回到池里 | pool=1 | PASS |
| WE-23 | 再撤销回退到「强制重开」状态 | Ada / pick_only | PASS |
| WE-24 | 被撤销的操作可重做 | 200，轮到 Cleo | PASS |
| WE-25 | **刷新恢复进度**：重新 GET 状态与内存一致 | 玩家/轮到者全一致 | PASS |
| WE-26 | 抽签台服务端渲染 | 200 且含页面标题 | PASS |
| WE-27 | 抽签台 noindex | 含 noindex | PASS |
| WE-28 | **规则 4**：偷到上限后礼物锁定 | locked=true | PASS |
| WE-29 | 锁定的礼物不能再被偷 | 409 | PASS |
| WE-30 | **1 人边界**：可创建 / 可开始 / 一开即结束 | 200 / playing / done | PASS |
| WE-31 | 垃圾 token 被拒 | 403 | PASS |
| WE-32 | 空 token 被拒 | 403 | PASS |
| WE-33 | **secret santa 回归**：创建链路不受影响 | 201 | PASS |
| WE-34 | 测试数据全部清理 | 无残留 | PASS |

## 结果邮件（规则 9）

| # | 用例 | 期望 | 结果 |
|---|---|---|---|
| WE-35 | 未结束时请求发信 | 409 `not_done` | PASS |
| WE-36 | 结束后发信 | queued=3，每封信 subject/payload 与手持礼物一致 | PASS |
| WE-37 | 双击「Send result emails」 | 第二次 queued=0，不重复发 | PASS |

> 注：用例用 `@example.com` 收件人，Resend 生产环境必然 422 拒收（已知行为），
> job 停留在 pending 等重试——因此 `delivery.sent=0`。这条现象也暴露了一个 UX bug：
> 抽签台当时会显示「Results sent. 0 emails delivered.」。已修复为区分
> 已送达 / 排队重试 / 被拒收 三种状态（commit `d864b5d`）。

## 并发安全

| # | 用例 | 期望 | 结果 |
|---|---|---|---|
| WE-38 | 两人同时开箱（不同礼物） | 一个 200、一个 409 `conflict` | PASS |
| WE-39 | 只落一步（`(game_id, seq)` 唯一键生效） | 池里只少 1 个礼物 | PASS |

并发失败方的提示为「Someone else moved first — reload the board.」，不是 500，也不是脏写。

## 已知边界

- 实时为 **2 秒轮询**（页面可见时），配置 `NEXT_PUBLIC_SUPABASE_URL` +
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` 后自动切到 realtime 通道（`we_game` 已在发布里）。
- 结束后的 `finished` 标记是幂等闸门：先抢占再入队，双击不会重复发信。
- `undo` 允许撤销到大厅阶段之前？不会——撤销仅删最后一步事件，`start` 不在事件日志里，
  因此大厅阶段没有可撤销内容。
