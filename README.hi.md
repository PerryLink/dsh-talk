<div align="center">

# 🎙️ dsh-talk

**DeepSeek Harness के लिए वॉइस-फर्स्ट सत्र लूप: उससे बोलें और उत्तर सुनें।**

*माइक दबाएँ, बोलें और जवाब ज़ोर से पढ़ा जाता है — बोलते ही रुकावट।*

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

## संगतता

| सतह | स्थिति |
|---|---|
| Harness | DeepSeek Harness `0.1.1-rc.2` |
| Node | `^22.19.0 \|\| >=24.0.0` |
| ब्राउज़र | Web Speech + MediaRecorder (Chrome/Edge में सर्वश्रेष्ठ); बाकी के लिए host के ट्रांसक्रिप्शन/TTS इंजन |

## आपको क्या मिलता है

`dsh-talk` वॉइस लूप को दोनों दिशाओं में बंद करता है:

- **`speak` टूल** — एजेंट अपने उत्तर ज़ोर से पढ़ता है। TTS इंजन: ब्राउज़र वॉइस, `edge-tts` (नेटवर्क न्यूरल वॉइस) या `piper` (स्थानीय)। ऑडियो ब्राउज़र में बजता है; सत्र लॉग सैनिटाइज़ की गई बात दर्ज करता है।
- **कंपोज़र माइक बटन** — दबाएँ, बोलें और ट्रांसक्रिप्शन इनपुट बॉक्स में भर जाता है (या सीधे सबमिट होता है)। STT इंजन: ब्राउज़र का Web Speech (अंतरिम परिणामों सहित), FunASR HTTP सर्वर या स्थानीय `whisper.cpp`।
- **बोलते ही रुकावट** — बोलना शुरू करते ही चल रहा प्लेबैक रुक जाता है (client→host, `talk` Remote नेमस्पेस पर)।
- **इवेंट घोषणाएँ** — टर्न पूरा होना, लंबित स्वीकृतियाँ (waterfall-सुरक्षित: गेट कभी ब्लॉक नहीं करता) और त्रुटियाँ, म्यूट स्विच व कॉन्फ़िगर करने योग्य वाक्यों सहित।
- **सेटिंग्स टैब** — इंजन/भाषा चयन और घोषणा स्विच, append-only प्रोफ़ाइल-पैच ऑपरेशन के रूप में सहेजे जाते हैं (बैकअप सहित)।

## त्वरित शुरुआत

```sh
# 1. बंडल को अपने प्रोफ़ाइल में इंस्टॉल करें
dsh plugin --profile web add "github:PerryLink/dsh-talk#main"

# या npm से (प्रकाशित रिलीज़)
dsh plugin --profile web add dsh-talk

# 2. पुनः आरंभ करें और पंक्ति सत्यापित करें
dsh --profile web --dump-config | grep -A2 'id: talk'
```

फिर कंपोज़र के पास माइक दबाएँ और बोलें; या एजेंट से बोलने को कहें:

```
> speak टूल से "नमस्ते" कहो।
```

## इंस्टॉल और अनइंस्टॉल

- **git चैनल** (नवीनतम `main`): `dsh plugin --profile web add "github:PerryLink/dsh-talk#main"` — `prepare` स्क्रिप्ट केवल प्रोडक्शन निर्भरताओं से बिल्ड करती है।
- **npm चैनल** (प्रकाशित रिलीज़): `dsh plugin --profile web add dsh-talk`।
- **tarball चैनल**: इस रेपो में `pnpm pack`, फिर `dsh plugin --profile web add ./dsh-talk-<version>.tgz`।
- **अनइंस्टॉल**: `dsh plugin --profile web remove dsh-talk` (या प्रोफ़ाइल पैच से पंक्ति हटाएँ)।

> यदि pnpm इस पैकेज के लिए `ERR_PNPM_IGNORED_BUILDS` दिखाता है (esbuild का हानिरहित प्लेटफ़ॉर्म-बाइनरी सत्यापन), तो अपने `pnpm-workspace.yaml` में `allowBuilds: { esbuild: true }` जोड़ें — `dsh` CLI सटीक स्निपेट प्रिंट करता है।

## कॉन्फ़िगरेशन

सभी समायोजन Schemastery `Config` फ़ील्ड हैं (cordis.yml से बदले जा सकते हैं)। `cordis.patch.yml` हर कुंजी को इनलाइन समझाता है।

