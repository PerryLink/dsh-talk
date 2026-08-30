<div align="center">

# 🎙️ dsh-talk
- **Canal 1024 store**: `npm i -g dsh1024` uma vez, depois `dsh1024 plugin --profile web add dsh-talk` (conta para o ranking de instalações do [deepseek1024.com](https://deepseek1024.com)).

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
| Harness | DeepSeek Harness `0.1.1-rc.2` |
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
| `record.vad.enabled` / `silenceMs` / `energyThreshold` | `true` / `1500` / `0.01` | Detecção de atividade de voz: o silêncio encerra a gravação automaticamente (degrada para parada manual sem `AudioContext`) |
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
- **Compatibilidade do host** — o evento de sessão `dsh-talk/speech` é anexado sem a marca `ignorable`, porque nenhum host DSH publicado até `0.1.1-rc.2` permite que um plugin a defina. Hosts a partir de `0.1.0-rc.7` recusam carregar a frio um registo de sessão que contenha um tipo de evento desconhecido sem marca, por isso uma sessão que já falou pelo menos uma vez falha no seu próximo carregamento a frio com `SessionFormatUnsupportedError`. O registo fica intacto e é reparável (ver Limitações conhecidas). A correção prevista transporta a reprodução ao vivo por um push Remote em vez do registo de sessão e escreve o evento de registo apenas em hosts que o possam marcar como ignorável.
- **Falha ruidosa** — motores inválidos, valores fora de faixa e motores sem seu modelo/endpoint obrigatório falham ao montar.

## Limitações conhecidas

- **Suporte de navegador**: Web Speech e MediaRecorder são detectados por capacidade; sem eles o botão desativa e os motores do host (FunASR/whisper.cpp) podem transcrever quando configurados.
- **Motores locais são instalação sua**: os executáveis e modelos de `edge-tts`, `piper` e `whisper.cpp` devem ser instalados à parte.
- **Formato de gravação**: o navegador grava com seu codec nativo do MediaRecorder; o whisper.cpp pode exigir um gravador WAV ou conversão no servidor.
- **Configurações aplicam ao recarregar**: a aba anexa ao patch do perfil; um reload do perfil (ou reinício da web) ativa as mudanças.
- **A sessão não carrega a frio depois de falar**: em hosts `0.1.0-rc.7` ou mais recentes, o próximo carregamento a frio de uma sessão falha com `SessionFormatUnsupportedError` quando o seu registo contém eventos `dsh-talk/speech` sem marca. Reparação: pare o host, faça cópia do registo `.jsonl` da sessão, acrescente `"ignorable":true` como membro de topo em cada linha JSON cujo `"type"` seja `"dsh-talk/speech"` (por exemplo, insira `"ignorable":true,` logo a seguir à `{` inicial) e reabra a sessão. Nada mais muda e nada se perde.

## Desenvolvimento

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra o checkout local do harness
pnpm run typecheck:ci  # tsc contra os tipos publicados 0.1.1-rc.2 (sem paths)
pnpm test           # vitest: 59 testes, 10 suítes
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

Este projeto é um dos [33 plugins de DeepSeek Harness](https://github.com/PerryLink) mantidos por [PerryLink](https://github.com/PerryLink). Se este ajuda você, os outros provavelmente também:

| Plugin | One-liner |
|---|---|
| **[dsh-dsh-auto-review](https://github.com/PerryLink/dsh-dsh-auto-review)** | Auto-revisão de segundo modelo na cadeia de aprovação, com falha fechada por padrão | |
| **[dsh-dsh-background-agents](https://github.com/PerryLink/dsh-dsh-background-agents)** | Agentes filhos em segundo plano duráveis com barra lateral de UI web, mensagens e interrupção | |
| **[dsh-dsh-budget](https://github.com/PerryLink/dsh-dsh-budget)** | Governança de custos para DeepSeek Harness: orçamentos, carbono e latência em um painel. | |
| **[dsh-dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-dsh-checkpoint-rewind)** | Equivalente ao /rewind do Claude Code: instantâneos, bifurcações de sessão, restauração de uso único | |
| **[dsh-dsh-claude-move](https://github.com/PerryLink/dsh-dsh-claude-move)** | Migre sessões, memória, habilidades e CLAUDE.md do Claude Code para o DSH | |
| **[dsh-dsh-click](https://github.com/PerryLink/dsh-dsh-click)** | Controle de desktop nativo multiplataforma para DeepSeek Harness — Windows primeiro. | |
| **[dsh-dsh-composer-history](https://github.com/PerryLink/dsh-dsh-composer-history)** | Histórico de entrada estilo terminal para o compositor web: setas, busca Ctrl+R | |
| **[dsh-dsh-data-quality](https://github.com/PerryLink/dsh-dsh-data-quality)** | Verificações de qualidade de datasets e verificação de citações (a ponte numérica opcional consumida aqui) | |
| **[dsh-dsh-defend](https://github.com/PerryLink/dsh-dsh-defend)** | Defesa contra injeção de prompt, jailbreak e vazamento de segredos para DeepSeek Harness. | |
| **[dsh-dsh-doublecheck](https://github.com/PerryLink/dsh-dsh-doublecheck)** | Guardião de disciplina de engenharia: sabatina de requisitos, portões de teste, revisão adversária | |
| **[dsh-dsh-draw](https://github.com/PerryLink/dsh-dsh-draw)** | Roteamento unificado de geração de imagens estáticas para DeepSeek Harness. | |
| **[dsh-dsh-fast](https://github.com/PerryLink/dsh-dsh-fast)** | Diagnóstico de desempenho só de leitura para DeepSeek Harness. | |
| **[dsh-dsh-fund-research](https://github.com/PerryLink/dsh-dsh-fund-research)** | Relatórios de pesquisa deterministas para fundos mútuos públicos chineses | |
| **[dsh-dsh-github](https://github.com/PerryLink/dsh-dsh-github)** | Integração de PR/issues do GitHub para o DSH, cada escrita controlada por aprovação | |
| **[dsh-dsh-industry-research](https://github.com/PerryLink/dsh-dsh-industry-research)** | Orquestração de pesquisa setorial que sela as suas entregas através do `ctx.researchReport.assemble` deste plugin | |
| **[dsh-dsh-library](https://github.com/PerryLink/dsh-dsh-library)** | Base de conhecimento documental local para DeepSeek Harness. | |
| **[dsh-dsh-local-ai](https://github.com/PerryLink/dsh-dsh-local-ai)** | Integração de modelos locais (Ollama) para DeepSeek Harness. | |
| **[dsh-dsh-lsp-actions](https://github.com/PerryLink/dsh-dsh-lsp-actions)** | Diagnósticos, formatação, autocompletar, ações de código e renomeação LSP sobre servidores de linguagem | |
| **[dsh-dsh-mask](https://github.com/PerryLink/dsh-dsh-mask)** | Middleware de mascaramento de PII: anonimiza no limite do modelo, restaura na camada de exibição | |
| **[dsh-dsh-mcp-panel](https://github.com/PerryLink/dsh-dsh-mcp-panel)** | Painel de tempo de execução MCP somente leitura: comando /mcp + aba Settings com status, ferramentas e erros | |
| **[dsh-dsh-memento](https://github.com/PerryLink/dsh-dsh-memento)** | Memória entre sessões controlada por aprovação: costura ctx.memory + SQLite + ferramenta de memória | |
| **[dsh-dsh-observe](https://github.com/PerryLink/dsh-dsh-observe)** | Exportador de observabilidade OpenTelemetry e Langfuse para DeepSeek Harness. | |
| **[dsh-dsh-output-styles](https://github.com/PerryLink/dsh-dsh-output-styles)** | Troca de estilo em tempo de execução equivalente ao outputStyles do Claude Code | |
| **[dsh-dsh-permission-rules](https://github.com/PerryLink/dsh-dsh-permission-rules)** | Regras de permissão declarativas allow/deny/ask estilo Claude Code com auditoria | |
| **[dsh-dsh-plugin-guide](https://github.com/PerryLink/dsh-dsh-plugin-guide)** | Base de conhecimento de desenvolvimento de plugins como habilidade de agente sob demanda | |
| **[dsh-dsh-research-report](https://github.com/PerryLink/dsh-dsh-research-report)** | Motor de relatórios de pesquisa verificáveis com evidência endereçada por conteúdo | |
| **[dsh-dsh-score](https://github.com/PerryLink/dsh-dsh-score)** | Pontuação de qualidade multidimensional para plugins de DeepSeek Harness. | |
| **[dsh-dsh-session-pin](https://github.com/PerryLink/dsh-dsh-session-pin)** | Fixe sessões na barra lateral web com ordenação durável | |
| **[dsh-dsh-session-sync](https://github.com/PerryLink/dsh-dsh-session-sync)** | Sincronização de sessões entre dispositivos para DeepSeek Harness — um espelho git dedicado do seu armazenamento de sessões. | |
| **[dsh-dsh-skill-pack-security](https://github.com/PerryLink/dsh-dsh-skill-pack-security)** | Pacote de habilidades de auditoria de segurança: varredura de segredos, revisão de dependências e cadeia de suprimentos | |
| **[dsh-dsh-test-drive](https://github.com/PerryLink/dsh-dsh-test-drive)** | Test drives isolados de instalação e smoke para plugins de DeepSeek Harness. | |
| **[dsh-dsh-translate](https://github.com/PerryLink/dsh-dsh-translate)** | Tradução de parâmetros entre fornecedores e reparo determinístico de JSON para DeepSeek Harness. | |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-talk contributors
