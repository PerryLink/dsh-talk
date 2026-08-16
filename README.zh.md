<div align="center">

# 🎙️ dsh-talk

**DeepSeek Harness 的 voice-first 会话闭环：对它说话，听它回答。**

*按下麦克风说话，回复会被朗读出来——说话即打断。*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh-plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-talk/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-talk/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-talk?label=version)](https://github.com/PerryLink/dsh-talk/releases)
[![npm version](https://img.shields.io/npm/v/dsh-talk)](https://www.npmjs.com/package/dsh-talk)
[![npm downloads](https://img.shields.io/npm/dm/dsh-talk)](https://www.npmjs.com/package/dsh-talk)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## 兼容性

| 方面 | 状态 |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6` |
| Node | `^22.19.0 \|\| >=24.0.0` |
| 浏览器 | Web Speech + MediaRecorder（Chrome/Edge 最佳）；其余场景用宿主侧转写/TTS 引擎 |

## 你能得到什么

`dsh-talk` 双向闭合语音环路：

- **`speak` 工具** —— agent 朗读自己的回复。TTS 引擎：浏览器语音、`edge-tts`（网络神经语音）或 `piper`（本地）。音频在浏览器播放；会话日志记录脱敏后的朗读内容。
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
# 1. 把 bundle 装进你的 profile
dsh plugin --profile web add "github:PerryLink/dsh-talk#main"

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

- **git 通道**（最新 `main`）：`dsh plugin --profile web add "github:PerryLink/dsh-talk#main"` —— `prepare` 脚本仅用生产依赖构建。
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
| `stt.engine` | `auto` | `auto` / `web` / `funasr` / `whisper`；auto 优先已配置的本地引擎，其次 Web Speech |
| `stt.language` | `auto` | BCP-47 语言或 `auto` |
| `stt.interim` | `true` | 显示中间转写（Web Speech） |
| `stt.funasr.url` | *(无)* | FunASR 推理端点；引擎为 `funasr` 时必填 |
| `stt.whisper.modelPath` | *(无)* | whisper.cpp 模型；引擎为 `whisper` 时必填 |
| `tts.engine` | `auto` | `auto` / `browser` / `edge-tts` / `piper`；auto 优先 piper，其次 edge-tts，最后浏览器语音 |
| `tts.rate` | `0` | edge-tts/piper 语速偏移（百分比，-50..50） |
| `tts.fallbackToBrowser` | `true` | 本地引擎失败时回退浏览器语音 |
| `tts.piper.modelPath` | *(无)* | piper 语音模型；引擎为 `piper` 时必填 |
| `announce.enabled` | `true` | 事件播报总开关 |
| `announce.onTurnEnd` / `onApproval` / `onError` | `true` | 播报哪些事件 |
| `announce.messages.*` | *"Turn complete." 等* | 播报话术 |
| `interrupt` | `true` | 开始说话即停止当前播放 |
| `maxSpeakChars` | `20000` | speak 工具文本上限（1..100000） |
| `maxAudioCacheBytes` | `8388608` | 内存合成音频缓存上限（1 MiB..64 MiB） |

## 工具与界面

| 界面 | 类型 | 说明 |
|---|---|---|
| `speak` | 工具 | 朗读文本（browser/edge-tts/piper）；支持单次引擎/音色覆盖；规范 JSON 结果 |
| 麦克风按钮 | `conversation.input.left` 槽位 | 录音 → 转写 → 回填草稿（或提交）；按下即打断 |
| 设置页签 | `settings.plugins.tab`（id `talk`） | 引擎/语言/播报开关；追加式保存 |
| `talk:*` | Typert Remote | `status`、`audio`、`transcribe`、`applySettings`、`interrupt`（宿主命名空间） |

## 权限与数据

- **权限**：插件只保存内存中、字节受限的音频缓存；麦克风权限由浏览器管理。设置页签只向 profile 追加 patch 片段（带时间戳备份）——绝不重写文件。
- **数据**：音频绝不进入模型上下文或会话日志。`dsh-talk/speech` 事件只携带朗读 id、引擎、原因、大小与脱敏文本。所有展示/日志面都会脱敏凭据、JWT、bearer 头与临时路径。
- **网络**：只联系你配置的引擎（edge-tts 网络合成、FunASR 端点）；浏览器语音与 Web Speech 留在本机。

## 安全边界

- **模型可见 ⟺ 已记录** —— 模型只看到 speak 工具的规范值；每次朗读均可自会话日志重建。
- **审批播报绝不阻塞** —— `approval/request` 监听器总是调用 `next()`。
- **输出脱敏** —— 凭据与临时音频路径绝不上日志或展示面。
- **失败响亮** —— 非法引擎、越界数值、缺模型/端点的引擎配置在挂载时即报错。

## 已知限制

- **浏览器支持**：Web Speech 与 MediaRecorder 均特性检测；不可用时麦克风按钮自动禁用，配置了宿主引擎（FunASR/whisper.cpp）仍可转写。
- **本地引擎需自行安装**：`edge-tts`、`piper`、`whisper.cpp` 可执行文件与模型需单独安装。
- **录音格式**：浏览器按其原生 MediaRecorder 编解码器录音；whisper.cpp 可能要求 WAV 录音配置或服务端转换。
- **设置重载生效**：设置页签追加到 profile patch；重载 profile（或重启 Web 应用）后生效。

## 开发

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc：src + tests，对照本地 harness checkout
pnpm run typecheck:ci  # tsc：对照已发布的 0.1.0-rc.6 类型（无 paths）
pnpm test           # vitest：45 个测试、7 个套件
pnpm run build      # tsc 声明 + tsdown bundle（lib/）
pnpm run verify:self-contained  # 依赖声明全部来自 registry
pnpm run verify:artifacts       # 构建产物 ESM 面 + client ModuleLoader 握手
pnpm pack           # 发布用 tarball
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `voice`, `speech`, `tts`, `stt`, `speech-to-text`, `text-to-speech`, `microphone`

## Contributors

- [@PerryLink](https://github.com/PerryLink) —— 创建者与维护者：朗读管线、语音引擎、麦克风录音、事件播报、投影单元与五语文档。

## License

[Apache License 2.0](LICENSE) © 2026 dsh-talk contributors