| कुंजी | डिफ़ॉल्ट | अर्थ |
|---|---|---|
| `record.enabled` | `true` | कंपोज़र माइक बटन दिखाएँ |
| `record.hotkey` | *(कोई नहीं)* | वैकल्पिक टॉगल हॉटकी, जैसे `"alt+r"` |
| `record.maxSeconds` | `60` | रिकॉर्डिंग सीमा सेकंड में (1..600) |
| `record.autoSubmit` | `false` | ट्रांसक्रिप्शन को उपयोगकर्ता संदेश के रूप में सबमिट करें (false = ड्राफ्ट भरें) |
| `record.vad.enabled` / `silenceMs` / `energyThreshold` | `true` / `1500` / `0.01` | ध्वनि-गतिविधि पहचान: मौन रिकॉर्डिंग स्वतः समाप्त करता है (AudioContext अनुपस्थित होने पर मैनुअल स्टॉप) |
| `stt.engine` | `auto` | `auto` / `web` / `funasr` / `whisper`; auto पहले कॉन्फ़िगर किया स्थानीय इंजन, फिर Web Speech |
| `stt.language` | `auto` | BCP-47 भाषा या `auto` |
| `stt.interim` | `true` | अंतरिम ट्रांसक्रिप्शन दिखाएँ (Web Speech) |
| `stt.funasr.url` | *(कोई नहीं)* | FunASR इन्फ़रेंस एंडपॉइंट; `funasr` इंजन के लिए आवश्यक |
| `stt.whisper.modelPath` | *(कोई नहीं)* | whisper.cpp मॉडल; `whisper` इंजन के लिए आवश्यक |
| `tts.engine` | `auto` | `auto` / `browser` / `edge-tts` / `piper`; auto पहले piper, फिर edge-tts, फिर ब्राउज़र वॉइस |
| `tts.rate` | `0` | edge-tts/piper के लिए गति ऑफ़सेट प्रतिशत में (-50..50) |
| `tts.fallbackToBrowser` | `true` | स्थानीय इंजन विफल होने पर ब्राउज़र वॉइस पर गिरें |
| `tts.browser.voiceName` | *(कोई नहीं)* | पसंदीदा ब्राउज़र वॉइस नाम; न मिलने पर प्लेटफ़ॉर्म डिफ़ॉल्ट उपयोग होता है |
| `tts.browser.rate` | `1` | ब्राउज़र SpeechSynthesis गति (0.1..10) |
| `tts.browser.pitch` | `1` | ब्राउज़र SpeechSynthesis पिच (0..2) |
| `tts.piper.modelPath` | *(कोई नहीं)* | piper वॉइस मॉडल; `piper` इंजन के लिए आवश्यक |
| `announce.enabled` | `true` | घोषणाओं का मास्टर स्विच |
| `announce.onTurnEnd` / `onApproval` / `onError` | `true` | कौन से इवेंट बोले जाएँ |
| `announce.messages.*` | *"Turn complete." आदि* | बोले जाने वाले वाक्य |
| `interrupt` | `true` | बोलते ही चलता प्लेबैक रुकता है |
| `maxSpeakChars` | `20000` | speak टूल के टेक्स्ट की सीमा (1..100000) |
| `maxAudioCacheBytes` | `8388608` | मेमोरी में सिंथेसाइज़्ड ऑडियो कैश सीमा (1 MiB..64 MiB) |

## टूल और सतहें

| सतह | प्रकार | टिप्पणियाँ |
|---|---|---|
| `speak` | टूल | टेक्स्ट ज़ोर से बोलता है (browser/edge-tts/piper); प्रति-कॉल इंजन/वॉइस ओवरराइड; कैननिकल JSON परिणाम |
| माइक बटन | `conversation.input.left` स्लॉट | रिकॉर्ड → ट्रांसक्राइब → ड्राफ्ट भरें (या सबमिट); दबाते ही रुकावट |
| सेटिंग्स टैब | `settings.plugins.tab` (id `talk`) | इंजन/भाषा/घोषणा स्विच; append-only सहेज |
| `talk:*` | Typert Remote | `status`, `audio`, `transcribe`, `applySettings`, `interrupt` (host नेमस्पेस) |

## अनुमतियाँ और डेटा

