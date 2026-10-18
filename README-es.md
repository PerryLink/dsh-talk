<div align="center">

# 🎙️ dsh-talk
- **Canal 1024 store**: `npm i -g dsh1024` una vez, luego `dsh1024 plugin --profile web add dsh-talk` (cuenta para el ranking de instalaciones de [deepseek1024.com](https://deepseek1024.com)).

**Bucle de sesión con voz primero para DeepSeek Harness: háblale y escucha su respuesta.**

*Pulsa el micrófono, habla y la respuesta se lee en voz alta — hablar interrumpe.*

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
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-talk?metric=downloads&lang=es)](https://dshfind.com/es/plugins/PerryLink/dsh-talk?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-talk
```


</div>

---


**📖 Base de conocimiento del ecosistema** — datos medidos, no marketing: [guía de desarrollo · datos de selección · criterios de mantenimiento](https://perrylink.github.io/dsh-plugin-guide/).

<!-- star-cta -->
## Instalación y desinstalación

- **Canal git** (último `main`): `dsh plugin --profile web add github:PerryLink/dsh-talk` — el script `prepare` compila solo con dependencias de producción.
- **Canal npm** (versiones publicadas): `dsh plugin --profile web add dsh-talk`.
- **Canal tarball**: `pnpm pack` en este repositorio y luego `dsh plugin --profile web add ./dsh-talk-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-talk` (o elimina la fila del parche del perfil).

> Si pnpm informa `ERR_PNPM_IGNORED_BUILDS` para este paquete (la validación inofensiva del binario de esbuild), añade `allowBuilds: { esbuild: true }` a tu `pnpm-workspace.yaml` — el CLI `dsh` imprime el fragmento exacto.

## ⭐ 如果它帮到了你

Este plugin forma parte de la [familia de plugins DSH](https://github.com/PerryLink) (más de 40, todos Apache-2.0). Si te resulta útil, **dale una estrella**: no desbloquea nada, pero ayuda a que la siguiente persona lo encuentre antes.

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## What is dsh-talk?

Bucle de sesión con voz primero para DeepSeek Harness: háblale y escucha su respuesta.

Pulsa el micrófono, habla y la respuesta se lee en voz alta — hablar interrumpe.

![Demostración de terminal de dsh-talk: dsh-talk — install, verify the row, then talk to the session](https://raw.githubusercontent.com/PerryLink/dsh-talk/main/docs/assets/dsh-talk-hero.png)

![Animated terminal demo of dsh-talk](https://raw.githubusercontent.com/PerryLink/dsh-talk/main/docs/assets/dsh-talk-demo.gif)

*La misma ejecución, animada.*

## Compatibilidad

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1` (adaptado el 2026-09-24: tercera cláusula de peers + `engines.dsh` + `manifestVersion: 1`, y el workflow Compat mensual anclado a esa línea); cadena completa de gates en verde el 2026-09-24 (dos reglas de typecheck, 86 tests, build, self-contained, artifacts, pack). Línea npm de desarrollo/test `0.1.7-rc.2`, peers `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-0 <0.2.0 || >=0.1.7-0 <0.2.0`. |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Navegador | Web Speech + MediaRecorder (mejor en Chrome/Edge); motores de transcripción/TTS del host para el resto |

## Qué obtienes

`dsh-talk` cierra el bucle de voz en ambos sentidos:

- **Herramienta `speak`** — el agente lee sus respuestas en voz alta. Motores TTS: voz del navegador, `edge-tts` (voces neuronales en red) o `piper` (local). El audio se reproduce en el navegador; con un motor local también se escribe en un archivo y el resultado de la herramienta lleva su ruta absoluta (`audioPath`) para que otros herramientas la consuman; en los hosts que pueden transportarlo, el registro de sesión guarda la locución saneada (ver Límites de seguridad).
- **Botón de micrófono** — pulsa, habla y la transcripción aterriza en la caja de entrada (o se envía directamente). Motores STT: Web Speech del navegador (con resultados intermedios), un servidor HTTP FunASR o `whisper.cpp` local.
- **Hablar interrumpe** — empezar a hablar detiene la reproducción (canal client→host sobre el espacio `talk`).
- **Anuncios de eventos** — fin de turno, aprobaciones pendientes (seguro en cascada: nunca bloquea la puerta) y errores, con interruptor de silencio y frases configurables.
- **Pestaña de ajustes** — selección de motor/idioma e interruptores de anuncios, guardados como operaciones append-only del parche de perfil con copias de seguridad.

## Inicio rápido

```sh
dsh plugin --profile web add github:PerryLink/dsh-talk
```

```sh
# 1. instala el bundle en tu perfil
dsh plugin --profile web add github:PerryLink/dsh-talk

# o desde npm (versiones publicadas)
dsh plugin --profile web add dsh-talk

# 2. reinicia y verifica la fila
dsh --profile web --dump-config | grep -A2 'id: talk'
```

Luego pulsa el micrófono junto al compositor y habla; o pide al agente que hable:

```
> Di "hola" con la herramienta speak.
```

## Configuración

Todos los ajustes son campos `Config` de Schemastery (modificables desde cordis.yml). `cordis.patch.yml` documenta cada clave.

| Clave | Por defecto | Significado |
|---|---|---|
| `record.enabled` | `true` | Mostrar el botón de micrófono del compositor |
| `record.hotkey` | *(ninguna)* | Atajo opcional, p. ej. `"alt+r"` |
| `record.maxSeconds` | `60` | Límite de grabación en segundos (1..600) |
| `record.autoSubmit` | `false` | Enviar la transcripción como mensaje del usuario (false = rellenar el borrador) |
| `record.vad.enabled` / `silenceMs` / `energyThreshold` | `true` / `1500` / `0.01` | Detección de actividad de voz: el silencio termina la grabación automáticamente (degrada a parada manual sin `AudioContext`) |
| `stt.engine` | `auto` | `auto` / `web` / `funasr` / `whisper`; auto prefiere un motor local configurado, luego Web Speech |
| `stt.language` | `auto` | Idioma BCP-47 o `auto` |
| `stt.interim` | `true` | Mostrar transcripciones intermedias (Web Speech) |
| `stt.silenceFinaliseMs` | `4000` | Detener Web Speech continuo tras estos milisegundos sin voz (500..15000) |
| `stt.funasr.url` | *(ninguna)* | Endpoint de inferencia FunASR; obligatorio con el motor `funasr` |
| `stt.whisper.modelPath` | *(ninguna)* | Modelo whisper.cpp; obligatorio con el motor `whisper` |
| `tts.engine` | `auto` | `auto` / `browser` / `edge-tts` / `piper`; auto prefiere piper, luego edge-tts, luego la voz del navegador |
| `tts.rate` | `0` | Desplazamiento de velocidad en porcentaje (-50..50) para edge-tts/piper |
| `tts.fallbackToBrowser` | `true` | Caer a la voz del navegador cuando falla un motor local |
| `tts.browser.voiceName` | *(ninguna)* | Nombre de voz preferido del navegador; si no existe se usa la voz predeterminada |
| `tts.browser.rate` | `1` | Velocidad de SpeechSynthesis del navegador (0.1..10) |
| `tts.browser.pitch` | `1` | Tono de SpeechSynthesis del navegador (0..2) |
| `tts.piper.modelPath` | *(ninguna)* | Modelo de voz piper; obligatorio con el motor `piper` |
| `tts.export.enabled` | `true` | Escribir el audio sintetizado localmente en un archivo y devolver su ruta como `audioPath` |
| `tts.export.dir` | `<home>/.dsh-talk/audio` | Directorio de exportación; `~` = home, una ruta relativa se resuelve bajo home (nunca el workspace) |
| `tts.export.maxFiles` | `20` | Archivos conservados en el directorio, contando el recién escrito (1..1000) |
| `tts.export.maxAgeMinutes` | `1440` | Los archivos exportados más antiguos que estos minutos se purgan en la siguiente escritura (1..10080) |
| `announce.enabled` | `true` | Interruptor maestro de anuncios |
| `announce.onTurnEnd` / `onApproval` / `onError` | `true` | Qué eventos se anuncian |
| `announce.messages.*` | *"Turn complete." etc.* | Frases habladas |
| `interrupt` | `true` | Hablar detiene la reproducción actual |
| `maxSpeakChars` | `20000` | Límite del texto de la herramienta speak (1..100000) |
| `maxAudioCacheBytes` | `8388608` | Límite de la caché de audio en memoria (1 MiB..64 MiB) |

`stt.silenceFinaliseMs` y `record.vad.silenceMs` son mecanismos distintos: el primero finaliza la transcripción de Web Speech cuando el reconocimiento continuo deja de oír voz; el segundo es el detector por energía de MediaRecorder que termina la grabación (y la envía cuando `record.autoSubmit` está activo). Funcionan en canalizaciones diferentes y no comparten estado.

### Exportación a archivo de audio

Cada locución sintetizada por un motor local (`edge-tts`, `piper`) se escribe en un archivo **además** de entrar en la caché en memoria desde la que reproduce el navegador. El motor del navegador sintetiza en el cliente y por tanto no exporta nada: ese estado se **reporta explícitamente**, nunca en silencio.

- **Dónde**: `tts.export.dir`, por defecto `<home>/.dsh-talk/audio` — el directorio propio del plugin. Deliberadamente no es nunca el directorio de trabajo del host, así que jamás contamina un repositorio; una `tts.export.dir` relativa se resuelve bajo el directorio home por el mismo motivo.
- **Nombres**: `speech-<YYYYMMDD>T<HHMMSS>Z-<8 hex>.mp3` (edge-tts) o `.wav` (piper). La marca es UTC, así que los nombres ordenan cronológicamente, y el token procede del id de locución, de modo que un archivo se remonta a su entrada `dsh-talk/speech`. El texto hablado nunca forma parte del nombre.
- **Limpieza**: acotada en cada escritura, primero por edad y después por cantidad. Se eliminan los archivos anteriores a `tts.export.maxAgeMinutes` (por defecto 1440 = 24 h) y luego los más antiguos hasta que el directorio no supere `tts.export.maxFiles` (por defecto 20, contando el recién escrito). La purga solo elimina nombres que coinciden con el patrón `speech-…` de este plugin, así que nunca toca otros archivos de un directorio compartido. Con los valores por defecto el directorio guarda como máximo 20 archivos (unos pocos MB) y nada de más de un día.
- **Fallo**: exportar es un añadido a la locución, nunca una condición previa. Si el directorio no se puede crear o escribir, la locución suena igual y el resultado reporta `audioExport: "failed"` con el motivo; los fallos de purga se ignoran y se reintentan en la siguiente escritura.
- **Ruta visible para el modelo**: el valor canónico de la herramienta `speak` lleva `audioPath` (más `audioExport` y, cuando no hay archivo, `exportNote`), y la misma ruta aparece en el texto renderizado — así el agente puede pasarla directamente a otra herramienta que tome un archivo, por ejemplo el argumento de archivo de un plugin de mensajería. Los anuncios de eventos (fin de turno, aprobación, error) se sintetizan por la misma canalización y se exportan igual, con los mismos límites.
- **Entregar el archivo a otro plugin**: un consumidor que solo acepta archivos dentro de su propio espacio de trabajo — `send_wechat` de `dsh-wechat` rechaza un `file_path` fuera del workspace de la sesión llamante salvo que su propio ajuste `allowAnyFilePath` esté activo — rechazará una ruta bajo tu directorio home. Para ese flujo, apunta `tts.export.dir` a un directorio dentro de ese workspace (por ejemplo `<workspace>/.dsh-talk-audio`); el valor por defecto se queda fuera de todo repositorio a propósito.

## Herramientas y superficies

| Superficie | Tipo | Notas |
|---|---|---|
| `speak` | herramienta | Lee texto en voz alta (browser/edge-tts/piper); overrides de motor/voz por llamada; resultado JSON canónico |
| botón de micrófono | slot `conversation.input.left` | Grabar → transcribir → rellenar borrador (o enviar); hablar interrumpe al pulsar |
| pestaña de ajustes | `settings.plugins.tab` (id `talk`) | Motores/idioma/anuncios; guardado append-only |
| `talk:*` | Typert Remote | `status`, `audio`, `transcribe`, `applySettings`, `interrupt` (espacio del host) |

## Permisos y datos

- **Permisos**: el plugin mantiene una caché de audio en memoria con límite de bytes para la reproducción y, con motores locales, escribe el audio sintetizado en su propio directorio acotado (`tts.export.*`, por defecto `<home>/.dsh-talk/audio`, como máximo 20 archivos y 24 h por defecto); el permiso de micrófono lo gestiona el navegador. La pestaña de ajustes solo añade fragmentos al parche del perfil con copia de seguridad — nunca reescribe el archivo.
- **Datos**: los bytes de audio nunca entran en el contexto del modelo ni en el registro de sesión. Donde el vocabulario de sesión del host lo acepta, el evento `dsh-talk/speech` lleva el id de locución, motor, razón, tamaño, texto saneado y, cuando corresponde, voz, velocidad y tono del navegador; en hosts sin envoltura el evento no se escribe en absoluto. El resultado de la herramienta `speak` lleva la ruta del archivo exportado (un artefacto persistente en el directorio propio del plugin), y todo lo demás en una superficie de visualización/registro pasa por los ayudantes de redacción, así que credenciales, JWT, cabeceras bearer y rutas temporales quedan fuera.
- **Red**: solo se contactan los motores que configures. `edge-tts` realiza síntesis de red, FunASR usa su endpoint configurado y `webkitSpeechRecognition` de Chrome envía el audio del micrófono a los servidores de Google para transcribirlo; la reproducción de `speechSynthesis` del navegador permanece local.

## Límites de seguridad

- **Visible para el modelo ⟺ registrado** — el modelo solo ve el valor canónico y el texto renderizado de la herramienta speak. El evento `dsh-talk/speech` se añade solo cuando el host puede transportarlo (ver Compatibilidad del host); los eventos `tool/call` + `tool/result` siguen siendo siempre el rastro reconstruible.
- **Los anuncios de aprobación nunca bloquean** — el listener de `approval/request` siempre llama a `next()`.
- **Salida saneada** — credenciales y rutas temporales de audio nunca llegan a registros ni pantallas. La única excepción deliberada es la ruta del audio exportado en el resultado de speak: es un archivo persistente en el directorio propio del plugin (aun así pasa por el redactor de secretos) y existe precisamente para entregarlo a otra herramienta.
- **Compatibilidad del host** — el evento `dsh-talk/speech` se añade por una compuerta de sí/no. Los hosts cuyo vocabulario de tipos conocidos cubre el evento lo añaden y la llamada lo reporta; cualquier otro host — toda línea publicada hasta `0.1.1-rc.2`, la línea `0.1.2-alpha`, `0.1.2-rc.1`, y también `0.1.6-alpha.2`, cuyo `Session.append` solo puede estampar el surface intent y no la envoltura `ignorable` (ese campo se conserva solo para compatibilidad de lectura) — no recibe ningún append, así que la voz nunca contamina el registro de sesión allí. El salto ya no es silencioso: el host mantiene contadores de añadidos/omitidos por sesión y `talk/latest(sessionId)` los devuelve; la lista de reproducción de la sesión en el cliente queda vacía y los resultados de la herramienta speak siguen siendo el rastro reconstruible.
- **Fallo ruidoso** — motores inválidos, valores fuera de rango y motores sin su modelo/endpoint requerido fallan al montar.

## Limitaciones conocidas

- **Soporte de navegador**: Web Speech y MediaRecorder se detectan por capacidades; sin ellos el botón se desactiva y los motores del host (FunASR/whisper.cpp) pueden transcribir si están configurados.
- **Los motores locales se instalan aparte**: los ejecutables y modelos de `edge-tts`, `piper` y `whisper.cpp` deben instalarse por separado.
- **Los archivos de audio requieren un motor local**: la voz del navegador sintetiza en el cliente, así que allí `speak` no devuelve `audioPath` (el resultado lo dice explícitamente), y un motor local que falla y cae al navegador tampoco deja archivo. Los archivos exportados viven en el directorio acotado del propio plugin — ver Exportación a archivo de audio para ubicación, nombres y limpieza.
- **Formato de grabación**: el navegador graba con su códec nativo de MediaRecorder; whisper.cpp puede requerir una grabadora WAV o una conversión en el servidor.
- **Los ajustes aplican al recargar**: la pestaña añade al parche del perfil; una recarga del perfil (o reinicio de la web) activa los cambios.
- **El historial de reproducción en vivo queda vacío en hosts sin ese vocabulario**: en `0.1.1-rc.2`, la línea `0.1.2-alpha`, `0.1.2-rc.1` y `0.1.6-alpha.2` el vocabulario del host no conoce `dsh-talk/speech`, así que la compuerta no escribe nada y la lista de reproducción de la sesión en el cliente queda vacía; `talk/latest(sessionId)` sigue respondiendo con la última locución y el contador de omitidos. La voz en sí, el micrófono, la pestaña de ajustes y la herramienta no se ven afectados.
- **Los registros antiguos escritos por dsh-talk ≤ 0.2.1 pueden requerir reparación antes de cargar en frío**: las versiones hasta `0.2.1` añadían eventos `dsh-talk/speech` sin marcar. En hosts `0.1.0-rc.7` o posteriores, una sesión cuyo registro ya los contiene falla en su siguiente carga en frío con `SessionFormatUnsupportedError`. Reparación: detén el host, haz una copia del registro `.jsonl` de la sesión, añade `"ignorable":true` como miembro de primer nivel en cada línea JSON cuyo `"type"` sea `"dsh-talk/speech"` (por ejemplo, inserta `"ignorable":true,` justo después de la `{` inicial) y vuelve a abrir la sesión. Nada más cambia y no se pierde nada; los appends nuevos de esta versión nunca añaden eventos sin marcar.

## Desarrollo

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra el checkout local del harness
pnpm run typecheck:ci  # tsc contra los tipos publicados 0.1.7-alpha.2 (sin paths)
pnpm test           # vitest: 108 tests, 16 suites
pnpm run build      # declaraciones tsc + bundles tsdown (lib/)
pnpm run verify:self-contained  # las specs de dependencias resuelven desde el registry
pnpm run verify:artifacts       # caras ESM construidas + handshake ModuleLoader del cliente
pnpm pack           # el tarball publicado
```

## Interoperabilidad con otros plugins de DSH

Verificado contra **DSH `0.2.0-rc.2`** (el runtime para el que se publica este README) y el conjunto de plugins con más estrellas sondeado el 2026-10-05.

Este plugin **no interfiere** con otros plugins, incluidos los de más estrellas:

- **Sin colisión de nombres de herramienta.** Todas las herramientas llevan espacio de nombres; ninguna ocupa un nombre desnudo ya perteneciente a una herramienta incluida u otro plugin.
- **Sin colisión de clave de servicio.** Solo provee `talk`; esa clave no es una costura incluida ni la provee ningún plugin de más estrellas.
- **Sin colisión de slot.** No registra ninguna clave de slot de cliente, así que no disputa un asiento `shadows-shipped-ui`.
- **Sin colisión de ruta HTTP.** No registra ningún prefijo `webServer`.
- **Sin colisión en la capa de patch.** El patch del bundle solo hace `insert` de su propia fila; nunca sobrescribe el `config` de una fila incluida.
- **Sin mutación global.** No parchea prototipos, ni reescribe `process.env`, ni reemplaza el dispatcher global de fetch.

**Los listeners de eventos compartidos no interfieren por construcción.** Observa los eventos sensibles al orden `approval/request` con `ctx.on()` — el registro de difusión de Cordis, donde cada listener se ejecuta y ninguno puede dejar sin turno a otro. **Todos los listeners aquí delegan por `next()`**, así que la cadena nunca se cortocircuita:

Evidencia estática: `dsh-plugin-doctor` K10–K13 dan `pass` en todas las comprobaciones de este repositorio.

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `voice`, `speech`, `tts`, `stt`, `speech-to-text`, `text-to-speech`, `microphone`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creador y mantenedor: pipeline de voz, motores de habla, grabadora de micrófono, anuncios de eventos, unidad de proyección y la documentación en cinco idiomas.

## PerryLink DSH Plugin Family

Este proyecto es uno de los **87 plugins activamente mantenidos** de DeepSeek Harness de [PerryLink](https://github.com/PerryLink). El registro familiar tiene **95** plugins — **5 congelados**, **3 retirados** — y permanece plegado abajo para que cada README conserve una primera pantalla corta. Expándelo para ver cada fila, con el motivo en la columna Estado.

<details>
<summary>Expandir los 95 plugins</summary>

| Plugin | Una línea | Estado |
|---|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | 水产养殖投入品记录核对（按投入品用量、休药期与起捕间隔核对记录自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | 档案归档完整性与保管期限核对（依据《档案法》及配套规定，仅提示差异，不作出定性结论） |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command |  |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | 🚫 RETIRADO — ver el README del repositorio |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | 投标文件符合性预检（按招标文件逐条核对响应情况，仅提示差异，不作出定性结论） |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | 投标人资格条件核对（按资格条件与证明材料核对逐条响应，仅提示差异，不作出定性结论） |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |  |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | 合同条款立场台账核对（按立场、风险等级与退让底线核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | 报关单证一致性核对（按公开的报关单填制规范核对单证间字段一致性，仅提示差异，不作出定性结论） |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) |  |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | 滞箱费台账核对（按免箱期与费率核对超期天数与金额的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review |  |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | 🧊 CONGELADO — ver el README del repositorio |
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
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | 维修工单结算核对（按项目金额、配件工时合计与结算总额核对算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | 审稿意见逐条回应覆盖核对（按意见与回应一一对应核对覆盖完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | 规则库文件自检核对（按条款引用纪律与效力上限核对规则库自身合规，仅提示差异，不作出定性结论） |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | 安全技术交底记录要素齐备性与签字闭环核对（依据公开的安全生产法规与检查标准，仅提示差异，不作出定性结论） |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. |  |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | 🚫 RETIRADO — ver el README del repositorio |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | 监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | 三重一大决策台账核对（按前置研究、会议审议与决议记录核对程序留痕，仅提示差异，不作出定性结论） |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | 土壤与地下水监测台账核对（按点位、监测项目、限值与超标判定核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | 作业规程与 FMEA／控制计划一致性核对（按编号与版本核对三份文件是否同步，仅提示差异，不作出定性结论） |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | 控制图常数与过程能力指数核对（按 GB/T 4091 的常规控制图常数表核对控制限与 Cp/Cpk 的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |  |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | 🚫 RETIRADO — ver el README del repositorio |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** | 招标文件条款摘录核对（按出处与原文逐字核对摘录完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** | 评标因素评分矩阵核对（按分值上限与合计核对矩阵自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** | 质保期与索赔金额核对（按质保期月数与里程、索赔金额算式核对自洽，仅提示差异，不作出定性结论） |  |

</details>

</details>

</details>

## License

[Apache License 2.0](LICENSE) © 2026 dsh-talk contributors

### Instalar desde el mercado de DSH Desktop

Todos los plugins de PerryLink pueden explorarse en el mercado integrado de DSH Desktop: **Market → Sources → add source → pegar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ seleccionarlo**. La instalación sigue pasando por la verificación de identidad npm del mercado y tu confirmación.
