<div align="center">

# 🎙️ dsh-talk
- **Canal 1024 store**: `npm i -g dsh1024` uma vez, depois `dsh1024 plugin --profile web add dsh-talk` (conta para o ranking de instalações do [deepseek1024.com](https://deepseek1024.com)).

**Loop de sessão voice-first para o DeepSeek Harness: fale com ele e ouça a resposta.**

*Pressione o microfone, fale e a resposta é lida em voz alta — falar interrompe.*

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
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-talk?metric=downloads&lang=pt)](https://dshfind.com/pt/plugins/PerryLink/dsh-talk?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---


<!-- star-cta -->
## ⭐ 如果它帮到了你

Este plugin faz parte da [família de plugins DSH](https://github.com/PerryLink) (mais de 40, todos Apache-2.0). Se for útil, **deixe uma estrela**: não desbloqueia nada, mas ajuda a próxima pessoa a encontrá-lo.

*English:* part of a 40+ plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.
## Compatibilidade

| Superfície | Status |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.7-rc.1` (adaptado em 2026-09-24: terceira cláusula de peers + `engines.dsh` + `manifestVersion: 1`, e o workflow Compat mensal ancorado nessa linha); cadeia completa de gates verde em 2026-09-24 (duas réguas de typecheck, 86 testes, build, self-contained, artifacts, pack). Linha npm de desenvolvimento/teste `0.1.7-rc.1`, peers `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-0 <0.2.0 || >=0.1.7-0 <0.2.0`. |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Navegador | Web Speech + MediaRecorder (melhor no Chrome/Edge); motores de transcrição/TTS do host para o resto |

## O que você ganha

O `dsh-talk` fecha o loop de voz nos dois sentidos:

- **Ferramenta `speak`** — o agente lê suas respostas em voz alta. Motores TTS: voz do navegador, `edge-tts` (vozes neurais em rede) ou `piper` (local). O áudio toca no navegador; nos hosts que podem transportá-lo, o registro de sessão guarda a fala saneada (ver Limites de segurança).
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
| `record.vad.enabled` / `silenceMs` / `energyThreshold` | `true` / `1500` / `0.01` | Detecção de atividade de voz: o silêncio encerra a gravação automaticamente (degrada para parada manual sem `AudioContext`) |
| `stt.engine` | `auto` | `auto` / `web` / `funasr` / `whisper`; auto prefere um motor local configurado, depois Web Speech |
| `stt.language` | `auto` | Idioma BCP-47 ou `auto` |
| `stt.interim` | `true` | Mostrar transcrições intermediárias (Web Speech) |
| `stt.silenceFinaliseMs` | `4000` | Parar o Web Speech contínuo após estes milissegundos sem fala (500..15000) |
| `stt.funasr.url` | *(nenhuma)* | Endpoint de inferência FunASR; obrigatório com o motor `funasr` |
| `stt.whisper.modelPath` | *(nenhuma)* | Modelo whisper.cpp; obrigatório com o motor `whisper` |
| `tts.engine` | `auto` | `auto` / `browser` / `edge-tts` / `piper`; auto prefere piper, depois edge-tts, depois a voz do navegador |
| `tts.rate` | `0` | Deslocamento de velocidade em porcentagem (-50..50) para edge-tts/piper |
| `tts.fallbackToBrowser` | `true` | Cair para a voz do navegador quando um motor local falha |
| `tts.browser.voiceName` | *(nenhuma)* | Nome preferido da voz do navegador; se não existir, usa o padrão da plataforma |
| `tts.browser.rate` | `1` | Velocidade do SpeechSynthesis do navegador (0.1..10) |
| `tts.browser.pitch` | `1` | Tom do SpeechSynthesis do navegador (0..2) |
| `tts.piper.modelPath` | *(nenhuma)* | Modelo de voz piper; obrigatório com o motor `piper` |
| `announce.enabled` | `true` | Interruptor mestre de anúncios |
| `announce.onTurnEnd` / `onApproval` / `onError` | `true` | Quais eventos são falados |
| `announce.messages.*` | *"Turn complete." etc.* | Frases faladas |
| `interrupt` | `true` | Falar para a reprodução atual |
| `maxSpeakChars` | `20000` | Limite do texto da ferramenta speak (1..100000) |
| `maxAudioCacheBytes` | `8388608` | Limite da cache de áudio em memória (1 MiB..64 MiB) |

`stt.silenceFinaliseMs` e `record.vad.silenceMs` são mecanismos distintos: o primeiro finaliza a transcrição do Web Speech quando o reconhecimento contínuo deixa de ouvir fala; o segundo é o detetor por energia do MediaRecorder que encerra a gravação (e a envia quando `record.autoSubmit` está ativo). Correm em pipelines diferentes e não partilham estado.

## Ferramentas e superfícies

| Superfície | Tipo | Notas |
|---|---|---|
| `speak` | ferramenta | Lê texto em voz alta (browser/edge-tts/piper); overrides de motor/voz por chamada; resultado JSON canônico |
| botão de microfone | slot `conversation.input.left` | Gravar → transcrever → preencher rascunho (ou enviar); falar interrompe ao pressionar |
| aba de configurações | `settings.plugins.tab` (id `talk`) | Motores/idioma/anúncios; salvamento append-only |
| `talk:*` | Typert Remote | `status`, `audio`, `transcribe`, `applySettings`, `interrupt` (namespace do host) |

## Permissões e dados

- **Permissões**: o plugin guarda apenas uma cache de áudio em memória com limite de bytes; a permissão do microfone é mediada pelo navegador. A aba de configurações apenas anexa fragmentos ao patch do perfil com backup — nunca reescreve o arquivo.
- **Dados**: o áudio nunca entra no contexto do modelo nem no registro de sessão. Onde o vocabulário de sessão do host o aceita, o evento `dsh-talk/speech` carrega o id da fala, motor, razão, tamanho, texto saneado e, quando aplicável, voz, velocidade e tom do navegador; em hosts sem envelope o evento não é escrito. Toda superfície de exibição/registro redige credenciais, JWT, cabeçalhos bearer e caminhos temporários.
- **Rede**: apenas os motores que você configurar são contatados. `edge-tts` faz síntese pela rede, o FunASR usa seu endpoint configurado e o `webkitSpeechRecognition` do Chrome envia o áudio do microfone aos servidores do Google para transcrição; a reprodução de `speechSynthesis` do navegador permanece local.

## Limites de segurança

- **Visível para o modelo ⟺ registrado** — o modelo vê apenas o valor canônico e o texto renderizado da ferramenta speak. O evento `dsh-talk/speech` é anexado apenas quando o host pode transportá-lo (ver Compatibilidade do host); os eventos `tool/call` + `tool/result` continuam sendo sempre o rastro reconstruível.
- **Anúncios de aprovação nunca bloqueiam** — o listener de `approval/request` sempre chama `next()`.
- **Saída saneada** — credenciais e caminhos temporários de áudio nunca chegam a registros ou telas.
- **Compatibilidade do host** — o evento `dsh-talk/speech` é anexado por uma comporta de sim/não. Hosts cujo vocabulário de tipos conhecidos cobre o evento o anexam e a chamada relata isso; qualquer outro host — toda linha publicada até `0.1.1-rc.2`, a linha `0.1.2-alpha`, `0.1.2-rc.1`, e também `0.1.6-alpha.2`, cujo `Session.append` só consegue estampar o surface intent e não o envelope `ignorable` (esse campo é mantido apenas para compatibilidade de leitura) — não recebe nenhum append, então a fala nunca polui o registro de sessão ali. O salto não é mais silencioso: o host mantém contadores de anexados/omitidos por sessão e `talk/latest(sessionId)` os devolve; a lista de reprodução da sessão no cliente fica vazia e os resultados da ferramenta speak continuam sendo o rastro reconstruível.
- **Falha ruidosa** — motores inválidos, valores fora de faixa e motores sem seu modelo/endpoint obrigatório falham ao montar.

## Limitações conhecidas

- **Suporte de navegador**: Web Speech e MediaRecorder são detectados por capacidade; sem eles o botão desativa e os motores do host (FunASR/whisper.cpp) podem transcrever quando configurados.
- **Motores locais são instalação sua**: os executáveis e modelos de `edge-tts`, `piper` e `whisper.cpp` devem ser instalados à parte.
- **Formato de gravação**: o navegador grava com seu codec nativo do MediaRecorder; o whisper.cpp pode exigir um gravador WAV ou conversão no servidor.
- **Configurações aplicam ao recarregar**: a aba anexa ao patch do perfil; um reload do perfil (ou reinício da web) ativa as mudanças.
- **O histórico de reprodução ao vivo fica vazio em hosts sem esse vocabulário**: em `0.1.1-rc.2`, na linha `0.1.2-alpha`, em `0.1.2-rc.1` e em `0.1.6-alpha.2` o vocabulário do host não conhece `dsh-talk/speech`, então a comporta não escreve nada e a lista de reprodução da sessão no cliente fica vazia; `talk/latest(sessionId)` continua respondendo com a última fala e o contador de omitidos. A fala em si, o microfone, a aba de configurações e a ferramenta não são afetados.
- **Registros antigos escritos pelo dsh-talk ≤ 0.2.1 podem exigir reparo antes do carregamento a frio**: versões até `0.2.1` anexavam eventos `dsh-talk/speech` sem marca. Em hosts `0.1.0-rc.7` ou mais recentes, uma sessão cujo registro já os contém falha no próximo carregamento a frio com `SessionFormatUnsupportedError`. Reparação: pare o host, faça cópia do registo `.jsonl` da sessão, acrescente `"ignorable":true` como membro de topo em cada linha JSON cujo `"type"` seja `"dsh-talk/speech"` (por exemplo, insira `"ignorable":true,` logo a seguir à `{` inicial) e reabra a sessão. Nada mais muda e nada se perde; novos appends desta versão nunca adicionam eventos sem marca.

## Desenvolvimento

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra o checkout local do harness
pnpm run typecheck:ci  # tsc contra os tipos publicados 0.1.7-alpha.2 (sem paths)
pnpm test           # vitest: 86 testes, 15 suítes
pnpm run build      # declarações tsc + bundles tsdown (lib/)
pnpm run verify:self-contained  # as specs de dependências resolvem pelo registry
pnpm run verify:artifacts       # faces ESM construídas + handshake ModuleLoader do cliente
pnpm pack           # o tarball publicado
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `voice`, `speech`, `tts`, `stt`, `speech-to-text`, `text-to-speech`, `microphone`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor: pipeline de voz, motores de fala, gravador de microfone, anúncios de eventos, unidade de projeção e a documentação em cinco idiomas.

## PerryLink DSH Plugin Family

This project is one of the **45 DeepSeek Harness plugins** maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default | |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command | |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | DSH Desktop Market standard catalog source for the PerryLink family | |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence | |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore | |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. | |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search | |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) | |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review | |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. | |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds | |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval | |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` | |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools | |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. | |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. | |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers | |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer | |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors | |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool | |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. | |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching | |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit | |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | Community certification registry with repro-checkable grades and badges | |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins | |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill | |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins | |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card | |
| **[dsh-plugin-upgrade-015](https://github.com/PerryLink/dsh-plugin-upgrade-015)** | Merged `0.1.3-alpha.1` → `0.1.5-rc.1` upgrade corridor card plus a zero-dependency seam scanner | |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions | |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. | |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. | |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review | |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. | |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. | |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools | |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. | |


## License

[Apache License 2.0](LICENSE) © 2026 dsh-talk contributors

### Instalar a partir do mercado do DSH Desktop

Todos os plugins PerryLink podem ser explorados no mercado integrado do DSH Desktop: **Market → Sources → add source → colar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecionar**. A instalação continua passando pela verificação de identidade npm do mercado e pela sua confirmação.
