# dsh-best-ponytail

![banner](assets/banner.svg)

把 [ponytail](https://github.com/DietrichGebert/ponytail)（MIT）装进 DeepSeek Harness：让 AI agent 像屋里最懒的资深工程师那样写代码——**最好的代码是你永远不用写的那行**。

[**English**](README.en.md) · [Releases](https://github.com/hoyyang/dsh-best-ponytail/releases) · [更新日志](CHANGELOG.md)

<p align="center">
  <img src="https://img.shields.io/badge/dsh-0.1.5%2B%20实测-2563eb" alt="dsh">
  <img src="https://img.shields.io/github/v/release/hoyyang/dsh-best-ponytail" alt="release">
  <img src="https://img.shields.io/github/stars/hoyyang/dsh-best-ponytail" alt="stars">
  <img src="https://img.shields.io/github/last-commit/hoyyang/dsh-best-ponytail" alt="last commit">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
</p>

## 安装

```sh
dsh plugin add hoyyang/dsh-best-ponytail
```

零配置开箱即用：装上后默认零行为改变（常驻注入缺省关闭，6 个技能即刻可用）。实测最低 dsh 版本 0.1.5。npm 包名 dsh-best-ponytail（原名 dsh-ponytail 被第三方占用故改名）+ GitHub 双渠道分发。

## 有啥用

### 六个技能（被动触发 + 显式点名）

- **ponytail 主规则**——写代码前先过 7 级懒人阶梯：要做吗 → 库里有吗 → 标准库 → 平台原生 → 已装依赖 → 一行 → 最小可用实现
- **ponytail-review**——只审过度工程的专项 review：标库重复造的轮子、多余依赖、投机抽象、死灵活性，每条一行「在哪、删什么、换什么」
- **ponytail-audit**——全仓 bloat 审计：按优先级排出整个代码库里该删、该简化、该换标库的清单，只报告不动手
- **ponytail-debt**——收割代码里所有 `ponytail:` 标记注释，汇总成欠账台账，让「以后再说」不变成「永不」
- **ponytail-gain**——上游基准计分板：更少代码、更低成本、更快速度的中位数成绩单
- **ponytail-help**——全模式速查卡：技能、命令、档位一览

### 一个命令，随时调档

- **/ponytail 调档**——lite / full / ultra / off 会话级切换，下一轮生效
- **/ponytail status**——查看当前档位、来源（config 默认还是会话覆盖）
- **/ponytail reset**——清掉会话覆盖，回到配置默认

### 可选常驻注入（上游 hook 的 DSH 等价物）

- **systemPrompt 区块注入**——把懒人阶梯焊进每轮系统提示词，写代码 100% 在规则之下，小改动也不漏
- **config 四档**——off / lite / full / ultra，full 为上游基准实测档
- **会话级覆盖**——`/ponytail off` 单会话临时关，重启回配置默认

### 打包特性

- **上游内容零改动**——skills、hooks、benchmarks、docs 等 193 个文件原样 vendored 于 upstream/ 目录，可溯源（钉在 commit e3ba2aa）
- **零工具注册**——不进 tools schema，不占上下文预算，卸载零残留
- **MIT + 归属声明**——上游 © DietrichGebert，适配层同 MIT

## 30 秒上手

1. 执行 `dsh plugin add hoyyang/dsh-best-ponytail`
2. 什么也不用配——6 个技能已进技能目录，编码任务自动可用
3. 想验证：对 agent 说「ponytail，帮我写个 XX」，回复结尾应出现 `skipped: X, add when Y`
4. 想看档位：输入框敲 `/ponytail status`
5. 想要常驻：profile 配置里把 `mode` 改成 `full`（见下方配置示例）
6. 想审过度设计：说「audit this codebase」
7. 想查技术债：说「ponytail debt」
8. 单会话免打扰：`/ponytail off`
9. 回到默认：`/ponytail reset`
10. 卸载：`dsh plugin remove dsh-best-ponytail`，进程外零残留

## 使用场景

- **快速原型**——一句「做个 XX」不再带回 5 个依赖 3 层抽象，标库和原生特性能解决的不装包
- **老项目重构**——review 模式专挑能删的：重复实现的标库函数、没人用的配置项、为「以后」准备的脚手架
- **代码审查补刀**——正确性 review 之外，专职猎杀复杂度，每条发现一行说完
- **技术债盘点**——周期性跑 debt 台账，把「以后再说」变成看得见的清单
- **多 agent 一致性**——团队每人 DSH 装同款规则集，产出风格统一，审查省心
- **成本与速度优化**——少写代码，token 消耗更少、交付更快；上游实测成本 -20%、耗时 -27%
- **学习写作范式**——看 agent 如何先问「要不要存在」再动手，反向训练自己的取舍
- **大仓瘦身**——audit 排名清单直接当重构 backlog 用
- **依赖治理**——阶梯第 5 级强制先查已装依赖，遏制「为一个函数装一个库」
- **升级/换模型回归**——规则集与模型解耦，换模型不换规矩

## 输入与输出

| 你说 / 你敲 | 得到 |
|---|---|
| `/ponytail status` | 当前档位 + 来源 + 切换提示 |
| `/ponytail ultra` | 本会话切 YAGNI 极端档，下一轮生效 |
| 「ponytail，加个缓存」 | 先过阶梯的最小实现 + `skipped` 一行说明 |
| 「review for over-engineering」 | 每条一行的删除清单：位置 / 删什么 / 换什么 |
| 「audit this codebase」 | 全仓 bloat 排名清单，只报告不改码 |
| 「ponytail debt」 | 全库 `ponytail:` 注释汇总台账 |
| 「ponytail gain」 | 上游基准计分板（-54% 代码 / -20% 成本 / -27% 耗时） |
| 「stop ponytail」 | 本会话回到自然风格 |

## 进阶用法（配置）

常驻注入档位在 profile 配置里调（缺省 off）：

```yaml
- id: dsh-best-ponytail
  config:
    mode: full   # off | lite | full | ultra
```

## 工作原理

bundle 插件三层映射上游概念：`skills/` 经 `ctx.skills` provider 注册为 DSH 技能（description 匹配被动触发）；上游 SessionStart hook 的「每轮注入规则集」改由 `ctx.systemPrompt` 区块实现，`config.mode` 控制开关、会话内 `/ponytail` 可覆盖（内存态，零残留）；上游 `commands/ponytail.toml` 的调档语义映射为 host 命令 `/ponytail`。其余上游文件原样 vendored 仅供溯源。

## 可靠性与验收

- **冒烟测试**：mock ctx 跑真实 `apply()`——6 技能注册、阶梯正文可达、档位状态机、未知档位报用法，全部断言通过（`npm test`）
- **冷启动检测**：boot-check 六类静态检测（junction / bundle manifest / disabled 矛盾 / 运行时导入 / client 注册一致性 / insert id 重复）全绿
- **生命周期**：注入→卸载→再注入两轮实测，技能目录实时出现/消失，junction 删除，残留检查 PASS
- **fail loud**：技能树缺失、规则文件不可读、非法 config 直接抛错点名对象，无静默回退
- **安全边界**：不碰凭据、零新工具、依赖仅 schemastery（^3.18.0 锁范围）、无安装脚本
- **内容保真**：上游 193 文件逐字节未改，commit 钉死可审计
- **兼容性**：实测 dsh 0.1.5 web profile；headless profile 缺 services 时降级并告警
- **升级安全**：profile 配置改动先备份（.bak-时间戳）再落盘，可一键还原
- **归属清晰**：上游 MIT 独立声明，适配层代码仅 lib/index.js 一个文件
- **已知限制**：收益集中在 agent 过度建设场景，代码本已精简时收益趋零；npm 名 dsh-ponytail 被第三方占用，故改名 dsh-best-ponytail 发布

## 常见问题

**装完为什么没变化？**——默认 `mode: off`：技能已可用（被动触发 + 显式点名），常驻注入需显式开启。这是有意的最小惊讶设计。

**和 npm 上那个 dsh-ponytail 什么关系？**——无关联。那是第三方独立实现（ccll，2026-08）；本包因重名改名 dsh-best-ponytail 发布（npm + GitHub 双渠道）。

**被动触发会漏吗？**——会，这是所有按需加载 skill 的物理上限。要写代码 100% 在规则之下，把 `mode` 开成 `full`。

**上游的 benchmarks/tests 也打进来了？**——是，全部 vendored 于 upstream/，仅作溯源参考件，不在 DSH 自动运行。

## 本地构建

```sh
npm install && npm run build && npm test   # 纯 JS 无转译：语法校验 + 冒烟测试
```

## 许可证

MIT。上游 [ponytail](https://github.com/DietrichGebert/ponytail) © DietrichGebert（MIT），本包仅做 DSH 适配打包，上游内容未修改；适配层代码同以 MIT 发布。详见 [LICENSE](LICENSE)。
