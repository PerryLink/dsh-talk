<div align="center">

# 🎙️ dsh-talk

**Bucle de sesión con voz primero para DeepSeek Harness: háblale y escucha su respuesta.**

*Pulsa el micrófono, habla y la respuesta se lee en voz alta — hablar interrumpe.*

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

## Compatibilidad

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6` |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Navegador | Web Speech + MediaRecorder (mejor en Chrome/Edge); motores de transcripción/TTS del host para el resto |

## Qué obtienes

`dsh-talk` cierra el bucle de voz en ambos sentidos:

- **Herramienta `speak`** — el agente lee sus respuestas en voz alta. Motores TTS: voz del navegador, `edge-tts` (voces neuronales en red) o `piper` (local). El audio se reproduce en el navegador; el registro de sesión guarda la locución saneada.
- **Botón de micrófono** — pulsa, habla y la transcripción aterriza en la caja de entrada (o se envía directamente). Motores STT: Web Speech del navegador (con resultados intermedios), un servidor HTTP FunASR o `whisper.cpp` local.
- **Hablar interrumpe** — empezar a hablar detiene la reproducción (canal client→host sobre el espacio `talk`).
- **Anuncios de eventos** — fin de turno, aprobaciones pendientes (seguro en cascada: nunca bloquea la puerta) y errores, con interruptor de silencio y frases configurables.
- **Pestaña de ajustes** — selección de motor/idioma e interruptores de anuncios, guardados como operaciones append-only del parche de perfil con copias de seguridad.

## Inicio rápido

```sh
# 1. instala el bundle en tu perfil
dsh plugin --profile web add "github:PerryLink/dsh-talk#main"

# o desde npm (versiones publicadas)
dsh plugin --profile web add dsh-talk

