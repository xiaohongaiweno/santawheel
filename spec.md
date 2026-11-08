# Spec：santawheel.com GSC 收录落地（2026-11-07）

## 1. 已核实的事实（本次实测，非推测）

| 项 | 结果 | 证据 |
| --- | --- | --- |
| GSC 验证方式 | DNS TXT（Domain 属性 `sc-domain:santawheel.com`） | `dig TXT santawheel.com` → `google-site-verification=SF8jQ4LS82-EgEMrHS4AiJ7PrC6Atq7PcQrS1xxpjrU` |
| GSC 属性可访问 | 是，已登录（dengxiaohongaikimi@gmail.com），左侧资源为 santawheel.com | 浏览器实测 |
| 站点地图 | 已提交，状态「成功」，11 个网址，最后读取 2026-11-07 | GSC 站点地图页 |
| 网页索引报告 | 「正在处理数据，请过 1 天左右再来查看」 | GSC 编制索引 → 网页 |
| 搜索表现 | 2026/11/3–11/4 有 1 次网页搜索点击 | GSC 概述「效果」卡片 |
| 线上验证 meta | 不存在（无需存在，因为是 DNS 验证） | `curl https://santawheel.com/` 未发现 `google-site-verification` |
| 分析埋点 | 无（无 gtag/GA/Plausible/Vercel Analytics） | 同上 |
| sitemap.xml | 200，11 个 `<loc>` | curl |
| 首页 TTFB | 1.21s（冷启动；此前实测 0.39s） | curl |

## 2. 结论

- GSC 验证与 sitemap 提交**已经完成**，不需要改代码、不需要再提交 sitemap。
- 当前唯一缺口是「数据还没跑出来」+「尚未主动请求编入索引」+「没有分析工具做归因」。
- 因此本 spec 只做三件事：请求收录、补埋点、Bing 导入。**不做**转盘页、长尾页、外链扩量（用户此前明确排除）。

## 3. 需求

### R1 主动请求编入索引（人工，GSC UI）
- 对 `/` 以及 3 个最有价值的 URL 逐个执行「网址检查 → 请求编入索引」。
- 验收：每个 URL 出现「已请求编入索引」提示，当日最多可请求若干条。

### R2 补分析埋点（代码）
- 在 `app/layout.tsx` 安装 Vercel Analytics：`@vercel/analytics` 的 `<Analytics />`，零配置、不依赖 Cookie 弹窗、免费额度足够。
- 目的：让 11/10 Product Hunt 发布带来的访问可被归因，否则本季无法判断动作是否有效。
- 验收：部署后首页 HTML/JS 出现 `/_vercel/insights` 请求；Vercel 面板出现数据。

### R3 Bing 导入（人工，BWT UI）
- 在 Bing Webmaster Tools 用「从 GSC 导入」一键搬入，避免重复验证。
- 验收：BWT 显示站点已验证、sitemap 已读取。

### R4 观测窗口
- 7 天后复查：GSC「网页」已编入索引数量、BWT 索引数、Vercel Analytics 访问数。
- 判定标准：7 天内首页进入「已编入索引」即视为通过；若仍「已发现但未编入索引」，再排查内容质量/抓取预算。

## 4. 约束

- DNS 验证已生效，禁止为「验证」再改代码。
- 不购买任何加急/付费收录（用户已明确拒绝 $9）。
- 不新增页面、不改现有一期内容架构。
- 代码改动仅限 `app/layout.tsx` + `package.json` 依赖。

## 5. 涉及文件

- `app/layout.tsx`（新增 Analytics 组件挂载）
- `package.json`（新增 `@vercel/analytics`）
- 无其他文件改动
