# 同刻 · 世界时间与时区换算

一个可以本地运行的中文世界时钟。修改任意城市的日期和时间，所有卡片同步换算，显示 UTC 偏移、相对时差和跨日提示。

[在线使用](https://tongke-timezones.pages.dev/) · [GitHub 仓库](https://github.com/lainbo/timezones)

## 本地运行

需要 Node.js 22.12+ 或 24+、pnpm 12。

```sh
pnpm install
pnpm dev
```

打开 <http://localhost:5173>。开发服务仅监听本机。

```sh
pnpm check         # Oxlint、Oxfmt 格式检查、TypeScript 和生产构建
pnpm format        # 使用 Oxfmt 格式化
pnpm preview       # 预览 dist 中的生产构建
```

## 使用

- 点击卡片的大号时间，输入该城市的当地日期和 24 小时制时间。
- 拖动卡片下方的时间刻度，以 5 分钟为步进调整，所有城市同步更新；正在编辑的城市成为换算基准。需要精确到分钟时，点击卡片的大号时间输入。
- 顶部可以切换基准城市、前后日期、12/24 小时显示，并回到实时模式。
- 界面以黑白灰为主调。夜晚卡片采用炭黑底和浅色文字，配合月亮与“夜晚”标签；白天显示太阳与“白天”标签，深色模式下太阳图标使用浅金黄色。时间刻度以浅灰表示白天、深灰表示夜晚，按当地时间 06:00–18:59 / 19:00–05:59 划分。
- 右上角的日月按钮切换深浅主题，太阳表示浅色、月亮表示深色。首次访问跟随系统，手动切换后保存在本地，下次访问继续使用。切换使用原生 View Transitions API，从按钮位置展开圆形过渡；开启系统“减少动态效果”时直接切换。
- “添加时区”打开多选弹窗，宽屏使用紧凑的双列列表，窄屏使用单列。支持中文城市/地区名、IANA 标识符、英文城市名，以及 `+8`、`-7`、`UTC+08:00`、`+5:30`、`+5.75` 等偏移搜索。
- 弹窗将打开前已添加的时区置顶，其余按当前查看日期的 UTC 偏移从小到大排列。选中行背景较深，未选中行悬停时背景较浅，已选中行悬停时保持原色。点击“完成”应用，取消或关闭保留原来的选择。
- 仅卡片右上角的六点手柄可拖拽排序。键盘用户聚焦手柄后按空格、方向键、空格，也可以按 Escape 取消。
- 时区选择、卡片顺序、基准城市与时间显示格式保存在当前浏览器。刷新后显示实时时间。

## 时间处理

以 `Temporal.Instant` 作为唯一共享时间点，使用 `Temporal.ZonedDateTime` 转换城市时间，使用 `Temporal.PlainDateTime` 解释用户输入。

使用浏览器原生 `Temporal`。启动时检测 API 是否存在，不支持时显示浏览器升级提示并停止加载应用。TypeScript 使用内置的 `ESNext.Temporal` 类型声明。时区规则来自浏览器的 IANA 时区数据库，UTC 偏移随所选日期变化。

对夏令时跳过的当地时间，弹窗提示该时间不存在；对重复出现的时间，提供两次发生时刻及其 UTC 偏移供选择。时间刻度按当地当天的实际时长生成，支持 23 和 25 小时的日期。

时区列表由 `Intl.supportedValuesOf('timeZone')` 枚举，另补充 UTC 与 UTC−12 至 UTC+14 的整小时固定偏移。当前开发环境共 445 个可选项，数量取决于浏览器时区数据库。中文名称与别名使用 Unicode CLDR 48.2 数据生成，覆盖当前环境的全部地区时区。

更新中文数据：

```sh
pnpm data:timezones
pnpm format
```

生成器只在开发时读取 CLDR 包，浏览器仅加载提取后的名称与地区数据。Unicode 许可见 [public/UNICODE-LICENSE.txt](public/UNICODE-LICENSE.txt)。

## 技术栈

React 19、TypeScript、Vite 8（Rolldown）、shadcn/ui（Radix）、Tailwind CSS 4、framer-motion、dnd-kit、Oxlint 和 Oxfmt。页面进入、表针和返回当前时间的刻度动画使用 framer-motion，并遵循系统的减少动态效果设置。依赖版本与 pnpm 锁文件保存在仓库中。

## Cloudflare Pages 部署

项目通过 Cloudflare Pages 的 Git 集成连接 `lainbo/timezones`，推送到 `main` 后自动构建并发布到 <https://tongke-timezones.pages.dev/>。

| 配置         | 值                                      |
| ------------ | --------------------------------------- |
| Pages 项目   | `tongke-timezones`                      |
| 生产分支     | `main`                                  |
| 根目录       | 仓库根目录                              |
| 构建命令     | `pnpm build`                            |
| 构建输出目录 | `dist`                                  |
| Node.js      | `.node-version` 中的 `24.20.0`          |
| 构建环境变量 | `PNPM_VERSION=12.5.1`（生产和预览环境） |

部署设置在 Cloudflare Pages 控制台维护。升级 Node.js 或 pnpm 时，同步更新版本文件、`packageManager`、锁文件和相关构建环境变量。构建环境变量说明见 [Cloudflare 构建镜像文档](https://developers.cloudflare.com/pages/configuration/build-image/)。

## 文档与参考

- [参考网站 timezones.digital](https://www.timezones.digital/)
- [MDN Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)
- [Temporal 的歧义与夏令时处理](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime/from)
- [Intl.supportedValuesOf](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf)
- [Unicode CLDR JSON](https://github.com/unicode-org/cldr-json)
- [Oxc 工具链](https://oxc.rs/)

## 许可证

项目代码使用 [MIT 许可证](LICENSE)。中文时区数据遵循 [Unicode 许可证](public/UNICODE-LICENSE.txt)。