# 2. reinicia y verifica la fila
dsh --profile web --dump-config | grep -A2 'id: talk'
```

Luego pulsa el micrófono junto al compositor y habla; o pide al agente que hable:

```
> Di "hola" con la herramienta speak.
```

## Instalación y desinstalación

- **Canal git** (último `main`): `dsh plugin --profile web add "github:PerryLink/dsh-talk#main"` — el script `prepare` compila solo con dependencias de producción.
- **Canal npm** (versiones publicadas): `dsh plugin --profile web add dsh-talk`.
- **Canal tarball**: `pnpm pack` en este repositorio y luego `dsh plugin --profile web add ./dsh-talk-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-talk` (o elimina la fila del parche del perfil).

> Si pnpm informa `ERR_PNPM_IGNORED_BUILDS` para este paquete (la validación inofensiva del binario de esbuild), añade `allowBuilds: { esbuild: true }` a tu `pnpm-workspace.yaml` — el CLI `dsh` imprime el fragmento exacto.

## Configuración

Todos los ajustes son campos `Config` de Schemastery (modificables desde cordis.yml). `cordis.patch.yml` documenta cada clave.

| Clave | Por defecto | Significado |
|---|---|---|
| `record.enabled` | `true` | Mostrar el botón de micrófono del compositor |
| `record.hotkey` | *(ninguna)* | Atajo opcional, p. ej. `"alt+r"` |
| `record.maxSeconds` | `60` | Límite de grabación en segundos (1..600) |
| `record.autoSubmit` | `false` | Enviar la transcripción como mensaje del usuario (false = rellenar el borrador) |
| `stt.engine` | `auto` | `auto` / `web` / `funasr` / `whisper`; auto prefiere un motor local configurado, luego Web Speech |
| `stt.language` | `auto` | Idioma BCP-47 o `auto` |
| `stt.interim` | `true` | Mostrar transcripciones intermedias (Web Speech) |
| `stt.funasr.url` | *(ninguna)* | Endpoint de inferencia FunASR; obligatorio con el motor `funasr` |
| `stt.whisper.modelPath` | *(ninguna)* | Modelo whisper.cpp; obligatorio con el motor `whisper` |
| `tts.engine` | `auto` | `auto` / `browser` / `edge-tts` / `piper`; auto prefiere piper, luego edge-tts, luego la voz del navegador |
| `tts.rate` | `0` | Desplazamiento de velocidad en porcentaje (-50..50) para edge-tts/piper |
| `tts.fallbackToBrowser` | `true` | Caer a la voz del navegador cuando falla un motor local |
| `tts.piper.modelPath` | *(ninguna)* | Modelo de voz piper; obligatorio con el motor `piper` |
| `announce.enabled` | `true` | Interruptor maestro de anuncios |
| `announce.onTurnEnd` / `onApproval` / `onError` | `true` | Qué eventos se anuncian |
| `announce.messages.*` | *"Turn complete." etc.* | Frases habladas |
| `interrupt` | `true` | Hablar detiene la reproducción actual |
| `maxSpeakChars` | `20000` | Límite del texto de la herramienta speak (1..100000) |
| `maxAudioCacheBytes` | `8388608` | Límite de la caché de audio en memoria (1 MiB..64 MiB) |

## Herramientas y superficies

| Superficie | Tipo | Notas |
|---|---|---|
| `speak` | herramienta | Lee texto en voz alta (browser/edge-tts/piper); overrides de motor/voz por llamada; resultado JSON canónico |
| botón de micrófono | slot `conversation.input.left` | Grabar → transcribir → rellenar borrador (o enviar); hablar interrumpe al pulsar |
| pestaña de ajustes | `settings.plugins.tab` (id `talk`) | Motores/idioma/anuncios; guardado append-only |
| `talk:*` | Typert Remote | `status`, `audio`, `transcribe`, `applySettings`, `interrupt` (espacio del host) |

## Permisos y datos

- **Permisos**: el plugin solo guarda una caché de audio en memoria con límite de bytes; el permiso de micrófono lo gestiona el navegador. La pestaña de ajustes solo añade fragmentos al parche del perfil con copia de seguridad — nunca reescribe el archivo.
- **Datos**: el audio nunca entra en el contexto del modelo ni en el registro de sesión. El evento `dsh-talk/speech` lleva solo el id de locución, motor, razón, tamaño y texto saneado. Toda superficie de visualización/registro redacta credenciales, JWT, cabeceras bearer y rutas temporales.
- **Red**: solo se contactan los motores que configures (síntesis en red de edge-tts, un endpoint FunASR); la voz del navegador y Web Speech quedan en el dispositivo.

## Límites de seguridad

- **Visible para el modelo ⟺ registrado** — el modelo solo ve el valor canónico de la herramienta speak; cada locución es reconstruible desde el registro de sesión.
- **Los anuncios de aprobación nunca bloquean** — el listener de `approval/request` siempre llama a `next()`.
- **Salida saneada** — credenciales y rutas temporales de audio nunca llegan a registros ni pantallas.
- **Fallo ruidoso** — motores inválidos, valores fuera de rango y motores sin su modelo/endpoint requerido fallan al montar.

## Limitaciones conocidas

- **Soporte de navegador**: Web Speech y MediaRecorder se detectan por capacidades; sin ellos el botón se desactiva y los motores del host (FunASR/whisper.cpp) pueden transcribir si están configurados.
- **Los motores locales se instalan aparte**: los ejecutables y modelos de `edge-tts`, `piper` y `whisper.cpp` deben instalarse por separado.
- **Formato de grabación**: el navegador graba con su códec nativo de MediaRecorder; whisper.cpp puede requerir una grabadora WAV o una conversión en el servidor.
- **Los ajustes aplican al recargar**: la pestaña añade al parche del perfil; una recarga del perfil (o reinicio de la web) activa los cambios.

## Desarrollo

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra el checkout local del harness
pnpm run typecheck:ci  # tsc contra los tipos publicados 0.1.0-rc.6 (sin paths)
pnpm test           # vitest: 45 tests, 7 suites
pnpm run build      # declaraciones tsc + bundles tsdown (lib/)
pnpm run verify:self-contained  # las specs de dependencias resuelven desde el registry
pnpm run verify:artifacts       # caras ESM construidas + handshake ModuleLoader del cliente
pnpm pack           # el tarball publicado
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `voice`, `speech`, `tts`, `stt`, `speech-to-text`, `text-to-speech`, `microphone`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creador y mantenedor: pipeline de voz, motores de habla, grabadora de micrófono, anuncios de eventos, unidad de proyección y la documentación en cinco idiomas.

## License

[Apache License 2.0](LICENSE) © 2026 dsh-talk contributors
