# Tasks：santawheel.com GSC 收录落地

状态说明：`[ ]` 未开始 / `[x]` 已完成

## 已完成（无需再做）

- [x] 确认 GSC 验证方式：DNS TXT，Domain 属性已生效
- [x] 确认 sitemap.xml 已提交，状态「成功」，11 个网址，最后读取 2026-11-07
- [x] 确认线上 sitemap.xml 返回 200 且含 11 个 `<loc>`
- [x] IndexNow 提交 11 个 URL（2026-11-07，返回 200）
- [x] Product Hunt 排期 2026-11-10 12:01am PT

## T1 请求编入索引（人工，需本人操作 GSC UI）

- [ ] 打开 GSC「网址检查」，输入 `https://santawheel.com/`，点「请求编入索引」
- [ ] 对 `/white-elephant`、`/secret-santa-generator`、`/gift-exchange-ideas`（按真实路由核对）重复上述操作
- 验收：每条出现「已请求编入索引」提示
- 说明：GSC 有每日配额，超配额时次日再补

## T2 安装 Vercel Analytics（代码）

- [ ] `npm i @vercel/analytics`
- [ ] `app/layout.tsx` 引入 `import { Analytics } from '@vercel/analytics/next'`
- [ ] 在 `<body>` 内挂载 `<Analytics />`
- [ ] `npm run build` 通过
- [ ] 部署到 Vercel
- 验收：页面产生 `/_vercel/insights` 请求；Vercel 项目 Analytics 面板有数据

## T3 Bing Webmaster Tools 导入（人工）

- [ ] 打开 `https://www.bing.com/webmasters`，登录
- [ ] 选择「从 Google Search Console 导入」
- [ ] 确认站点与 sitemap 均已读取
- 验收：BWT 站点列表出现 santawheel.com 且状态为已验证

## T4 7 天后复查

- [ ] GSC「编制索引 → 网页」：记录「已编入索引」数量
- [ ] GSC「效果」：记录点击/展示
- [ ] BWT：记录已编入索引数量
- [ ] Vercel Analytics：记录访问数（尤其 11/10 PH 发布当天）
- 判定：首页若仍为「已发现，尚未编入索引」，进入内容质量/抓取排查分支
