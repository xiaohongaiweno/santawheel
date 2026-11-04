# SantaWheel 上线检查清单

生成时间：2026-11-04 · 本地生产构建（`next build && next start`）实测

## 一、SEO 基础

| # | 检查项 | 验证方法 | 当前结果 |
|---|--------|----------|----------|
| 1 | sitemap.xml 只含首页 + /gift-exchange-generator | `curl https://santawheel.com/sitemap.xml` | ✅ 2 个 URL（/ priority 1，/gift-exchange-generator 0.8） |
| 2 | robots.txt 允许全站抓取并指向 sitemap | `curl https://santawheel.com/robots.txt` | ✅ `User-Agent: * / Allow: /` + `Sitemap: https://santawheel.com/sitemap.xml` |
| 3 | 首页 canonical 绝对地址 | 查看源码 `rel="canonical"` | ✅ `https://santawheel.com` |
| 4 | gift 页 canonical 绝对地址 | 同上 | ✅ `https://santawheel.com/gift-exchange-generator` |
| 5 | 动态页（/a、/manage）不输出错误 canonical | 打开任意 token 页查源码 | ✅ 无 canonical 输出（已移除 layout 全局默认，避免指向首页的矛盾信号） |
| 6 | 无重复 title | `curl -s <page> \| grep '<title>'` | ✅ 首页 `Secret Santa Generator – Free & No Sign-up`；gift 页 `Gift Exchange Generator – Free Random Pairing`；全站无重复 |
| 7 | 无空 h1、每页唯一 | `curl -s <page> \| grep '<h1'` | ✅ 两页各一个非空 h1，与 title 词一致 |
| 8 | 无 noindex 残留（可收录页） | 查 `name="robots"` meta | ✅ 两公开页均 `index, follow`；/a、/manage 为刻意 `noindex, nofollow`（私密 token 页，符合预期） |
| 9 | 面包屑结构化数据 | 查页面 JSON-LD | ✅ 两页均输出 `BreadcrumbList`（gift 页为 Home → Gift Exchange Generator 两级） |
| 10 | FAQPage + WebApplication 结构化数据 | Rich Results Test（search.google.com/test/rich-results）输入线上 URL | ✅ 代码已注入（FAQPage 6 问 + WebApplication + BreadcrumbList）；上线后用工具跑一次线上 URL 确认 |
| 11 | lang / favicon / OG 图 | 查源码 | ✅ `lang="en-US"`、`/icon.svg` favicon、`/opengraph-image` 自动 1200×630 OG/Twitter 图 |
| 12 | 关键词隔离 | gift 页可见正文 `grep -i "secret santa"` = 0；首页 `<main>` 内 `grep "gift-exchange-generator"` = 0 | ✅ 已程序化验证 |

## 二、性能（Lighthouse 移动端，Chrome for Testing 156，本地生产构建）

| # | 检查项 | 验证方法 | 改进前 | 改进后 |
|---|--------|----------|--------|--------|
| 13 | 首页 Performance | `npx lighthouse <url> --only-categories=performance` | 100（LCP 0.8s / CLS 0 / TBT 10ms） | **100**（LCP 0.8s / CLS 0 / TBT 0ms） |
| 14 | gift 页 Performance | 同上 | 100 | **100** |
| 15 | LCP < 2.5s（LCP 元素 = 输入框） | Lighthouse 报告 largest-contentful-paint | 0.8s ✅ | 0.8s ✅（本地无网络延迟，线上 Vercel 边缘缓存后仍远低于阈值；部署后用 PageSpeed Insights 复测线上 URL） |
| 16 | CLS ≈ 0 | cumulative-layout-shift | 0 ✅ | 0 ✅ |
| 17 | gift 页 SEO 扣分项 | Lighthouse seo 分类 | 92（BottomNav "More" 链接无描述文本） | **100**（改为描述性锚文本 "Secret Santa"） |
| 18 | Accessibility / Best-Practices | Lighthouse | 100 / 100 | 100 / 100 |

> 本机跑分命令：`npx lighthouse http://localhost:3100/ --chrome-flags="--headless=new --proxy-server=direct://" --output=json`（本机代理会拦截 localhost，需 `--proxy-server=direct://`）。

## 三、功能与数据

| # | 检查项 | 验证方法 | 当前结果 |
|---|--------|----------|----------|
| 19 | 抽签算法单测 | `npm test` | ✅ 16 个用例全过（10 人/夫妻排除/2 人无解/3 人全排除/100 人 <2s/双向排除/token 签名安全/CSV 导入解析） |
| 20 | 类型检查 | `npx tsc --noEmit` | ✅ 零错误 |
| 21 | 生产构建 | `npm run build` | ✅ 通过；两 SEO 页静态预渲染（○），token 页/API 动态（ƒ） |
| 22 | 首屏 320px 可用 | 缩窄窗口：输入框与 Generate 按钮全宽可点 | ✅ 移动端优先 + 底部导航 safe-area 适配 |
| 23 | 免费水印 / 付费去水印 | 创建 exchange → 查 /a 页底部；webhook 标记 paid 后复查 | ✅ 逻辑就绪；待真实支付走通后复验 |
| 24 | 邮件 + 队列 | `npm run dev` 后 POST /api/exchanges 用测试邮箱 | ⏳ 代码就绪，需配置 Resend 后 e2e 验证 |

## 四、上线时人工步骤（部署后逐项打勾）

| # | 步骤 | 说明 |
|---|------|------|
| 25 | Supabase 执行 3 个迁移 | `supabase/migrations/20261104000000_init_draw.sql`、`20261104010000_delivery.sql`、`20261104020000_premium.sql` |
| 26 | Vercel 环境变量 | `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`RESEND_API_KEY`、`EMAIL_FROM`、`APP_TOKEN_SECRET`、`CRON_SECRET`、`PAYMENTS_MODE`（先 test）、`WAFFO_MERCHANT_ID_TEST`、`WAFFO_PRIVATE_KEY_TEST`、`WAFFO_PRODUCT_ID_TEST`、`NEXT_PUBLIC_SITE_URL=https://santawheel.com` |
| 27 | 绑定域名 | Vercel Settings → Domains 添加 `santawheel.com` + `www`，DNS 按提示配置，HTTPS 自动签发 |
| 27b | 外部邮件队列 cron（Hobby 版 Vercel cron 仅限每日一次） | [cron-job.org](https://cron-job.org) 免费注册 → Create cronjob：URL `https://santawheel.com/api/cron/email-queue`，每 5 分钟，Headers 加 `Authorization: Bearer <CRON_SECRET>`。Vercel 自带 cron 保留为每日兜底（08:00 UTC） |
| 28 | Resend 验证发件域 | santawheel.com 加 DNS 记录（SPF/DKIM），发件人 `draw@santawheel.com` |
| 29 | Waffo 后台 | 建 $4.99 一次性产品、注册 webhook `https://santawheel.com/api/payments/waffo/webhook`（Raw 格式） |
| 30 | 上线后复测 | PageSpeed Insights 跑线上 URL（含真实网络延迟）；Rich Results Test 验证三类结构化数据；Google Search Console 提交 sitemap.xml |
| 31 | 测试支付走通后 | `PAYMENTS_MODE=prod` + 换正式 Waffo 凭据再发布 |
