<div align="center">

# 🎙️ dsh-talk
- **1024 商店渠道**：先 `npm i -g dsh1024`，再 `dsh1024 plugin --profile web add dsh-talk`（计入 [deepseek1024.com](https://deepseek1024.com) 安装排行）。

**DeepSeek Harness 的 voice-first 会话闭环：对它说话，听它回答。**

*按下麦克风说话，回复会被朗读出来——说话即打断。*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-talk)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-talk.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-top-rated.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-talk/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-talk/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-talk?label=version)](https://github.com/PerryLink/dsh-talk/releases)
[![npm version](https://img.shields.io/npm/v/dsh-talk)](https://www.npmjs.com/package/dsh-talk)
[![npm downloads](https://img.shields.io/npm/dm/dsh-talk)](https://www.npmjs.com/package/dsh-talk)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-talk?metric=downloads&lang=zh)](https://dshfind.com/zh/plugins/PerryLink/dsh-talk?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-talk
```


</div>

---


**📖 生态实测知识库**（实测数据，不是营销）：[插件开发指南 · 选型实测数据 · 维护取舍判据](https://perrylink.github.io/dsh-plugin-guide/)。

<!-- star-cta -->
## ⭐ 如果它帮到了你

这个插件是 [DSH 插件家族](https://github.com/PerryLink)的一员（40+ 个，全部 Apache-2.0）。如果你在用，**给个 star** —— 它不会解锁任何功能，但会让下一个人在搜索里更容易找到它。

*English:* part of a 40+ plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## What is dsh-talk?

DeepSeek Harness 的 voice-first 会话闭环：对它说话，听它回答。

按下麦克风说话，回复会被朗读出来——说话即打断。

![dsh-talk 终端演示：dsh-talk — install, verify the row, then talk to the session](https://raw.githubusercontent.com/PerryLink/dsh-talk/main/docs/assets/dsh-talk-hero.png)

![Animated terminal demo of dsh-talk](https://raw.githubusercontent.com/PerryLink/dsh-talk/main/docs/assets/dsh-talk-demo.gif)

*同一次运行，动图版。*

## 兼容性

| 方面 | 状态 |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1`（2026-09-24 适配：peer 第三段 + `engines.dsh` + `manifestVersion: 1`，月度 Compat workflow 已锚定该线）；门禁链于 2026-09-24 全绿（双 typecheck 尺子、86 个测试、build、self-contained、artifacts、pack）。npm 开发/测试线 `0.1.7-rc.2`，peers `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-0 <0.2.0 || >=0.1.7-0 <0.2.0`。 |
| Node | `^22.19.0 \|\| >=24.0.0` |
| 浏览器 | Web Speech + MediaRecorder（Chrome/Edge 最佳）；其余场景用宿主侧转写/TTS 引擎 |

## 你能得到什么

`dsh-talk` 双向闭合语音环路：

- **`speak` 工具** —— agent 朗读自己的回复。TTS 引擎：浏览器语音、`edge-tts`（网络神经语音）或 `piper`（本地）。音频在浏览器播放；使用本地引擎时还会落盘为文件，工具结果携带其绝对路径（`audioPath`）供其它工具使用；在能够承载该事件的宿主上，会话日志记录脱敏后的朗读内容（见安全边界）。
- **输入框麦克风按钮** —— 按下说话，转写文本自动回填输入框（或直接提交）。STT 引擎：浏览器 Web Speech（含中间结果）、FunASR HTTP 服务或本地 `whisper.cpp`。
- **说话即打断** —— 开始说话即停止当前播报（经 client→host 的 `talk` Remote 通道）。
- **事件播报** —— 回合完成、待审批（waterfall 安全：绝不阻塞门禁）与出错，带静音开关与可配话术。
- **设置页签** —— 引擎/语言选择与播报开关，以追加式 profile patch 操作保存（带备份）。

```text
浏览器                                 宿主
  🎙 按下 ──▶ 打断 ────────────────────▶ talk/interrupt
  录音（MediaRecorder / Web Speech）
  转写（浏览器）或 talk/transcribe ────▶ FunASR / whisper.cpp
  回填草稿或提交  ◀── talk:speech 投影 ── speak 工具 / 事件播报
  ▶ 播放音频（talk/audio 或 speechSynthesis）
```

## 快速开始

```sh
dsh plugin --profile web add github:PerryLink/dsh-talk
```

```sh
# 1. 把 bundle 装进你的 profile
dsh plugin --profile web add github:PerryLink/dsh-talk

# 或从 npm 安装（正式发布版）
dsh plugin --profile web add dsh-talk

# 2. 重启并核实行
dsh --profile web --dump-config | grep -A2 'id: talk'
```

然后按下输入框旁的麦克风说话；也可以让 agent 用 speak 工具朗读回复：

```
> 用 speak 工具说"你好"。
```

## 安装与卸载

- **git 通道**（最新 `main`）：`dsh plugin --profile web add github:PerryLink/dsh-talk` —— `prepare` 脚本仅用生产依赖构建。
- **npm 通道**（正式发布版）：`dsh plugin --profile web add dsh-talk`。
- **tarball 通道**：在本仓库执行 `pnpm pack`，然后 `dsh plugin --profile web add ./dsh-talk-<version>.tgz`。
- **卸载**：`dsh plugin --profile web remove dsh-talk`（或从 profile patch 中删除该行）。

> 如果 pnpm 对本包报 `ERR_PNPM_IGNORED_BUILDS`（esbuild 的平台二进制无害校验），在你的 `pnpm-workspace.yaml` 中加入 `allowBuilds: { esbuild: true }` —— `dsh` CLI 会打印确切片段。

## 配置

所有可调项都是 Schemastery `Config` 字段（可在 cordis.yml 中修改）。`cordis.patch.yml` 内联说明了每个键。

| 键 | 默认值 | 含义 |
|---|---|---|
| `record.enabled` | `true` | 显示输入框麦克风按钮 |
| `record.hotkey` | *(无)* | 可选切换快捷键，如 `"alt+r"` |
| `record.maxSeconds` | `60` | 录音上限（秒，1..600） |
| `record.autoSubmit` | `false` | 转写结果直接作为用户消息提交（false = 回填草稿） |
| `record.vad.enabled` / `silenceMs` / `energyThreshold` | `true` / `1500` / `0.01` | 语音活动检测：静音自动结束录音（缺 AudioContext 时降级为手动停止） |
| `stt.engine` | `auto` | `auto` / `web` / `funasr` / `whisper`；auto 优先已配置的本地引擎，其次 Web Speech |
| `stt.language` | `auto` | BCP-47 语言或 `auto` |
| `stt.interim` | `true` | 显示中间转写（Web Speech） |
| `stt.silenceFinaliseMs` | `4000` | 连续 Web Speech 在没有语音活动达到此毫秒数后停止（500..15000） |
| `stt.funasr.url` | *(无)* | FunASR 推理端点；引擎为 `funasr` 时必填 |
| `stt.whisper.modelPath` | *(无)* | whisper.cpp 模型；引擎为 `whisper` 时必填 |
| `tts.engine` | `auto` | `auto` / `browser` / `edge-tts` / `piper`；auto 优先 piper，其次 edge-tts，最后浏览器语音 |
| `tts.rate` | `0` | edge-tts/piper 语速偏移（百分比，-50..50） |
| `tts.fallbackToBrowser` | `true` | 本地引擎失败时回退浏览器语音 |
| `tts.browser.voiceName` | *(无)* | 首选浏览器语音名称；未找到时使用平台默认语音 |
| `tts.browser.rate` | `1` | 浏览器 SpeechSynthesis 语速（0.1..10） |
| `tts.browser.pitch` | `1` | 浏览器 SpeechSynthesis 音高（0..2） |
| `tts.piper.modelPath` | *(无)* | piper 语音模型；引擎为 `piper` 时必填 |
| `tts.export.enabled` | `true` | 把本地合成的音频写入文件，并以 `audioPath` 返回路径 |
| `tts.export.dir` | `<home>/.dsh-talk/audio` | 导出目录；`~` = 家目录，相对路径按家目录解析（绝不落在工作区） |
| `tts.export.maxFiles` | `20` | 导出目录保留的文件数，含刚写入的那个（1..1000） |
| `tts.export.maxAgeMinutes` | `1440` | 超过此分钟数的导出文件会在下次写入时清理（1..10080） |
| `announce.enabled` | `true` | 事件播报总开关 |
| `announce.onTurnEnd` / `onApproval` / `onError` | `true` | 播报哪些事件 |
| `announce.messages.*` | *"Turn complete." 等* | 播报话术 |
| `interrupt` | `true` | 开始说话即停止当前播放 |
| `maxSpeakChars` | `20000` | speak 工具文本上限（1..100000） |
| `maxAudioCacheBytes` | `8388608` | 内存合成音频缓存上限（1 MiB..64 MiB） |

`stt.silenceFinaliseMs` 与 `record.vad.silenceMs` 是两套独立机制：前者在连续 Web Speech 识别听不到语音时定稿转写文本；后者是 MediaRecorder 的能量检测器，用于结束录音（`record.autoSubmit` 开启时随即提交）。两者处于不同流水线，不共享任何状态。

### 音频文件导出

由本地引擎（`edge-tts`、`piper`）合成的每次朗读，除了进入浏览器播放用的内存缓存，还会**额外**写入一个文件。浏览器引擎在客户端合成，因此不导出任何文件 —— 这一状态会**明确报告**，绝不静默。

- **位置**：`tts.export.dir`，默认 `<home>/.dsh-talk/audio`（本插件自己的目录）。它刻意不用宿主的工作目录，因此绝不会污染代码仓；相对路径同样按家目录解析。
- **命名**：`speech-<YYYYMMDD>T<HHMMSS>Z-<8 位十六进制>.mp3`（edge-tts）或 `.wav`（piper）。时间戳为 UTC，故按名排序即按时间排序；后缀取自 utterance id，可回溯到对应的 `dsh-talk/speech` 日志条目。朗读文本绝不进入文件名。
- **清理**：每次写入都重新收敛，先按时间、再按数量。早于 `tts.export.maxAgeMinutes`（默认 1440 = 24 小时）的文件被删除，随后从最旧的开始删除，直到目录内不超过 `tts.export.maxFiles` 个（默认 20，含刚写入的那个）。清理只删除匹配本插件 `speech-…` 命名的文件，共享目录中的其它文件绝不触碰。按默认值，目录最多 20 个文件（数 MB），且不会有超过一天的旧文件。
- **失败**：导出是朗读的附加动作，绝不是前提。目录无法创建或写入时，朗读照常播放，结果里报告 `audioExport: "failed"` 及原因；清理失败被忽略，下次写入时重试。
- **模型可见的路径**：`speak` 工具的规范值携带 `audioPath`（以及 `audioExport`，无文件时还有 `exportNote`），渲染给模型的结果文本里也有同一路径 —— 因此 agent 可以直接把它交给需要文件路径的其它工具，例如某个消息插件的文件参数。事件播报（回合完成、审批、出错）走同一条流水线，也同样导出，并受同样的上限约束。
- **把文件交给其它插件**：只接受「自己工作区内文件」的消费方 —— 例如 `dsh-wechat` 的 `send_wechat`，除非它自己的 `allowAnyFilePath` 打开，否则会拒绝调用会话工作区之外的 `file_path` —— 会拒绝你主目录下的路径。要让这条链路成立，请把 `tts.export.dir` 指到该工作区内的目录（例如 `<workspace>/.dsh-talk-audio`）；默认值刻意留在所有代码仓之外。

## 工具与界面

| 界面 | 类型 | 说明 |
|---|---|---|
| `speak` | 工具 | 朗读文本（browser/edge-tts/piper）；支持单次引擎/音色覆盖；规范 JSON 结果 |
| 麦克风按钮 | `conversation.input.left` 槽位 | 录音 → 转写 → 回填草稿（或提交）；按下即打断 |
| 设置页签 | `settings.plugins.tab`（id `talk`） | 引擎/语言/播报开关；追加式保存 |
| `talk:*` | Typert Remote | `status`、`audio`、`transcribe`、`applySettings`、`interrupt`（宿主命名空间） |

## 权限与数据

- **权限**：插件保留一份内存中、字节受限的音频缓存用于播放，并在使用本地引擎时把合成音频写入自己的受限目录（`tts.export.*`，默认 `<home>/.dsh-talk/audio`，默认最多 20 个文件、保留 24 小时）；麦克风权限由浏览器管理。设置页签只向 profile 追加 patch 片段（带时间戳备份）——绝不重写文件。
- **数据**：音频字节绝不进入模型上下文或会话日志。在宿主会话词表接受的宿主上，`dsh-talk/speech` 事件携带 utterance id、引擎、原因、大小、脱敏文本，以及适用时的浏览器音色/语速/音高；在无 envelope 的宿主上该事件完全不写。`speak` 工具结果携带导出文件的路径（插件自有目录中的持久产物），其余所有展示/日志面都经过脱敏，凭证、JWT、bearer 头与临时路径都不会出现。
- **网络**：只联系你配置的引擎。`edge-tts` 执行网络合成，FunASR 使用其配置的端点，而 Chrome 的 `webkitSpeechRecognition` 会将麦克风音频发送到 Google 服务器进行转写；浏览器的 `speechSynthesis` 播放仍在本机完成。

## 安全边界

- **模型可见 ⟺ 已记录** —— 模型只看到 speak 工具的规范值与渲染文本。`dsh-talk/speech` 事件只在宿主能够承载它时写入（见宿主兼容性）；`tool/call` + `tool/result` 事件始终是可重建的痕迹。
- **审批播报绝不阻塞** —— `approval/request` 监听器总是调用 `next()`。
- **输出脱敏** —— 凭据与临时音频路径绝不上日志或展示面。唯一的刻意例外是 speak 结果里的导出音频路径：它是插件自有目录中的持久文件（仍经密钥脱敏），用途正是交给其它工具。
- **宿主兼容性** —— `dsh-talk/speech` 事件经「是/否」门写入：已知词汇表覆盖该事件的宿主直接追加，且调用方可知追加已发生；其余宿主——截至 `0.1.1-rc.2` 的全部已发布线、`0.1.2-alpha` 线、`0.1.2-rc.1`，以及 `0.1.6-alpha.2`（其 `Session.append` 只能盖章 surface intent，无法盖章 `ignorable` 信封，该字段仅保留用于存量日志读取兼容）——完全不追加，因此语音在这些宿主线上永远不会污染会话日志。跳过不再无声：宿主按会话保留「已追加/已跳过」计数，可由 `talk/latest(sessionId)` 读回；客户端会话级播放列表保持为空，speak 工具结果仍是可重建的审计痕迹。
- **失败响亮** —— 非法引擎、越界数值、缺模型/端点的引擎配置在挂载时即报错。

## 已知限制

- **浏览器支持**：Web Speech 与 MediaRecorder 均特性检测；不可用时麦克风按钮自动禁用，配置了宿主引擎（FunASR/whisper.cpp）仍可转写。
- **本地引擎需自行安装**：`edge-tts`、`piper`、`whisper.cpp` 可执行文件与模型需单独安装。
- **音频文件需要本地引擎**：浏览器语音在客户端合成，因此那里 `speak` 不返回 `audioPath`（结果中会明确说明）；本地引擎失败并回退到浏览器时同样没有文件。导出文件位于插件自有的受限目录 —— 位置、命名与清理规则见「音频文件导出」。
- **录音格式**：浏览器按其原生 MediaRecorder 编解码器录音；whisper.cpp 可能要求 WAV 录音配置或服务端转换。
- **设置重载生效**：设置页签追加到 profile patch；重载 profile（或重启 Web 应用）后生效。
- **无该词汇表的宿主上实时播放历史为空**：在 `0.1.1-rc.2`、`0.1.2-alpha` 线、`0.1.2-rc.1` 与 `0.1.6-alpha.2` 上，宿主词汇表不认识 `dsh-talk/speech`，因此门不写入任何内容，客户端的会话级播放列表保持为空；`talk/latest(sessionId)` 仍返回最新一条朗读与「已跳过」计数。朗读本身、麦克风、设置页签与工具均不受影响。
- **dsh-talk ≤ 0.2.1 写下的存量日志可能需要在冷加载前修复**：版本 0.2.1 及更早会追加未标记的 `dsh-talk/speech` 事件。在 `0.1.0-rc.7` 及更新的宿主上，日志已含这些事件的会话，其下一次冷加载会以 `SessionFormatUnsupportedError` 失败。修复：停止宿主，备份该会话的 `.jsonl` 日志，为每一行 `"type"` 为 `"dsh-talk/speech"` 的 JSON 记录加上顶层成员 `"ignorable":true`（例如在起始的 `{` 之后插入 `"ignorable":true,`），然后重新打开会话。其余内容不变，不会丢失任何数据；本版本的新追加永远不会产生未标记事件。

## 开发

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc：src + tests，对照本地 harness checkout
pnpm run typecheck:ci  # tsc：对照已发布的 0.1.7-alpha.2 类型（无 paths）
pnpm test           # vitest：108 个测试、16 个套件
pnpm run build      # tsc 声明 + tsdown bundle（lib/）
pnpm run verify:self-contained  # 依赖声明全部来自 registry
pnpm run verify:artifacts       # 构建产物 ESM 面 + client ModuleLoader 握手
pnpm pack           # 发布用 tarball
```

## 与其他 DSH 插件的互操作

已对照 **DSH `0.2.0-rc.2`**（本 README 面向的运行时）与 2026-10-05 实测的高星插件集验证。

本插件**不干扰**其他插件，包括广泛安装的高星插件：

- **无工具名冲突。** 所有工具都带命名空间，不占用任何已被内置工具或其他插件持有的裸名。
- **无服务键冲突。** 只提供 `talk`；该键既不是内置 seam，也没有被任何已调研的高星插件提供。
- **无 slot 冲突。** 不注册客户端 slot key，因此不参与 `shadows-shipped-ui` 座位争抢。
- **无 HTTP 路由冲突。** 不注册任何 `webServer` 前缀。
- **无 patch 层冲突。** 组合包 patch 只 `insert` 自己那一行，从不覆写内置行的 `config`。
- **无全局改写。** 不改原型、不改写 `process.env`、不替换全局 fetch dispatcher。

**共享事件监听器在构造上就不互相干扰。** 它用 `ctx.on()` 监听顺序敏感事件 `approval/request` —— Cordis 的**广播**语义：每个监听器都会运行，任何一个都无法饿死其他监听器。**此处每个监听器都通过 `next()` 委托**，因此链条绝不会被短路；改写作用在 `next()` 产出的值上，而不是用它顶替返回：

静态证据：`dsh-plugin-doctor` 的 K10–K13 在本仓全部为 `pass`。

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `voice`, `speech`, `tts`, `stt`, `speech-to-text`, `text-to-speech`, `microphone`

## Contributors

- [@PerryLink](https://github.com/PerryLink) —— 创建者与维护者：朗读管线、语音引擎、麦克风录音、事件播报、投影单元与五语文档。

## PerryLink DSH Plugin Family

本项目是 [PerryLink](https://github.com/PerryLink) 维护的 DeepSeek Harness 插件家族成员：**87 个活跃维护**，名册共 **95** 个，其中 **5 个已冻结**、**3 个已退役**。完整名单默认折叠，避免每个 README 的首屏被长表淹没；点击展开可查看每一行，原因见「状态」列。

<details>
<summary>展开全部 95 个插件</summary>

| 插件 | 一句话 | 状态 |
|---|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | 水产养殖投入品记录核对（按投入品用量、休药期与起捕间隔核对记录自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | 档案归档完整性与保管期限核对（依据《档案法》及配套规定，仅提示差异，不作出定性结论） |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command |  |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | 🚫 已退役 — 见仓库 README |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | 投标文件符合性预检（按招标文件逐条核对响应情况，仅提示差异，不作出定性结论） |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | 投标人资格条件核对（按资格条件与证明材料核对逐条响应，仅提示差异，不作出定性结论） |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | 🧊 已冻结 — 见仓库 README |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |  |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | 🧊 已冻结 — 见仓库 README |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | 合同条款立场台账核对（按立场、风险等级与退让底线核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | 报关单证一致性核对（按公开的报关单填制规范核对单证间字段一致性，仅提示差异，不作出定性结论） |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) |  |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | 🧊 已冻结 — 见仓库 README |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | 滞箱费台账核对（按免箱期与费率核对超期天数与金额的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review |  |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | 🧊 已冻结 — 见仓库 README |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** | 应急演练脚本核对（按阶段、响应分级、指挥与资源要素核对脚本齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** | 环评导则适用性核对（按要素、导则名称与执行标准核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** | 应急预案要素齐备性与条款级页码定位（依据 GB/T 29639-2020 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** | 作文量表评分核对（按评分项、原文定位与分值算术核对评分自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** | 证据清单齐备性核对（按待证事实与证据要素核对清单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** | 出口管制物项核对（按管制清单、最终用途与许可证核对台账齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** | FMEA 分析表要素齐备性与风险顺序数一致性核对（按公开的 FMEA 方法标准核对表内自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** | 预测准确率考核核对（按准确率、门槛与考核单价核对考核费用的算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** | 公文流转与办理时限核对（按公开的公文处理规范核对环节完整性与时限，仅提示差异，不作出定性结论） |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** | 公文格式要素核对（按公开的党政机关公文格式标准核对版头与主体要素，仅提示差异，不作出定性结论） |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** | 劳动保护与安全防护用品配置表核对（按公开的配备标准核对品名规格与配置数量，仅提示差异，不作出定性结论） |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** | 危险化学品临界量与重大危险源辨识核对（按储存量与临界量核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** | HAZOP 分析表要素齐备性与偏差推导一致性核对（依据公开的危险与可操作性分析标准，仅提示差异，不作出定性结论） |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** | 安全隐患台账→《工贸企业重大事故隐患判定标准》（应急管理部令第10号）条款映射提示（仅提示差异，不作出定性结论） |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** | 商品归类层级一致性核对（按章、品目、子目与商品编号的层级关系核对自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** | ICD 合并编码与星剑号配对提示（依据 GB/T 14396-2016 与公开的 ICD 使用说明，仅提示差异，不作出定性结论） |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** | 法条引用与文书要素核对（按名称、条号、原文与效力状态核对引用可核验性，仅提示差异，不作出定性结论） |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** | 信用证单据条款核对（按单据种类、份数、期限与不符点核对交单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** | 能力差距与培养计划核对（按能力等级差、培养措施与完成期限核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** | 病案首页形式质控与逻辑矛盾提示（依据国卫办医发〔2016〕24号等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** | 国家自然科学基金申请书形式审查与匿名化提示（依据《国家自然科学基金条例》与申请人导入的当年指南，仅提示差异，不作出定性结论） |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** | 护理记录时限、签名与评估表完整性校验（依据《病历书写基本规范》等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** | 原产地区域价值成分核对（按 RVC 定义式与门槛核对原产地判定自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** | 在线点评回复台账核对（按回复时限、问题分类与整改状态核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** | 试卷解析结构核对（按题型、答案、分值与 yotta 标识核对试卷结构自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** | 行政许可办理核对（按申请材料、法定时限与决定记录核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** | 项目全流程文件链条核对（按环节先后与金额口径核对链条自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** | 起诉状要素齐备性核对（按诉请、事实、证据、法条四要素核对文书齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** | 政策专报要素核对（按观点、依据、出处与建议核对专报齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** | 线损电量拆分与考核表核对（依据公开的线损计算口径，仅提示差异，不作出定性结论） |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** | 电力工作票要素齐备性与签发许可顺序核对（依据现行电力安全工作规程，仅提示差异，不作出定性结论） |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** | PPAP 提交要素齐备性核对（按公开的 PPAP 手册与提交等级核对要素齐备与版本填写，仅提示差异，不作出定性结论） |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** | 质疑与投诉期限核对（按公开的政府采购质疑投诉规定核对期限与台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** | 铁路施工天窗台账核对（按时间窗、时长算术与命令号核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | 🧊 已冻结 — 见仓库 README |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | 维修工单结算核对（按项目金额、配件工时合计与结算总额核对算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | 审稿意见逐条回应覆盖核对（按意见与回应一一对应核对覆盖完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | 规则库文件自检核对（按条款引用纪律与效力上限核对规则库自身合规，仅提示差异，不作出定性结论） |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | 安全技术交底记录要素齐备性与签字闭环核对（依据公开的安全生产法规与检查标准，仅提示差异，不作出定性结论） |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. |  |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | 🚫 已退役 — 见仓库 README |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | 监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | 三重一大决策台账核对（按前置研究、会议审议与决议记录核对程序留痕，仅提示差异，不作出定性结论） |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | 土壤与地下水监测台账核对（按点位、监测项目、限值与超标判定核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | 作业规程与 FMEA／控制计划一致性核对（按编号与版本核对三份文件是否同步，仅提示差异，不作出定性结论） |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | 控制图常数与过程能力指数核对（按 GB/T 4091 的常规控制图常数表核对控制限与 Cp/Cpk 的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |  |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | 🚫 已退役 — 见仓库 README |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** | 招标文件条款摘录核对（按出处与原文逐字核对摘录完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** | 评标因素评分矩阵核对（按分值上限与合计核对矩阵自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** | 质保期与索赔金额核对（按质保期月数与里程、索赔金额算式核对自洽，仅提示差异，不作出定性结论） |  |

</details>

</details>

</details>## License

[Apache License 2.0](LICENSE) © 2026 dsh-talk contributors

### 从 DSH Desktop 市场安装

所有 PerryLink 插件均可在 DSH Desktop 内置市场中浏览：**市场 → 来源 → 添加来源 → 粘贴** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ 选中**。安装仍需通过市场的 npm 身份校验与你的确认。
