<div align="center">

# 🎙️ dsh-talk

**Loop de sessão voice-first para o DeepSeek Harness: fale com ele e ouça a resposta.**

*Pressione o microfone, fale e a resposta é lida em voz alta — falar interrompe.*

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

## Compatibilidade

| Superfície | Status |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6` |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Navegador | Web Speech + MediaRecorder (melhor no Chrome/Edge); motores de transcrição/TTS do host para o resto |

## O que você ganha

O `dsh-talk` fecha o loop de voz nos dois sentidos:

- **Ferramenta `speak`** — o agente lê suas respostas em voz alta. Motores TTS: voz do navegador, `edge-tts` (vozes neurais em rede) ou `piper` (local). O áudio toca no navegador; o registro de sessão guarda a fala saneada.
- **Botão de microfone** — pressione, fale e a transcrição cai na caixa de entrada (ou envia direto). Motores STT: Web Speech do navegador (com resultados intermediários), um servidor HTTP FunASR ou `whisper.cpp` local.
- **Falar interrompe** — começar a falar para a reprodução (canal client→host sobre o namespace `talk`).
- **Anúncios de eventos** — fim de turno, aprovações pendentes (seguro em cascata: nunca bloqueia o portão) e erros, com interruptor de mudo e frases configuráveis.
- **Aba de configurações** — seleção de motor/idioma e interruptores de anúncios, salvos como operações append-only do patch de perfil com backups.

## Início rápido

```sh
# 1. instale o bundle no seu perfil
dsh plugin --profile web add "github:PerryLink/dsh-talk#main"

# ou pelo npm (versões publicadas)
dsh plugin --profile web add dsh-talk