- **अनुमतियाँ**: प्लगइन केवल बाइट-सीमित इन-मेमोरी ऑडियो कैश रखता है; माइक अनुमति ब्राउज़र-मध्यस्थ है। सेटिंग्स टैब केवल प्रोफ़ाइल में पैच खंड जोड़ता है (टाइमस्टैम्प बैकअप सहित) — फ़ाइल कभी दोबारा नहीं लिखता।
- **डेटा**: ऑडियो कभी मॉडल संदर्भ या सत्र लॉग में नहीं जाता। `dsh-talk/speech` इवेंट केवल उच्चारण id, इंजन, कारण, आकार और सैनिटाइज़ टेक्स्ट रखता है। हर डिस्प्ले/लॉग सतह क्रेडेंशियल, JWT, bearer हेडर और अस्थायी पथों को रिडैक्ट करती है।
- **नेटवर्क**: केवल आपके कॉन्फ़िगर किए इंजन संपर्क में आते हैं (edge-tts नेटवर्क सिंथेसिस, FunASR एंडपॉइंट); ब्राउज़र वॉइस और Web Speech डिवाइस पर ही रहते हैं।

## सुरक्षा सीमाएँ

- **मॉडल-दृश्य ⟺ लॉग्ड** — मॉडल केवल speak टूल का कैननिकल मान देखता है; हर उच्चारण सत्र लॉग से पुनर्निर्माण योग्य है।
- **स्वीकृति घोषणाएँ कभी ब्लॉक नहीं करतीं** — `approval/request` लिसनर हमेशा `next()` बुलाता है।
- **सैनिटाइज़्ड आउटपुट** — क्रेडेंशियल और अस्थायी ऑडियो पथ लॉग या डिस्प्ले तक नहीं पहुँचते।
- **Fail loud** — अमान्य इंजन, सीमा से बाहर मान और बिना आवश्यक मॉडल/एंडपॉइंट के इंजन माउंट पर असफल होते हैं।

## ज्ञात सीमाएँ

- **ब्राउज़र समर्थन**: Web Speech और MediaRecorder क्षमता-पहचान से चलते हैं; बिना उनके बटन अक्षम हो जाता है और कॉन्फ़िगर होने पर host इंजन (FunASR/whisper.cpp) ट्रांसक्राइब कर सकते हैं।
- **स्थानीय इंजन आपकी इंस्टॉल हैं**: `edge-tts`, `piper`, `whisper.cpp` के निष्पादन और मॉडल अलग से इंस्टॉल करने होते हैं।
- **रिकॉर्डिंग प्रारूप**: ब्राउज़र अपने नेटिव MediaRecorder कोडेक से रिकॉर्ड करता है; whisper.cpp को WAV रिकॉर्डर या सर्वर-साइड रूपांतरण की आवश्यकता हो सकती है।
- **सेटिंग्स रीलोड पर लागू होती हैं**: टैब प्रोफ़ाइल पैच में जोड़ता है; प्रोफ़ाइल रीलोड (या वेब-ऐप पुनः आरंभ) बदलाव सक्रिय करता है।

## विकास

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests स्थानीय हार्नेस चेकआउट के विरुद्ध
pnpm run typecheck:ci  # tsc प्रकाशित 0.1.1-rc.2 प्रकारों के विरुद्ध (बिना paths)
pnpm test           # vitest: 58 टेस्ट, 10 सुइट
pnpm run build      # tsc घोषणाएँ + tsdown बंडल (lib/)
pnpm run verify:self-contained  # निर्भरता स्पेक registry से हल होती हैं
pnpm run verify:artifacts       # निर्मित ESM फ़ेस + क्लाइंट ModuleLoader हैंडशेक
pnpm pack           # प्रकाशित tarball
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `voice`, `speech`, `tts`, `stt`, `speech-to-text`, `text-to-speech`, `microphone`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — निर्माता और मेंटेनर: वॉइस पाइपलाइन, स्पीच इंजन, माइक रिकॉर्डर, इवेंट घोषणाएँ, प्रोजेक्शन यूनिट और पाँच-भाषा दस्तावेज़।

