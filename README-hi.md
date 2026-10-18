<div align="center">

# 🎙️ dsh-talk
- **1024 स्टोर चैनल**: एक बार `npm i -g dsh1024`, फिर `dsh1024 plugin --profile web add dsh-talk` ([deepseek1024.com](https://deepseek1024.com) इंस्टॉल रैंकिंग में गिना जाता है)।

**DeepSeek Harness के लिए वॉइस-फर्स्ट सत्र लूप: उससे बोलें और उत्तर सुनें।**

*माइक दबाएँ, बोलें और जवाब ज़ोर से पढ़ा जाता है — बोलते ही रुकावट।*

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
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-talk?metric=downloads&lang=hi)](https://dshfind.com/hi/plugins/PerryLink/dsh-talk?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-talk
```


</div>

---


**📖 इकोसिस्टम नॉलेज बेस** — मापे गए आँकड़े, मार्केटिंग नहीं: [डेवलपमेंट गाइड · चयन डेटा · रखरखाव मानदंड](https://perrylink.github.io/dsh-plugin-guide/)।

<!-- star-cta -->
## इंस्टॉल और अनइंस्टॉल

- **git चैनल** (नवीनतम `main`): `dsh plugin --profile web add github:PerryLink/dsh-talk` — `prepare` स्क्रिप्ट केवल प्रोडक्शन निर्भरताओं से बिल्ड करती है।
- **npm चैनल** (प्रकाशित रिलीज़): `dsh plugin --profile web add dsh-talk`।
- **tarball चैनल**: इस रेपो में `pnpm pack`, फिर `dsh plugin --profile web add ./dsh-talk-<version>.tgz`।
- **अनइंस्टॉल**: `dsh plugin --profile web remove dsh-talk` (या प्रोफ़ाइल पैच से पंक्ति हटाएँ)।

> यदि pnpm इस पैकेज के लिए `ERR_PNPM_IGNORED_BUILDS` दिखाता है (esbuild का हानिरहित प्लेटफ़ॉर्म-बाइनरी सत्यापन), तो अपने `pnpm-workspace.yaml` में `allowBuilds: { esbuild: true }` जोड़ें — `dsh` CLI सटीक स्निपेट प्रिंट करता है।

## ⭐ 如果它帮到了你

यह प्लगइन [DSH प्लगइन परिवार](https://github.com/PerryLink) का हिस्सा है (95 प्लगइन, सभी Apache-2.0)। अगर यह उपयोगी लगे, तो **एक स्टार दें** — इससे कोई सुविधा अनलॉक नहीं होती, पर अगला व्यक्ति इसे खोज में आसानी से पा लेता है।

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## What is dsh-talk?

DeepSeek Harness के लिए वॉइस-फर्स्ट सत्र लूप: उससे बोलें और उत्तर सुनें।

माइक दबाएँ, बोलें और जवाब ज़ोर से पढ़ा जाता है — बोलते ही रुकावट।

![dsh-talk का टर्मिनल डेमो: dsh-talk — install, verify the row, then talk to the session](https://raw.githubusercontent.com/PerryLink/dsh-talk/main/docs/assets/dsh-talk-hero.png)

![Animated terminal demo of dsh-talk](https://raw.githubusercontent.com/PerryLink/dsh-talk/main/docs/assets/dsh-talk-demo.gif)

*वही रन, एनिमेटेड।*

## संगतता

| सतह | स्थिति |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1` (2026-09-24 को अनुकूलित: peers का तीसरा खंड + `engines.dsh` + `manifestVersion: 1`, और मासिक Compat workflow उसी लाइन पर एंकर); 2026-09-24 को पूरी gate chain हरी (दो typecheck रूलर, 86 टेस्ट, build, self-contained, artifacts, pack)। npm dev/test लाइन `0.1.7-rc.2`, peers `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-0 <0.2.0 || >=0.1.7-0 <0.2.0`। |
| Node | `^22.19.0 \|\| >=24.0.0` |
| ब्राउज़र | Web Speech + MediaRecorder (Chrome/Edge में सर्वश्रेष्ठ); बाकी के लिए host के ट्रांसक्रिप्शन/TTS इंजन |

## आपको क्या मिलता है

`dsh-talk` वॉइस लूप को दोनों दिशाओं में बंद करता है:

- **`speak` टूल** — एजेंट अपने उत्तर ज़ोर से पढ़ता है। TTS इंजन: ब्राउज़र वॉइस, `edge-tts` (नेटवर्क न्यूरल वॉइस) या `piper` (स्थानीय)। ऑडियो ब्राउज़र में बजता है; स्थानीय इंजन के साथ वह एक फ़ाइल में भी लिखा जाता है और टूल का परिणाम उसका निरपेक्ष पथ (`audioPath`) साथ रखता है ताकि अन्य टूल उसे ले सकें; जो host इसे वहन कर सकते हैं वहाँ सत्र लॉग सैनिटाइज़ की गई बात दर्ज करता है (सुरक्षा सीमाएँ देखें)।
- **कंपोज़र माइक बटन** — दबाएँ, बोलें और ट्रांसक्रिप्शन इनपुट बॉक्स में भर जाता है (या सीधे सबमिट होता है)। STT इंजन: ब्राउज़र का Web Speech (अंतरिम परिणामों सहित), FunASR HTTP सर्वर या स्थानीय `whisper.cpp`।
- **बोलते ही रुकावट** — बोलना शुरू करते ही चल रहा प्लेबैक रुक जाता है (client→host, `talk` Remote नेमस्पेस पर)।
- **इवेंट घोषणाएँ** — टर्न पूरा होना, लंबित स्वीकृतियाँ (waterfall-सुरक्षित: गेट कभी ब्लॉक नहीं करता) और त्रुटियाँ, म्यूट स्विच व कॉन्फ़िगर करने योग्य वाक्यों सहित।
- **सेटिंग्स टैब** — इंजन/भाषा चयन और घोषणा स्विच, append-only प्रोफ़ाइल-पैच ऑपरेशन के रूप में सहेजे जाते हैं (बैकअप सहित)।

## त्वरित शुरुआत

```sh
dsh plugin --profile web add github:PerryLink/dsh-talk
```

```sh
# 1. बंडल को अपने प्रोफ़ाइल में इंस्टॉल करें
dsh plugin --profile web add github:PerryLink/dsh-talk

# या npm से (प्रकाशित रिलीज़)
dsh plugin --profile web add dsh-talk

# 2. पुनः आरंभ करें और पंक्ति सत्यापित करें
dsh --profile web --dump-config | grep -A2 'id: talk'
```

फिर कंपोज़र के पास माइक दबाएँ और बोलें; या एजेंट से बोलने को कहें:

```
> speak टूल से "नमस्ते" कहो।
```

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
| `stt.silenceFinaliseMs` | `4000` | इतनी मिलीसेकंड तक आवाज़ न आने पर लगातार Web Speech रोकें (500..15000) |
| `stt.funasr.url` | *(कोई नहीं)* | FunASR इन्फ़रेंस एंडपॉइंट; `funasr` इंजन के लिए आवश्यक |
| `stt.whisper.modelPath` | *(कोई नहीं)* | whisper.cpp मॉडल; `whisper` इंजन के लिए आवश्यक |
| `tts.engine` | `auto` | `auto` / `browser` / `edge-tts` / `piper`; auto पहले piper, फिर edge-tts, फिर ब्राउज़र वॉइस |
| `tts.rate` | `0` | edge-tts/piper के लिए गति ऑफ़सेट प्रतिशत में (-50..50) |
| `tts.fallbackToBrowser` | `true` | स्थानीय इंजन विफल होने पर ब्राउज़र वॉइस पर गिरें |
| `tts.browser.voiceName` | *(कोई नहीं)* | पसंदीदा ब्राउज़र वॉइस नाम; न मिलने पर प्लेटफ़ॉर्म डिफ़ॉल्ट उपयोग होता है |
| `tts.browser.rate` | `1` | ब्राउज़र SpeechSynthesis गति (0.1..10) |
| `tts.browser.pitch` | `1` | ब्राउज़र SpeechSynthesis पिच (0..2) |
| `tts.piper.modelPath` | *(कोई नहीं)* | piper वॉइस मॉडल; `piper` इंजन के लिए आवश्यक |
| `tts.export.enabled` | `true` | स्थानीय रूप से सिंथेसाइज़्ड ऑडियो को फ़ाइल में लिखें और उसका पथ `audioPath` के रूप में लौटाएँ |
| `tts.export.dir` | `<home>/.dsh-talk/audio` | निर्यात निर्देशिका; `~` = home, सापेक्ष पथ home के अंतर्गत हल होता है (कार्यस्थान में कभी नहीं) |
| `tts.export.maxFiles` | `20` | निर्देशिका में रखी फ़ाइलें, अभी लिखी गई सहित (1..1000) |
| `tts.export.maxAgeMinutes` | `1440` | इससे पुरानी निर्यात फ़ाइलें अगली बार लिखते समय हटा दी जाती हैं (1..10080) |
| `announce.enabled` | `true` | घोषणाओं का मास्टर स्विच |
| `announce.onTurnEnd` / `onApproval` / `onError` | `true` | कौन से इवेंट बोले जाएँ |
| `announce.messages.*` | *"Turn complete." आदि* | बोले जाने वाले वाक्य |
| `interrupt` | `true` | बोलते ही चलता प्लेबैक रुकता है |
| `maxSpeakChars` | `20000` | speak टूल के टेक्स्ट की सीमा (1..100000) |
| `maxAudioCacheBytes` | `8388608` | मेमोरी में सिंथेसाइज़्ड ऑडियो कैश सीमा (1 MiB..64 MiB) |

`stt.silenceFinaliseMs` और `record.vad.silenceMs` अलग-अलग तंत्र हैं: पहला लगातार Web Speech पहचान में आवाज़ न मिलने पर ट्रांसक्रिप्ट को अंतिम रूप देता है; दूसरा MediaRecorder का ऊर्जा-आधारित डिटेक्टर है जो रिकॉर्डिंग समाप्त करता है (और `record.autoSubmit` चालू होने पर उसे भेज देता है)। दोनों अलग पाइपलाइनों में चलते हैं और कोई साझा स्थिति नहीं रखते।

### ऑडियो फ़ाइल निर्यात

स्थानीय इंजन (`edge-tts`, `piper`) से सिंथेसाइज़ हर उच्चारण ब्राउज़र द्वारा बजाई जाने वाली इन-मेमोरी कैश के **अतिरिक्त** एक फ़ाइल में भी लिखा जाता है। ब्राउज़र इंजन क्लाइंट पर सिंथेसिस करता है, इसलिए वहाँ कोई फ़ाइल निर्यात नहीं होती — यह स्थिति **स्पष्ट रूप से बताई जाती है**, चुपचाप नहीं छोड़ी जाती।

- **कहाँ**: `tts.export.dir`, डिफ़ॉल्ट `<home>/.dsh-talk/audio` — प्लगइन की अपनी निर्देशिका। यह जानबूझकर host की कार्यशील निर्देशिका नहीं है, इसलिए कोई रिपॉज़िटरी कभी नहीं भरती; सापेक्ष `tts.export.dir` भी इसी कारण home के अंतर्गत हल होता है।
- **नाम**: `speech-<YYYYMMDD>T<HHMMSS>Z-<8 hex>.mp3` (edge-tts) या `.wav` (piper)। समय-मुहर UTC है, इसलिए नाम कालक्रम में क्रमबद्ध होते हैं, और टोकन utterance id से आता है, जिससे फ़ाइल अपनी `dsh-talk/speech` लॉग प्रविष्टि तक वापस पहुँचती है। बोला गया पाठ कभी फ़ाइल-नाम का हिस्सा नहीं होता।
- **सफ़ाई**: हर लेखन पर सीमित — पहले आयु से, फिर संख्या से। `tts.export.maxAgeMinutes` (डिफ़ॉल्ट 1440 = 24 घंटे) से पुरानी फ़ाइलें हटाई जाती हैं, फिर सबसे पुरानी तब तक हटती हैं जब तक निर्देशिका में `tts.export.maxFiles` (डिफ़ॉल्ट 20, अभी लिखी गई सहित) से अधिक न रहें। सफ़ाई केवल इस प्लगइन के अपने `speech-…` पैटर्न से मेल खाते नाम हटाती है, इसलिए साझा निर्देशिका की अन्य फ़ाइलें कभी नहीं छूती। डिफ़ॉल्ट पर निर्देशिका में अधिकतम 20 फ़ाइलें (कुछ MB) रहती हैं और एक दिन से पुराना कुछ नहीं।
- **विफलता**: निर्यात बोली का अतिरिक्त हिस्सा है, कभी पूर्वशर्त नहीं। निर्देशिका बन न सके या लिखी न जा सके तो उच्चारण फिर भी बजता है और परिणाम `audioExport: "failed"` के साथ कारण बताता है; सफ़ाई की विफलताएँ अनदेखी कर अगले लेखन पर दोबारा प्रयास होता है।
- **मॉडल को दिखने वाला पथ**: `speak` टूल का कैननिकल मान `audioPath` रखता है (साथ में `audioExport`, और फ़ाइल न होने पर `exportNote`), और वही पथ रेंडर किए गए टेक्स्ट में भी है — इसलिए एजेंट उसे सीधे किसी ऐसे अन्य टूल को दे सकता है जो फ़ाइल लेता है, जैसे किसी मैसेजिंग प्लगइन का फ़ाइल आर्गुमेंट। इवेंट घोषणाएँ (टर्न समाप्ति, स्वीकृति, त्रुटि) उसी पाइपलाइन से सिंथेसाइज़ होती हैं और उसी तरह निर्यात होती हैं, वही सीमाएँ लागू रहती हैं।
- **फ़ाइल किसी अन्य प्लगइन को सौंपना**: जो उपभोक्ता केवल अपने workspace के भीतर की फ़ाइलें स्वीकार करता है — जैसे `dsh-wechat` का `send_wechat`, जो अपनी `allowAnyFilePath` सेटिंग चालू न होने पर कॉल करने वाले सत्र के workspace के बाहर का `file_path` अस्वीकार करता है — वह आपके home निर्देशिका के पथ को अस्वीकार करेगा। उस प्रवाह के लिए `tts.export.dir` को उसी workspace के भीतर की निर्देशिका पर सेट करें (उदाहरण `<workspace>/.dsh-talk-audio`); डिफ़ॉल्ट जानबूझकर हर रिपॉज़िटरी के बाहर रहता है।

## टूल और सतहें

| सतह | प्रकार | टिप्पणियाँ |
|---|---|---|
| `speak` | टूल | टेक्स्ट ज़ोर से बोलता है (browser/edge-tts/piper); प्रति-कॉल इंजन/वॉइस ओवरराइड; कैननिकल JSON परिणाम |
| माइक बटन | `conversation.input.left` स्लॉट | रिकॉर्ड → ट्रांसक्राइब → ड्राफ्ट भरें (या सबमिट); दबाते ही रुकावट |
| सेटिंग्स टैब | `settings.plugins.tab` (id `talk`) | इंजन/भाषा/घोषणा स्विच; append-only सहेज |
| `talk:*` | Typert Remote | `status`, `audio`, `transcribe`, `applySettings`, `interrupt` (host नेमस्पेस) |

## अनुमतियाँ और डेटा

- **अनुमतियाँ**: प्लगइन प्लेबैक के लिए बाइट-सीमित इन-मेमोरी ऑडियो कैश रखता है और स्थानीय इंजन के साथ सिंथेसाइज़्ड ऑडियो अपनी सीमित निर्देशिका में लिखता है (`tts.export.*`, डिफ़ॉल्ट `<home>/.dsh-talk/audio`, डिफ़ॉल्ट रूप से अधिकतम 20 फ़ाइलें और 24 घंटे); माइक अनुमति ब्राउज़र-मध्यस्थ है। सेटिंग्स टैब केवल प्रोफ़ाइल में पैच खंड जोड़ता है (टाइमस्टैम्प बैकअप सहित) — फ़ाइल कभी दोबारा नहीं लिखता।
- **डेटा**: ऑडियो के बाइट कभी मॉडल संदर्भ या सत्र लॉग में नहीं जाते। जहाँ host का सत्र शब्दावली इसे स्वीकार करता है, `dsh-talk/speech` इवेंट उच्चारण id, इंजन, कारण, आकार, सैनिटाइज़ टेक्स्ट और लागू होने पर ब्राउज़र वॉइस, गति और पिच रखता है; एनवलप-रहित host पर यह इवेंट लिखा ही नहीं जाता। `speak` टूल का परिणाम निर्यात फ़ाइल का पथ रखता है (प्लगइन की अपनी निर्देशिका में स्थायी कलाकृति), और बाकी हर डिस्प्ले/लॉग सतह रिडैक्शन हेल्पर से गुज़रती है, इसलिए क्रेडेंशियल, JWT, bearer हेडर और अस्थायी पथ बाहर ही रहते हैं।
- **नेटवर्क**: केवल आपके कॉन्फ़िगर किए इंजन से संपर्क होता है। `edge-tts` नेटवर्क सिंथेसिस करता है, FunASR अपने कॉन्फ़िगर किए एंडपॉइंट का उपयोग करता है, और Chrome का `webkitSpeechRecognition` ट्रांसक्रिप्शन के लिए माइक्रोफ़ोन ऑडियो Google के सर्वर पर भेजता है; ब्राउज़र का `speechSynthesis` playback स्थानीय रहता है।

## सुरक्षा सीमाएँ

- **मॉडल-दृश्य ⟺ लॉग्ड** — मॉडल केवल speak टूल का कैननिकल मान और रेंडर टेक्स्ट देखता है। `dsh-talk/speech` इवेंट केवल तब जोड़ा जाता है जब host इसे वहन कर सके (होस्ट संगतता देखें); `tool/call` + `tool/result` इवेंट हमेशा पुनर्निर्माण योग्य निशान बने रहते हैं।
- **स्वीकृति घोषणाएँ कभी ब्लॉक नहीं करतीं** — `approval/request` लिसनर हमेशा `next()` बुलाता है।
- **सैनिटाइज़्ड आउटपुट** — क्रेडेंशियल और अस्थायी ऑडियो पथ लॉग या डिस्प्ले तक नहीं पहुँचते। एकमात्र जानबूझकर अपवाद speak परिणाम में निर्यात ऑडियो का पथ है: वह प्लगइन की अपनी निर्देशिका में स्थायी फ़ाइल है (फिर भी सीक्रेट रिडैक्टर से गुज़रती है) और उसका उद्देश्य ही उसे किसी अन्य टूल को सौंपना है।
- **होस्ट संगतता** — `dsh-talk/speech` इवेंट एक हाँ/नहीं गेट से जोड़ा जाता है। जिन host की ज्ञात-प्रकार शब्दावली इस इवेंट को कवर करती है वे इसे जोड़ते हैं और कॉल यह बताती है; बाकी हर host — `0.1.1-rc.2` तक की हर जारी लाइन, `0.1.2-alpha` लाइन, `0.1.2-rc.1`, और `0.1.6-alpha.2` भी, जिसका `Session.append` केवल surface intent स्टैम्प कर सकता है, `ignorable` एनवलप नहीं (वह फ़ील्ड केवल पठन संगतता के लिए रखा गया है) — कोई append नहीं पाते, इसलिए वहाँ स्पीच कभी सत्र लॉग को दूषित नहीं करती। यह छूट अब मौन नहीं है: host प्रति-सत्र जोड़े/छोड़े गए काउंटर रखता है और `talk/latest(sessionId)` उन्हें लौटाता है; क्लाइंट की सत्र-स्तरीय playback सूची खाली रहती है और speak टूल के परिणाम ही पुनर्निर्माण योग्य निशान हैं।
- **Fail loud** — अमान्य इंजन, सीमा से बाहर मान और बिना आवश्यक मॉडल/एंडपॉइंट के इंजन माउंट पर असफल होते हैं।

## ज्ञात सीमाएँ

- **ब्राउज़र समर्थन**: Web Speech और MediaRecorder क्षमता-पहचान से चलते हैं; बिना उनके बटन अक्षम हो जाता है और कॉन्फ़िगर होने पर host इंजन (FunASR/whisper.cpp) ट्रांसक्राइब कर सकते हैं।
- **स्थानीय इंजन आपकी इंस्टॉल हैं**: `edge-tts`, `piper`, `whisper.cpp` के निष्पादन और मॉडल अलग से इंस्टॉल करने होते हैं।
- **ऑडियो फ़ाइलों के लिए स्थानीय इंजन चाहिए**: ब्राउज़र वॉइस क्लाइंट पर सिंथेसिस करती है, इसलिए वहाँ `speak` कोई `audioPath` नहीं लौटाता (परिणाम यह स्पष्ट बताता है), और विफल होकर ब्राउज़र पर गिरा स्थानीय इंजन भी कोई फ़ाइल नहीं छोड़ता। निर्यात फ़ाइलें प्लगइन की अपनी सीमित निर्देशिका में रहती हैं — स्थान, नाम और सफ़ाई के लिए "ऑडियो फ़ाइल निर्यात" देखें।
- **रिकॉर्डिंग प्रारूप**: ब्राउज़र अपने नेटिव MediaRecorder कोडेक से रिकॉर्ड करता है; whisper.cpp को WAV रिकॉर्डर या सर्वर-साइड रूपांतरण की आवश्यकता हो सकती है।
- **सेटिंग्स रीलोड पर लागू होती हैं**: टैब प्रोफ़ाइल पैच में जोड़ता है; प्रोफ़ाइल रीलोड (या वेब-ऐप पुनः आरंभ) बदलाव सक्रिय करता है।
- **उस शब्दावली के बिना host पर live playback इतिहास खाली रहता है**: `0.1.1-rc.2`, `0.1.2-alpha` लाइन, `0.1.2-rc.1` और `0.1.6-alpha.2` पर host की शब्दावली `dsh-talk/speech` को नहीं जानती, इसलिए गेट कुछ नहीं लिखता और क्लाइंट की सत्र-स्तरीय playback सूची खाली रहती है; `talk/latest(sessionId)` फिर भी नवीनतम utterance और छोड़े गए काउंटर लौटाता है। स्पीच स्वयं, माइक, सेटिंग्स टैब और टूल अप्रभावित रहते हैं।
- **dsh-talk ≤ 0.2.1 द्वारा लिखे पुराने लॉग को cold load से पहले मरम्मत की ज़रूरत हो सकती है**: `0.2.1` तक के संस्करण बिना मार्कर वाले `dsh-talk/speech` events जोड़ते थे। `0.1.0-rc.7` या नए host पर, जिस session की log में ये पहले से हों उसका अगला cold load `SessionFormatUnsupportedError` के साथ विफल होता है। सुधार: host रोकें, session की `.jsonl` log का बैकअप लें, हर उस JSON पंक्ति में शीर्ष-स्तर सदस्य के रूप में `"ignorable":true` जोड़ें जिसका `"type"` `"dsh-talk/speech"` है (उदाहरण के लिए, शुरुआती `{` के ठीक बाद `"ignorable":true,` डालें), फिर session दोबारा खोलें। बाकी कुछ नहीं बदलता और कुछ भी खोता नहीं; इस संस्करण के नए append कभी बिना-मार्कर इवेंट नहीं जोड़ते।

## विकास

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests स्थानीय हार्नेस चेकआउट के विरुद्ध
pnpm run typecheck:ci  # tsc प्रकाशित 0.1.7-alpha.2 प्रकारों के विरुद्ध (बिना paths)
pnpm test           # vitest: 108 टेस्ट, 16 सुइट
pnpm run build      # tsc घोषणाएँ + tsdown बंडल (lib/)
pnpm run verify:self-contained  # निर्भरता स्पेक registry से हल होती हैं
pnpm run verify:artifacts       # निर्मित ESM फ़ेस + क्लाइंट ModuleLoader हैंडशेक
pnpm pack           # प्रकाशित tarball
```

## अन्य DSH प्लगइनों के साथ अंतर-संचालनीयता

**DSH `0.2.0-rc.2`** (वह रनटाइम जिसके लिए यह README प्रकाशित है) और 2026-10-05 को सर्वे किए गए उच्च-स्टार प्लगइन सेट के विरुद्ध सत्यापित।

यह प्लगइन अन्य प्लगइनों में **हस्तक्षेप नहीं करता**, उन उच्च-स्टार प्लगइनों सहित जो व्यापक रूप से इंस्टॉल हैं:

- **कोई टूल-नाम टकराव नहीं।** सभी टूल नेमस्पेस युक्त हैं; कोई भी ऐसा नंगा नाम नहीं लेता जो पहले से किसी अंतर्निहित टूल या अन्य प्लगइन का हो।
- **कोई सर्विस-की टकराव नहीं।** यह केवल `talk` प्रदान करता है; यह key न अंतर्निहित सीम है और न किसी सर्वे किए गए उच्च-स्टार प्लगइन द्वारा प्रदान की जाती है।
- **कोई स्लॉट टकराव नहीं।** यह कोई क्लाइंट slot key पंजीकृत नहीं करता, इसलिए `shadows-shipped-ui` सीट के लिए प्रतिस्पर्धा नहीं करता।
- **कोई HTTP रूट टकराव नहीं।** यह कोई `webServer` प्रीफ़िक्स पंजीकृत नहीं करता।
- **कोई patch-लेयर टकराव नहीं।** बंडल patch केवल अपनी पंक्ति `insert` करता है; कभी किसी अंतर्निहित पंक्ति का `config` ओवरराइड नहीं करता।
- **कोई वैश्विक परिवर्तन नहीं।** यह प्रोटोटाइप नहीं बदलता, `process.env` नहीं लिखता, और वैश्विक fetch dispatcher प्रतिस्थापित नहीं करता।

**साझा ईवेंट लिसनर रचना से ही अहस्तक्षेपी हैं।** यह क्रम-संवेदनशील ईवेंट `approval/request` को `ctx.on()` से देखता है — Cordis का **ब्रॉडकास्ट** पंजीकरण, जहाँ हर लिसनर चलता है और कोई किसी दूसरे को वंचित नहीं कर सकता। **यहाँ प्रत्येक लिसनर `next()` से डेलिगेट करता है**, इसलिए श्रृंखला कभी शॉर्ट-सर्किट नहीं होती:

स्थैतिक प्रमाण: इस रिपॉज़िटरी पर `dsh-plugin-doctor` के K10–K13 सभी `pass` हैं।

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `voice`, `speech`, `tts`, `stt`, `speech-to-text`, `text-to-speech`, `microphone`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — निर्माता और मेंटेनर: वॉइस पाइपलाइन, स्पीच इंजन, माइक रिकॉर्डर, इवेंट घोषणाएँ, प्रोजेक्शन यूनिट और पाँच-भाषा दस्तावेज़।

## PerryLink DSH Plugin Family

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) के **87 सक्रिय रूप से अनुरक्षित** DeepSeek Harness प्लगइन में से एक है। पूरा परिवार **95** प्लगइन है — **5 फ़्रोज़न**, **3 सेवानिवृत्त** — और नीचे संक्षिप्त रखा गया है ताकि हर README की पहली स्क्रीन छोटी रहे। हर पंक्ति देखने के लिए इसे खोलें; कारण स्थिति कॉलम में है।

<details>
<summary>सभी 95 प्लगइन खोलें</summary>

| प्लगइन | एक पंक्ति | स्थिति |
|---|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | 水产养殖投入品记录核对（按投入品用量、休药期与起捕间隔核对记录自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | 档案归档完整性与保管期限核对（依据《档案法》及配套规定，仅提示差异，不作出定性结论） |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command |  |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | 投标文件符合性预检（按招标文件逐条核对响应情况，仅提示差异，不作出定性结论） |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | 投标人资格条件核对（按资格条件与证明材料核对逐条响应，仅提示差异，不作出定性结论） |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |  |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | 合同条款立场台账核对（按立场、风险等级与退让底线核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | 报关单证一致性核对（按公开的报关单填制规范核对单证间字段一致性，仅提示差异，不作出定性结论） |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) |  |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | 滞箱费台账核对（按免箱期与费率核对超期天数与金额的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review |  |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
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
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | 维修工单结算核对（按项目金额、配件工时合计与结算总额核对算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | 审稿意见逐条回应覆盖核对（按意见与回应一一对应核对覆盖完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | 规则库文件自检核对（按条款引用纪律与效力上限核对规则库自身合规，仅提示差异，不作出定性结论） |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | 安全技术交底记录要素齐备性与签字闭环核对（依据公开的安全生产法规与检查标准，仅提示差异，不作出定性结论） |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. |  |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | 监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | 三重一大决策台账核对（按前置研究、会议审议与决议记录核对程序留痕，仅提示差异，不作出定性结论） |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | 土壤与地下水监测台账核对（按点位、监测项目、限值与超标判定核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | 作业规程与 FMEA／控制计划一致性核对（按编号与版本核对三份文件是否同步，仅提示差异，不作出定性结论） |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | 控制图常数与过程能力指数核对（按 GB/T 4091 的常规控制图常数表核对控制限与 Cp/Cpk 的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |  |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
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

### DSH Desktop मार्केट से इंस्टॉल करें

सभी PerryLink प्लगइन DSH Desktop के बिल्ट-इन मार्केट में देखे जा सकते हैं: **Market → Sources → add source → पेस्ट करें** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ चुनें**। इंस्टॉलेशन मार्केट के npm-identity सत्यापन और आपकी पुष्टि से ही होता है।