# 2. reinicie e verifique a linha
dsh --profile web --dump-config | grep -A2 'id: talk'
```

Depois pressione o microfone ao lado do compositor e fale; ou peça ao agente para falar:

```
> Diga "olá" com a ferramenta speak.
```

## Instalação e desinstalação

- **Canal git** (último `main`): `dsh plugin --profile web add "github:PerryLink/dsh-talk#main"` — o script `prepare` compila apenas com dependências de produção.
- **Canal npm** (versões publicadas): `dsh plugin --profile web add dsh-talk`.
- **Canal tarball**: `pnpm pack` neste repositório e então `dsh plugin --profile web add ./dsh-talk-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-talk` (ou remova a linha do patch do perfil).

> Se o pnpm reportar `ERR_PNPM_IGNORED_BUILDS` para este pacote (a validação inofensiva do binário do esbuild), adicione `allowBuilds: { esbuild: true }` ao seu `pnpm-workspace.yaml` — o CLI `dsh` imprime o trecho exato.

## Configuração

Todos os ajustes são campos `Config` do Schemastery (alteráveis pelo cordis.yml). O `cordis.patch.yml` documenta cada chave.

| Chave | Padrão | Significado |
|---|---|---|
| `record.enabled` | `true` | Mostrar o botão de microfone do compositor |
| `record.hotkey` | *(nenhuma)* | Atalho opcional, ex. `"alt+r"` |
| `record.maxSeconds` | `60` | Limite de gravação em segundos (1..600) |
| `record.autoSubmit` | `false` | Enviar a transcrição como mensagem do usuário (false = preencher o rascunho) |
| `stt.engine` | `auto` | `auto` / `web` / `funasr` / `whisper`; auto prefere um motor local configurado, depois Web Speech |
| `stt.language` | `auto` | Idioma BCP-47 ou `auto` |
| `stt.interim` | `true` | Mostrar transcrições intermediárias (Web Speech) |
| `stt.funasr.url` | *(nenhuma)* | Endpoint de inferência FunASR; obrigatório com o motor `funasr` |
| `stt.whisper.modelPath` | *(nenhuma)* | Modelo whisper.cpp; obrigatório com o motor `whisper` |
| `tts.engine` | `auto` | `auto` / `browser` / `edge-tts` / `piper`; auto prefere piper, depois edge-tts, depois a voz do navegador |
| `tts.rate` | `0` | Deslocamento de velocidade em porcentagem (-50..50) para edge-tts/piper |
| `tts.fallbackToBrowser` | `true` | Cair para a voz do navegador quando um motor local falha |
| `tts.piper.modelPath` | *(nenhuma)* | Modelo de voz piper; obrigatório com o motor `piper` |
| `announce.enabled` | `true` | Interruptor mestre de anúncios |
| `announce.onTurnEnd` / `onApproval` / `onError` | `true` | Quais eventos são falados |
| `announce.messages.*` | *"Turn complete." etc.* | Frases faladas |
| `interrupt` | `true` | Falar para a reprodução atual |
| `maxSpeakChars` | `20000` | Limite do texto da ferramenta speak (1..100000) |
| `maxAudioCacheBytes` | `8388608` | Limite da cache de áudio em memória (1 MiB..64 MiB) |

## Ferramentas e superfícies

| Superfície | Tipo | Notas |
|---|---|---|
| `speak` | ferramenta | Lê texto em voz alta (browser/edge-tts/piper); overrides de motor/voz por chamada; resultado JSON canônico |
| botão de microfone | slot `conversation.input.left` | Gravar → transcrever → preencher rascunho (ou enviar); falar interrompe ao pressionar |
| aba de configurações | `settings.plugins.tab` (id `talk`) | Motores/idioma/anúncios; salvamento append-only |
| `talk:*` | Typert Remote | `status`, `audio`, `transcribe`, `applySettings`, `interrupt` (namespace do host) |

## Permissões e dados

- **Permissões**: o plugin guarda apenas uma cache de áudio em memória com limite de bytes; a permissão do microfone é mediada pelo navegador. A aba de configurações apenas anexa fragmentos ao patch do perfil com backup — nunca reescreve o arquivo.
- **Dados**: o áudio nunca entra no contexto do modelo nem no registro de sessão. O evento `dsh-talk/speech` carrega apenas o id da fala, motor, razão, tamanho e texto saneado. Toda superfície de exibição/registro redige credenciais, JWT, cabeçalhos bearer e caminhos temporários.
- **Rede**: apenas os motores que você configurar são contatados (síntese em rede do edge-tts, um endpoint FunASR); a voz do navegador e o Web Speech ficam no dispositivo.

## Limites de segurança

- **Visível para o modelo ⟺ registrado** — o modelo vê apenas o valor canônico da ferramenta speak; cada fala é reconstruível a partir do registro de sessão.
- **Anúncios de aprovação nunca bloqueiam** — o listener de `approval/request` sempre chama `next()`.
- **Saída saneada** — credenciais e caminhos temporários de áudio nunca chegam a registros ou telas.
- **Falha ruidosa** — motores inválidos, valores fora de faixa e motores sem seu modelo/endpoint obrigatório falham ao montar.

## Limitações conhecidas

- **Suporte de navegador**: Web Speech e MediaRecorder são detectados por capacidade; sem eles o botão desativa e os motores do host (FunASR/whisper.cpp) podem transcrever quando configurados.
- **Motores locais são instalação sua**: os executáveis e modelos de `edge-tts`, `piper` e `whisper.cpp` devem ser instalados à parte.
- **Formato de gravação**: o navegador grava com seu codec nativo do MediaRecorder; o whisper.cpp pode exigir um gravador WAV ou conversão no servidor.
- **Configurações aplicam ao recarregar**: a aba anexa ao patch do perfil; um reload do perfil (ou reinício da web) ativa as mudanças.

## Desenvolvimento

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra o checkout local do harness
pnpm run typecheck:ci  # tsc contra os tipos publicados 0.1.0-rc.6 (sem paths)
pnpm test           # vitest: 45 testes, 7 suítes
pnpm run build      # declarações tsc + bundles tsdown (lib/)
pnpm run verify:self-contained  # as specs de dependências resolvem pelo registry
pnpm run verify:artifacts       # faces ESM construídas + handshake ModuleLoader do cliente
pnpm pack           # o tarball publicado
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `voice`, `speech`, `tts`, `stt`, `speech-to-text`, `text-to-speech`, `microphone`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor: pipeline de voz, motores de fala, gravador de microfone, anúncios de eventos, unidade de projeção e a documentação em cinco idiomas.

## License

[Apache License 2.0](LICENSE) © 2026 dsh-talk contributors