## PerryLink DSH Plugin Family

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) द्वारा अनुरक्षित [29 DeepSeek Harness प्लगइनों](https://github.com/PerryLink) में से एक है। अगर यह आपकी मदद करता है, तो बाकी भी करेंगे:

| Plugin | One-liner |
|---|---|
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | अनुमोदन श्रृंखला पर दूसरे मॉडल से स्वतः-समीक्षा, डिफ़ॉल्ट रूप से असफल-बंद |
| [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | Web UI साइडबार, संदेश और रुकावट के साथ स्थायी पृष्ठभूमि चाइल्ड एजेंट |
| [dsh-budget](https://github.com/PerryLink/dsh-budget) | DeepSeek Harness के लिए लागत प्रशासन: बजट, कार्बन और विलंबता एक पैनल में। |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | Claude Code /rewind-समतुल्य: स्नैपशॉट, सत्र फोर्क, एक-बार पुनर्स्थापन |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | Claude Code सत्र, स्मृति, skills और CLAUDE.md को DSH में स्थानांतरित करें |
| [dsh-click](https://github.com/PerryLink/dsh-click) | DeepSeek Harness के लिए क्रॉस-प्लेटफ़ॉर्म नेटिव डेस्कटॉप नियंत्रण — Windows पहले। |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | Web कंपोज़र के लिए टर्मिनल-शैली इनपुट इतिहास: तीर, Ctrl+R खोज |
| [dsh-defend](https://github.com/PerryLink/dsh-defend) | DeepSeek Harness के लिए प्रॉम्प्ट-इंजेक्शन, जेलब्रेक और सीक्रेट-लीक रक्षा। |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | इंजीनियरिंग-अनुशासन गार्ड: आवश्यकताएँ पूछताछ, परीक्षण द्वार, विरोधी समीक्षा |
| [dsh-draw](https://github.com/PerryLink/dsh-draw) | DeepSeek Harness के लिए एकीकृत स्थैतिक-छवि निर्माण रूटिंग। |
| [dsh-fast](https://github.com/PerryLink/dsh-fast) | DeepSeek Harness के लिए केवल-पठन प्रदर्शन निदान। |
| [dsh-github](https://github.com/PerryLink/dsh-github) | DSH के लिए GitHub PR/issues एकीकरण, हर लेखन अनुमोदन-द्वारित |
| [dsh-library](https://github.com/PerryLink/dsh-library) | DeepSeek Harness के लिए स्थानीय दस्तावेज़ ज्ञानकोश। |
| [dsh-local-ai](https://github.com/PerryLink/dsh-local-ai) | DeepSeek Harness के लिए स्थानीय-मॉडल (Ollama) एकीकरण। |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | भाषा सर्वरों पर LSP निदान, फ़ॉर्मेटिंग, पूर्णता, कोड क्रियाएँ और नाम बदलना |
| [dsh-mask](https://github.com/PerryLink/dsh-mask) | DeepSeek Harness के लिए PII मास्किंग मिडलवेयर — मॉडल तक पहुँचने से पहले व्यक्तिगत डेटा अनाम करता है, प्रदर्शन परत पर बहाल करता है। |
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | केवल-पठन MCP रनटाइम पैनल: /mcp कमांड + स्थिति, टूल और त्रुटियों वाला सेटिंग टैब |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | अनुमोदन-द्वारित क्रॉस-सत्र स्मृति: ctx.memory seam + SQLite + memory टूल |
| [dsh-observe](https://github.com/PerryLink/dsh-observe) | DeepSeek Harness के लिए OpenTelemetry और Langfuse अवलोकनीयता निर्यातक। |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | Claude Code outputStyles-समतुल्य रनटाइम शैली स्विचिंग |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Claude Code-शैली घोषणात्मक allow/deny/ask अनुमति नियम, ऑडिट के साथ |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | माँग-पर एजेंट स्किल के रूप में प्लगइन-विकास ज्ञानकोश |
| [dsh-score](https://github.com/PerryLink/dsh-score) | DeepSeek Harness प्लगइनों के लिए बहु-आयामी गुणवत्ता स्कोरिंग। |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | Web साइडबार में सत्र पिन करें, स्थायी क्रम के साथ |
| [dsh-session-sync](https://github.com/PerryLink/dsh-session-sync) | DeepSeek Harness के लिए क्रॉस-डिवाइस सत्र सिंक — आपके सत्र स्टोर का एक समर्पित git मिरर। |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | सुरक्षा-ऑडिट स्किल पैक: सीक्रेट स्कैन, निर्भरता और आपूर्ति-श्रृंखला समीक्षा |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | DeepSeek Harness के लिए आवाज़-प्रथम सत्र लूप: बोलें और उत्तर सुनें। |
| [dsh-test-drive](https://github.com/PerryLink/dsh-test-drive) | DeepSeek Harness प्लगइनों के लिए पृथक इंस्टॉल-और-स्मोक परीक्षण। |
| [dsh-translate](https://github.com/PerryLink/dsh-translate) | DeepSeek Harness के लिए वेंडर पैरामीटर अनुवाद और नियतात्मक JSON मरम्मत। |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-talk contributors
