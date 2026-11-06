#!/usr/bin/env python3
"""README visuals for dsh-talk: hero banner + two-way voice-loop structure map.

Everything below is derived from this repository's runtime, not from the prose.

  * IN channel — `src/client/TalkMicButton.tsx`: pressing the composer mic
    (slot `conversation.input.left`, id `talk-mic`) first calls
    `talk/interrupt` (speak-to-interrupt), then records with MediaRecorder;
    `src/client/vad.ts` ends the take on `record.vad.silenceMs` of sub-threshold
    RMS (`energyThreshold`), and the 500 ms tick re-checks `record.maxSeconds`.
    The take becomes base64 WAV and is transcribed either by the browser's Web
    Speech, or on the host through `talk/transcribe`, where
    `resolveSttEngine` (`src/service.ts`) resolves `auto` as FunASR (a
    configured `stt.funasr.url`) → whisper.cpp (a configured
    `stt.whisper.modelPath`) → Web Speech. The transcript returns to the
    composer as a draft, or goes straight out as a user message when
    `record.autoSubmit` is true.
  * Turn hinge — the agent loop is the host's; the plugin only sits on its
    edges: the draft becomes the turn's user message, and the agent can call
    the `speak` tool.
  * OUT channel — `src/service.ts` `speak()`: sanitize + cap
    (`maxSpeakChars`), pre-empt the previous utterance, resolve the TTS engine
    (`tool override | tts.engine`; `auto` = piper when `tts.piper.modelPath`
    is set → edge-tts → browser voice), synthesize locally through the
    `src/engine.ts` subprocesses, cache under `maxAudioCacheBytes`, export to
    `~/.dsh-talk/audio` as `speech-<stamp>-<token>.<ext>` (age-first, then
    count pruning), and append the `dsh-talk/speech` event through the
    adaptive gate in `src/speech.ts`; the `talk:speech` projection carries it
    to the browser, which speaks browser-engine utterances through
    `speechSynthesis` and plays every other engine from `talk/audio` bytes.
    A local engine failure falls back to the browser voice
    (`tts.fallbackToBrowser`); the browser engine has no host bytes, so
    `audioExport` reports `unsupported` instead of a silent no-file.
  * Announcements — `src/index.ts` listens to `agent/status` (running → idle =
    turn end), `agent/error`, and the `approval/request` waterfall that always
    calls `next()` and never blocks the gate on speech; all three feed the
    same `speak()` path, muted by `announce.*`.
  * Settings — the tab posts `talk/applySettings`, which validates the merged
    row and appends it to the profile patch layer with a timestamped backup;
    the change applies on reload.

Hero: the loop as the user meets it — the take on top (mic + waveform →
transcript), the turn hinge in the middle (composer → agent turn → speak), and
the answer below (text → playback) with the persistent audio file, the export
caps and the speak-to-interrupt promise. Deliberately not the structure map.

Flow (docs/assets/…-flow-v5-*.svg): a two-way loop across one browser / host
seam — IN on top, the turn hinge bridging the seam, OUT below, mirror engine
ladders in the host column, and interrupt as the loop's left edge. Not a row
of five boxes.

Fonts: Microsoft YaHei (msyh.ttc / msyhbd.ttc) for CJK, Consolas for mono,
Segoe UI for the Latin copy. Mono copy sticks to arrows and separators the
Consolas face actually carries (→ · ≤), so no glyph renders as tofu.

Run:  python scripts/gen-readme-assets.py
"""
from __future__ import annotations

import os
from html import escape

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

FONT_CJK = r"C:\Windows\Fonts\msyh.ttc"
FONT_CJK_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"
FONT_MONO_BOLD = r"C:\Windows\Fonts\consolab.ttf"
FONT_EN = r"C:\Windows\Fonts\segoeui.ttf"
FONT_EN_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"

for _path in (FONT_CJK, FONT_CJK_BOLD, FONT_MONO, FONT_MONO_BOLD,
              FONT_EN, FONT_EN_BOLD):
    if not os.path.exists(_path):
        raise SystemExit(f"FATAL: font missing: {_path}")

KIND = {
    "cjk": FONT_CJK,
    "cjk_bold": FONT_CJK_BOLD,
    "mono": FONT_MONO,
    "mono_bold": FONT_MONO_BOLD,
    "en": FONT_EN,
    "en_bold": FONT_EN_BOLD,
}

# Family palette: accent #4B67B4 (dark #8496f5); page gradients
# #f9f6fd → #e4eaf8 and #131a2a → #0c1016; radius 18–22; soft shadows.
SKIN = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8",
        card="#ffffff", card_edge="#e5e0f2",
        text="#17151f", sub="#4c5160", faint="#8a8fa2",
        accent="#4B67B4", pill="#ece7f9", grid="#ece8f5",
        shadow=(38, 30, 68),
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016",
        card="#1b2231", card_edge="#2d364a",
        text="#eef2fa", sub="#a8b1c4", faint="#737d92",
        accent="#8496f5", pill="#242d42", grid="#242c3d",
        shadow=(0, 0, 0),
    ),
}


# ── small colour / font helpers ─────────────────────────────────────────────

def font(size: float, kind: str = "en_bold") -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(KIND[kind], int(round(size)))


def hx(value) -> tuple:
    if isinstance(value, tuple):
        return value[:3]
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def blend(a, b, t: float):
    """Paint colour a over base b at t (t = how much of a survives)."""
    pa, pb = hx(a), hx(b)
    return tuple(int(y * (1 - t) + x * t) for x, y in zip(pa, pb))


def tint(skin, color, t: float) -> tuple:
    return blend(color, skin["card"], t)


def gradient(w: int, h: int, c1: str, c2: str) -> Image.Image:
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    a, b = hx(c1), hx(c2)
    for y in range(h):
        t = 0.34 * (y / h) + 0.66 * (y / h) ** 1.55
        d.line([(0, y), (w, y)],
               fill=tuple(int(p + (q - p) * t) for p, q in zip(a, b)))
    return img


def glow(img: Image.Image, cx: int, cy: int, r: int, color, alpha: int):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(12, 0, -1):
        rr = r * i / 12
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  fill=color + (int(alpha * (1 - i / 13)),))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def soft_card(img: Image.Image, box, skin, radius=20, lift=10, strength=0.9,
              outline=None, width=2) -> Image.Image:
    x0, y0, x1, y1 = box
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([x0 + 1, y0 + lift, x1 + 1, y1 + lift + 3],
                         radius=radius,
                         fill=hx(skin["shadow"]) + (int(34 * strength),))
    base = Image.alpha_composite(img.convert("RGBA"),
                                 sh.filter(ImageFilter.GaussianBlur(14)))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=radius, fill=hx(skin["card"]),
                        outline=hx(outline or skin["card_edge"]), width=width)
    return base.convert("RGB")


def fit(d: ImageDraw.ImageDraw, text: str, maxw: float, start: int,
        kind: str, floor: int) -> ImageFont.FreeTypeFont:
    size = start
    while size > floor:
        f = font(size, kind)
        if d.textlength(text, font=f) <= maxw:
            return f
        size -= 1
    return font(floor, kind)


def chip(img: Image.Image, x: int, y: int, text: str, f, fg, bg,
         h: int = 26, padx: int = 12) -> int:
    d = ImageDraw.Draw(img)
    w = int(d.textlength(text, font=f)) + 2 * padx
    d.rounded_rectangle([x, y, x + w, y + h], radius=h // 2, fill=hx(bg))
    d.text((x + padx, y + h / 2 + 1), text, font=f, fill=hx(fg), anchor="lm")
    return w


# ── hero ────────────────────────────────────────────────────────────────────

HERO = {
    "zh": dict(
        kicker="DeepSeek Harness · 语音会话闭环",
        eyebrow="dsh-talk",
        title="开口即闭环",
        value=["说一句，文字落进输入框；", "回一句，声音从扬声器出来。"],
        sub="浏览器语音或本机引擎，一开口就停播",
        meta="FunASR / whisper.cpp / edge-tts / piper",
        foot="Apache-2.0 · github.com/PerryLink/dsh-talk",
        in_label="你的声音",
        in_sub="composer mic · Web Speech / FunASR / whisper.cpp",
        in_note="press → talk/interrupt",
        transcript_tag="transcript",
        transcript="把这次失败的原因讲清楚",
        turn_from="composer",
        turn_mid="agent turn",
        turn_to="speak()",
        turn_note="事件播报也走同一条 speak 管线：回合完成 · 待审批 · 出错",
        out_label="回答",
        out_sub="speak tool · piper / edge-tts / browser voice",
        out_tag="audioPath",
        answer="已定位：重试次数少了一次，已补上。",
        stop="一开口就停",
        files=["speech-<stamp>-<token>.mp3", "~/.dsh-talk/audio", "maxFiles 20"],
    ),
    "en": dict(
        kicker="DeepSeek Harness · voice-first session loop",
        eyebrow="dsh-talk",
        title="Voice loop.",
        value=["Speech becomes your prompt,", "answers come back out loud."],
        sub="browser voice or local engines",
        meta="FunASR / whisper.cpp / edge-tts / piper",
        foot="Apache-2.0 · github.com/PerryLink/dsh-talk",
        in_label="your voice",
        in_sub="composer mic · Web Speech / FunASR / whisper.cpp",
        in_note="press → talk/interrupt",
        transcript_tag="transcript",
        transcript="explain why the run failed",
        turn_from="composer",
        turn_mid="agent turn",
        turn_to="speak()",
        turn_note="announcements speak through the same pipeline: turn end · approval · error",
        out_label="the answer",
        out_sub="speak tool · piper / edge-tts / browser voice",
        out_tag="audioPath",
        answer="found it: one retry was dropped.",
        stop="your voice stops it",
        files=["speech-<stamp>-<token>.mp3", "~/.dsh-talk/audio", "maxFiles 20"],
    ),
}

W, H = 1440, 576
COL_X, COL_W = 72, 500
CARD_X0, CARD_X1 = 608, 1368


def mic_glyph(img: Image.Image, cx: int, cy: int, r: int, skin) -> None:
    """A microphone in a filled disc: capsule + pickup arc + stand."""
    d = ImageDraw.Draw(img)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=hx(skin["accent"]))
    body = hx(skin["card"])
    d.rounded_rectangle([cx - 6, cy - 15, cx + 6, cy + 3], radius=6, fill=body)
    d.arc([cx - 12, cy - 8, cx + 12, cy + 13], 0, 180, fill=body, width=3)
    d.line([(cx, cy + 13), (cx, cy + 19)], fill=body, width=3)
    d.line([(cx - 6, cy + 20), (cx + 6, cy + 20)], fill=body, width=3)


def speaker_glyph(d: ImageDraw.ImageDraw, x: int, cy: int, skin) -> None:
    col = hx(skin["accent"])
    d.polygon([(x, cy - 6), (x + 7, cy - 6), (x + 15, cy - 13),
               (x + 15, cy + 13), (x + 7, cy + 6), (x, cy + 6)], fill=col)
    d.arc([x + 11, cy - 11, x + 29, cy + 11], -58, 58, fill=col, width=2)
    d.arc([x + 11, cy - 17, x + 37, cy + 17], -46, 46, fill=col, width=2)


def wave(img: Image.Image, x0: int, cy: int, heights, width: int, gap: int,
         color, skin) -> int:
    d = ImageDraw.Draw(img)
    mid = (len(heights) - 1) / 2
    for index, hgt in enumerate(heights):
        x = x0 + index * (width + gap)
        fade = 0.42 + 0.58 * (1 - abs(index - mid) / (mid + 0.6))
        fill = blend(color, skin["card"], fade)
        d.rounded_rectangle([x, cy - hgt / 2, x + width, cy + hgt / 2],
                            radius=width // 2, fill=fill)
    return x0 + len(heights) * (width + gap) - gap


def hero(lang: str, skin: str) -> None:
    s = SKIN[skin]
    Hd = HERO[lang]
    zh = lang == "zh"
    light = skin == "light"
    cjk = "cjk" if zh else "en"
    cb = "cjk_bold" if zh else "en_bold"

    img = gradient(W, H, s["bg_from"], s["bg_to"])
    img = glow(img, 1180, 60, 430, hx(s["accent"]), 22 if light else 44)
    img = glow(img, 170, 596, 330, hx(s["accent"]), 8 if light else 14)
    d = ImageDraw.Draw(img)

    # seam between the copy and the loop composition
    d.line([(588, 62), (588, 520)], fill=hx(s["grid"]), width=2)

    # ── left column ────────────────────────────────────────────────────────
    fk = font(18, cb)
    kw = d.textlength(Hd["kicker"], font=fk)
    pill_x, pill_y, pill_h = COL_X, 54, 38
    assert pill_x + kw + 64 <= COL_X + COL_W, ("kicker overflows", lang, kw)
    d.rounded_rectangle([pill_x, pill_y, pill_x + kw + 64, pill_y + pill_h],
                        radius=pill_h // 2, fill=hx(s["pill"]))
    d.ellipse([pill_x + 14, pill_y + 10, pill_x + 32, pill_y + 28],
              fill=hx(s["accent"]))
    # three little sound bars inside the kicker dot
    for i, bh in enumerate((5, 9, 6)):
        bx = pill_x + 19 + i * 4
        d.rounded_rectangle([bx, pill_y + 19 - bh / 2, bx + 2,
                             pill_y + 19 + bh / 2], radius=1,
                            fill=hx(s["pill"]))
    d.text((pill_x + 44, pill_y + 8), Hd["kicker"], font=fk,
           fill=hx(s["accent"]))

    d.text((COL_X, 112), Hd["eyebrow"], font=font(26, "mono"),
           fill=hx(s["accent"]))

    f_title = fit(d, Hd["title"], COL_W, 84, cb, floor=80)
    assert f_title.size >= 79, (lang, f_title.size)
    d.text((COL_X, 156), Hd["title"], font=f_title, fill=hx(s["text"]))

    y = 272
    for line in Hd["value"]:
        f_v = fit(d, line, COL_W, 32, cb, floor=27)
        d.text((COL_X, y), line, font=f_v, fill=hx(s["text"]))
        y += 40

    f_sub = fit(d, Hd["sub"], COL_W, 25, cjk, floor=23)
    assert d.textlength(Hd["sub"], font=f_sub) <= COL_W, Hd["sub"]
    d.text((COL_X, 366), Hd["sub"], font=f_sub, fill=hx(s["sub"]))

    f_meta = fit(d, Hd["meta"], COL_W, 20, "mono", floor=19)
    assert d.textlength(Hd["meta"], font=f_meta) <= COL_W, Hd["meta"]
    d.text((COL_X, 406), Hd["meta"], font=f_meta, fill=hx(s["faint"]))
    d.line([COL_X, 448, COL_X + COL_W, 448], fill=hx(s["grid"]), width=2)

    f_foot = font(16, "mono")
    assert d.textlength(Hd["foot"], font=f_foot) <= COL_W, "footer overflows"
    d.text((COL_X, 458), Hd["foot"], font=f_foot, fill=hx(s["faint"]))

    # ── right: the take (voice → transcript) ──────────────────────────────
    img = soft_card(img, (CARD_X0, 40, CARD_X1, 250), s, radius=20, lift=10,
                    strength=0.9)
    d = ImageDraw.Draw(img)
    d.text((CARD_X0 + 24, 58), Hd["in_label"], font=font(17, cb),
           fill=hx(s["text"]))
    d.text((CARD_X1 - 24, 62), "stt.engine", font=font(12, "mono"),
           fill=hx(s["accent"]), anchor="ra")
    f_in_sub = font(12, "mono")
    assert d.textlength(Hd["in_sub"], font=f_in_sub) <= 500, "in sub"
    d.text((CARD_X0 + 24, 86), Hd["in_sub"], font=f_in_sub, fill=hx(s["sub"]))

    mic_glyph(img, CARD_X0 + 62, 128, 25, s)
    wave_end = wave(img, CARD_X0 + 108, 128,
                    [9, 20, 32, 17, 42, 27, 36, 13, 30, 44, 22, 34, 15, 25,
                     39, 18, 11], 6, 5, s["accent"], s)
    f_note = font(12, "mono")
    note_w = d.textlength(Hd["in_note"], font=f_note)
    assert wave_end + 24 + note_w <= CARD_X1 - 24, "in note collides"
    d.text((CARD_X1 - 24, 128), Hd["in_note"], font=f_note,
           fill=hx(s["accent"]), anchor="rm")

    # the transcript lands in a tinted panel
    d.rounded_rectangle([CARD_X0 + 24, 170, CARD_X1 - 24, 226], radius=14,
                        fill=tint(s, s["accent"], 0.07),
                        outline=tint(s, s["accent"], 0.22), width=1)
    f_quote = fit(d, Hd["transcript"], 560, 20, cjk, floor=18)
    d.text((CARD_X0 + 44, 198), Hd["transcript"], font=f_quote,
           fill=hx(s["text"]), anchor="lm")
    d.text((CARD_X1 - 44, 198), Hd["transcript_tag"], font=font(12, "mono"),
           fill=hx(s["accent"]), anchor="rm")

    # ── right: the turn hinge ─────────────────────────────────────────────
    d.rounded_rectangle([CARD_X0, 262, CARD_X1, 330], radius=18,
                        fill=tint(s, s["accent"], 0.08),
                        outline=tint(s, s["accent"], 0.24), width=1)
    y_mid = 292
    f_turn_from = font(13, "mono")
    d.text((CARD_X0 + 24, y_mid), Hd["turn_from"], font=f_turn_from,
           fill=hx(s["sub"]), anchor="lm")
    from_w = d.textlength(Hd["turn_from"], font=f_turn_from)

    def h_arrow(x1: int, x2: int, y: int, color) -> None:
        d.line([(x1, y), (x2 - 8, y)], fill=hx(color), width=2)
        d.polygon([(x2 - 9, y - 4), (x2 - 9, y + 4), (x2, y)], fill=hx(color))

    ax1 = CARD_X0 + 24 + from_w + 18
    h_arrow(ax1, ax1 + 46, y_mid, s["accent"])
    f_mid = font(18, cb)
    mid_x = ax1 + 62
    d.text((mid_x, y_mid), Hd["turn_mid"], font=f_mid, fill=hx(s["text"]),
           anchor="lm")
    mid_w = d.textlength(Hd["turn_mid"], font=f_mid)
    ax2 = mid_x + mid_w + 20
    h_arrow(ax2, ax2 + 46, y_mid, s["accent"])
    d.text((ax2 + 62, y_mid), Hd["turn_to"], font=font(13, "mono"),
           fill=hx(s["accent"]), anchor="lm")

    f_turn_note = fit(d, Hd["turn_note"], CARD_X1 - CARD_X0 - 48, 12, cjk,
                      floor=11)
    assert d.textlength(Hd["turn_note"],
                        font=f_turn_note) <= CARD_X1 - CARD_X0 - 48
    d.text((CARD_X0 + 24, 314), Hd["turn_note"], font=f_turn_note,
           fill=hx(s["faint"]))

    # ── right: the answer (text → playback) ───────────────────────────────
    img = soft_card(img, (CARD_X0, 342, CARD_X1, 552), s, radius=20, lift=10,
                    strength=0.9)
    d = ImageDraw.Draw(img)
    d.text((CARD_X0 + 24, 360), Hd["out_label"], font=font(17, cb),
           fill=hx(s["text"]))
    d.text((CARD_X1 - 24, 364), "tts.engine", font=font(12, "mono"),
           fill=hx(s["accent"]), anchor="ra")
    f_out_sub = font(12, "mono")
    assert d.textlength(Hd["out_sub"], font=f_out_sub) <= 500, "out sub"
    d.text((CARD_X0 + 24, 388), Hd["out_sub"], font=f_out_sub,
           fill=hx(s["sub"]))

    d.rounded_rectangle([CARD_X0 + 24, 402, CARD_X1 - 24, 458], radius=14,
                        fill=tint(s, s["accent"], 0.07),
                        outline=tint(s, s["accent"], 0.22), width=1)
    f_ans = fit(d, Hd["answer"], 560, 20, cjk, floor=18)
    d.text((CARD_X0 + 44, 430), Hd["answer"], font=f_ans,
           fill=hx(s["text"]), anchor="lm")
    d.text((CARD_X1 - 44, 430), Hd["out_tag"], font=font(12, "mono"),
           fill=hx(s["accent"]), anchor="rm")

    wave(img, CARD_X0 + 40, 486, [12, 26, 38, 20, 34, 46, 24, 32, 16],
         7, 6, s["accent"], s)
    speaker_glyph(d, CARD_X0 + 208, 486, s)
    f_stop = fit(d, Hd["stop"], 300, 13, cjk, floor=12)
    d.text((CARD_X1 - 24, 486), Hd["stop"], font=f_stop,
           fill=hx(s["accent"]), anchor="rm")

    # the exported file, its directory and the retention cap
    x = CARD_X0 + 24
    f_chip = font(14, "mono")
    for label in Hd["files"]:
        x += chip(img, x, 516, label, f_chip, s["accent"],
                  tint(s, s["accent"], 0.10), h=30, padx=13) + 10
        assert x <= CARD_X1 - 16, ("file chips overflow", label)

    path = os.path.join(OUT, f"dsh-talk-hero-{lang}-{skin}.webp")
    img.save(path, "WEBP", quality=92, method=6)
    print(f"wrote {os.path.relpath(path, ROOT)}")


# ── flow diagram (hand-written SVG): the two-way loop ───────────────────────

SANS = "Segoe UI, Microsoft YaHei, PingFang SC, Noto Sans CJK SC, sans-serif"
MONO = "Consolas, SFMono-Regular, Menlo, monospace"


def text_width(text: str, size: float, mono: bool = False,
               bold: bool = False) -> float:
    if mono:
        path = FONT_MONO_BOLD if bold else FONT_MONO
    else:
        path = FONT_EN_BOLD if bold else FONT_EN
    return ImageFont.truetype(path, max(1, int(round(size)))).getlength(text)


def flow_svg(skin: str) -> None:
    s = SKIN[skin]
    Wd, Ht = 1100, 660
    light = skin == "light"
    shadow_op = "0.13" if light else "0.48"
    e: list[str] = []

    def add(markup: str) -> None:
        e.append(markup)

    def tinthex(color: str, t: float) -> str:
        return "#%02x%02x%02x" % blend(color, s["card"], t)

    def txt(x, y, body, size=13, color=None, weight="400", mono=False,
            anchor="start", maxw=None):
        width = text_width(body, size, mono, weight in ("600", "700"))
        if maxw is not None and width > maxw + 0.01:
            raise SystemExit(f"text overflow: {body!r} {width:.1f} > {maxw}")
        fam = MONO if mono else SANS
        add(f'<text x="{x}" y="{y}" fill="{color or s["text"]}" '
            f'font-family="{fam}" font-size="{size}" font-weight="{weight}" '
            f'text-anchor="{anchor}">{escape(body)}</text>')
        return width

    def rect(x, y, w, h, r=14, fill=None, stroke=None, sw=1.4, shadow=True,
             dash=None):
        markup = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
                  f'fill="{fill or s["card"]}"')
        if stroke:
            markup += f' stroke="{stroke}" stroke-width="{sw}"'
        if dash:
            markup += f' stroke-dasharray="{dash}"'
        markup += "/>"
        add(f'<g filter="url(#soft)">{markup}</g>' if shadow else markup)

    def line(x1, y1, x2, y2, stroke, w=1.8, dash=None, marker=None):
        markup = (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
                  f'stroke="{stroke}" stroke-width="{w}" '
                  f'stroke-linecap="round"')
        if dash:
            markup += f' stroke-dasharray="{dash}"'
        if marker:
            markup += f' marker-end="url(#{marker})"'
        add(markup + "/>")

    def path(d, stroke, w=1.8, marker=None, dash=None):
        markup = (f'<path d="{d}" fill="none" stroke="{stroke}" '
                  f'stroke-width="{w}" stroke-linecap="round" '
                  f'stroke-linejoin="round"')
        if dash:
            markup += f' stroke-dasharray="{dash}"'
        if marker:
            markup += f' marker-end="url(#{marker})"'
        add(markup + "/>")

    def gate(cx, label, wire_y, chip_y):
        """One Remote method gate, hung off the wire it labels."""
        w = text_width(label, 11, mono=True) + 16
        rect(cx - w / 2, chip_y, w, 20, 10, s["card"], s["accent"], 1.2, False)
        txt(cx, chip_y + 14, label, 11, s["accent"], "700", mono=True,
            anchor="middle")
        line(cx, chip_y + 20, cx, wire_y, tinthex(s["accent"], 0.55), 1.2)

    def badge(x, cy, number, on=True):
        fill = tinthex(s["accent"], 0.16 if on else 0.04)
        stroke = "" if on else f' stroke="{s["card_edge"]}"'
        add(f'<circle cx="{x}" cy="{cy}" r="7.5" fill="{fill}"{stroke}/>')
        txt(x, cy + 3.6, str(number), 11,
            s["accent"] if on else s["faint"], "700", mono=True,
            anchor="middle")

    add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{Wd}" '
        f'height="{Ht}" viewBox="0 0 {Wd} {Ht}" role="img" '
        f'aria-labelledby="fig-title">')
    add('<title id="fig-title">dsh-talk two-way voice loop: the browser take '
        '(mic button, MediaRecorder + VAD) crosses the talk/transcribe gate '
        'into the host engine ladder (FunASR, whisper.cpp, or the browser Web '
        'Speech), the transcript returns to the composer as a draft, the turn '
        'hinge hands it to the agent, and the speak() tool runs the mirror TTS '
        'ladder (piper, edge-tts, browser voice) into the audio cache and the '
        'bounded export directory before playback crosses back through '
        'talk/audio; the interrupt rail closes the loop on the left, and the '
        'settings write-back runs underneath</title>')
    add("<defs>")
    add('<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="{s["bg_from"]}"/>'
        f'<stop offset="1" stop-color="{s["bg_to"]}"/></linearGradient>')
    add(f'<filter id="soft" x="-30%" y="-30%" width="170%" height="185%">'
        f'<feDropShadow dx="0" dy="7" stdDeviation="10" '
        f'flood-color="#1b1735" flood-opacity="{shadow_op}"/></filter>')
    add('<marker id="arr" viewBox="0 0 10 10" refX="8.5" refY="5" '
        'markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M0.5 0.5 L9.5 5 L0.5 9.5 z" fill="{s["accent"]}"/></marker>')
    add("</defs>")
    add(f'<rect width="{Wd}" height="{Ht}" rx="22" fill="url(#bg)"/>')
    add(f'<circle cx="1010" cy="70" r="210" fill="{s["accent"]}" '
        f'opacity="{0.05 if light else 0.10}"/>')

    # ── header ────────────────────────────────────────────────────────────
    txt(44, 50, "dsh-talk · two-way voice loop", 23, s["text"], "700")
    txt(44, 78, "one browser / host seam, two channels: speech in on top, "
        "speech out below, one turn hinge between", 13.6, s["sub"],
        maxw=700)
    txt(1056, 50, "src/service.ts · speak() · resolveSttEngine", 13,
        s["faint"], mono=True, anchor="end")
    txt(1056, 74, "talk/* Remote · stt.engine · tts.engine", 13, s["accent"],
        mono=True, anchor="end")
    line(44, 94, 1056, 94, s["grid"], 1.5)

    # ── lanes, seam rail, column captions ─────────────────────────────────
    rect(44, 118, 1012, 210, 18, tinthex(s["accent"], 0.045), None, 0, False)
    rect(44, 400, 1012, 200, 18, tinthex(s["accent"], 0.045), None, 0, False)

    txt(44, 112, "BROWSER", 11.5, s["faint"], "700", mono=True)
    txt(1056, 112, "HOST", 11.5, s["faint"], "700", mono=True, anchor="end")

    seam_x = 391
    for y0, y1 in ((124, 328), (398, 594)):
        line(seam_x, y0, seam_x, y1, tinthex(s["accent"], 0.55), 1.4,
             dash="4 5")

    # ── IN lane · the take ────────────────────────────────────────────────
    txt(44, 136, "IN · speech → text", 15.5, s["text"], "700", maxw=240)
    txt(330, 136, "stt.engine", 11, s["accent"], "700", mono=True,
        anchor="end")

    rect(44, 144, 286, 58, 15, s["card"], s["card_edge"], 1.4)
    txt(62, 163, "mic button", 15, s["text"], "700")
    txt(312, 163, "record.*", 11, s["accent"], "700", mono=True,
        anchor="end")
    txt(62, 180, "conversation.input.left", 11, s["sub"], mono=True)
    txt(62, 197, "press → talk/interrupt", 11, s["accent"], mono=True)

    line(187, 202, 187, 208, s["accent"], 1.8, marker="arr")

    rect(44, 210, 286, 58, 15, s["card"], s["card_edge"], 1.4)
    txt(62, 229, "MediaRecorder + VAD", 15, s["text"], "700")
    txt(312, 229, "record.vad", 11, s["accent"], "700", mono=True,
        anchor="end")
    txt(62, 246, "silenceMs 1500 · energy 0.01", 11, s["sub"], mono=True)
    txt(62, 263, "maxSeconds 60 · secure origin", 11, s["sub"], mono=True)

    # the ladder's spine: the wire lands on it, the rungs hang off it
    line(452, 144, 452, 252, tinthex(s["accent"], 0.45), 2)
    line(330, 239, 452, 239, s["accent"], 1.8, marker="arr")
    gate(seam_x, "talk/transcribe", 239, 217)

    # engine ladder (the host half of the take)
    txt(460, 136, "engine ladder · auto", 14, s["text"], "700")
    txt(1056, 136, "first configured rung wins", 11, s["faint"],
        mono=True, anchor="end")

    rungs = [
        ("FunASR", "stt.funasr.url",
         "HTTP multipart", "POST /v1/audio/transcriptions · 120 s"),
        ("whisper.cpp", "stt.whisper.modelPath",
         "subprocess", "whisper-cli --output-txt · temp WAV"),
        ("Web Speech", "browser only",
         "browser", "interim · silenceFinaliseMs 4000"),
    ]
    for index, (name, knob, left, detail) in enumerate(rungs):
        top = 144 + index * 38
        last = index == len(rungs) - 1
        line(452, top + 18, 460, top + 18, tinthex(s["accent"], 0.45), 1.4)
        rect(460, top, 596, 32, 12, s["card"],
             tinthex(s["accent"], 0.20) if not last else s["card_edge"],
             1.3, not last, dash="5 4" if last else None)
        badge(478, top + 16, index + 1, on=not last)
        txt(494, top + 13, name, 13.5, s["text"], "700", maxw=150)
        txt(1036, top + 13, knob, 11, s["accent"] if not last else s["faint"],
            mono=True, anchor="end")
        txt(494, top + 27, left, 11, s["faint"], mono=True)
        txt(1036, top + 27, detail, 11, s["faint"], mono=True,
            anchor="end")

    # the transcript returns to the composer
    line(452, 299, 336, 299, s["accent"], 1.8, marker="arr")
    line(754, 252, 754, 276, s["accent"], 1.8, marker="arr")

    rect(44, 282, 286, 34, 12, s["card"], tinthex(s["accent"], 0.34), 1.4)
    txt(62, 303, "draft / send", 13, s["text"], "700")
    txt(312, 303, "autoSubmit", 11, s["accent"], "700", mono=True,
        anchor="end")

    rect(452, 282, 604, 34, 12, tinthex(s["accent"], 0.06),
         tinthex(s["accent"], 0.24), 1.1, False)
    txt(466, 303, "transcribe() → { text, engine, language }", 11.5,
        s["sub"], mono=True, maxw=380)
    txt(1042, 303, "base64 WAV ≤ 16 MiB · 16 kHz mono", 11,
        s["faint"], mono=True, anchor="end")

    # ── the turn hinge (bridges the seam) ────────────────────────────────
    line(187, 316, 187, 332, s["accent"], 1.8, marker="arr")
    rect(44, 336, 1012, 54, 18, tinthex(s["accent"], 0.10),
         tinthex(s["accent"], 0.30), 1.3)
    txt(62, 355, "your message", 11.5, s["sub"], mono=True)
    txt(62, 374, "draft | autoSubmit → send", 11, s["faint"], mono=True)
    line(196, 359, 414, 359, s["accent"], 1.8, marker="arr")
    txt(430, 364, "agent turn", 18, s["text"], "700")
    txt(430, 380, "the plugin never runs the loop; it sits on both edges",
        11, s["faint"], maxw=340)
    line(790, 359, 902, 359, s["accent"], 1.8, marker="arr")
    txt(918, 364, "speak()", 14, s["accent"], "700", mono=True)
    txt(918, 380, "tool call", 11, s["faint"], mono=True)

    # ── OUT lane · the answer ────────────────────────────────────────────
    txt(452, 418, "OUT · text → speech", 15.5, s["text"], "700", maxw=240)
    txt(1056, 418, "tts.engine", 11, s["accent"], "700", mono=True,
        anchor="end")

    # the interrupt rail: the loop's left edge
    path("M 44 173 H 30 V 455 H 40", tinthex(s["accent"], 0.75), 1.5,
         marker="arr", dash="4 4")
    rect(44, 426, 286, 58, 15, s["card"], tinthex(s["accent"], 0.55), 1.3,
         False, dash="5 4")
    txt(62, 445, "interrupt", 14.5, s["accent"], "700")
    txt(312, 445, "talk/interrupt", 11, s["accent"], "700", mono=True,
        anchor="end")
    txt(62, 462, "press mic → abort synthesis", 11, s["sub"], mono=True)
    txt(62, 478, "playback stops · speak → interrupted", 11, s["faint"],
        mono=True, maxw=270)

    line(187, 484, 187, 490, tinthex(s["accent"], 0.75), 1.5, marker="arr",
         dash="4 4")

    rect(44, 494, 286, 58, 15, s["card"], s["card_edge"], 1.4)
    txt(62, 513, "playback", 15, s["text"], "700")
    txt(312, 513, "talk/audio", 11, s["accent"], "700", mono=True,
        anchor="end")
    txt(62, 530, "Audio(bytes) · speechSynthesis", 11, s["sub"], mono=True)
    txt(62, 547, "browser voice: no host bytes", 11, s["sub"], mono=True)

    txt(44, 570, "talk:speech projection drives both paths", 11,
        s["faint"], mono=True)
    txt(44, 587, "audioPath → hand the file to another tool", 11,
        s["faint"], mono=True)

    # speak + announcements (row 1)
    rect(452, 426, 292, 58, 15, s["card"], s["card_edge"], 1.4)
    txt(468, 445, "announce", 13.5, s["text"], "700")
    txt(728, 445, "announce.*", 11, s["accent"], "700", mono=True,
        anchor="end")
    txt(468, 462, "agent/status · agent/error", 11, s["sub"], mono=True)
    txt(468, 477, "approval/request → next() first", 11, s["sub"], mono=True)

    rect(772, 426, 284, 58, 15, s["card"], s["card_edge"], 1.4)
    txt(788, 445, "speak()", 13.5, s["text"], "700")
    txt(1040, 445, "audioPath", 11, s["accent"], "700", mono=True,
        anchor="end")
    txt(788, 462, "maxSpeakChars 20000", 11, s["sub"], mono=True)
    txt(788, 477, "{ spoken, engine, audioBytes }", 11, s["sub"], mono=True)

    line(744, 455, 766, 455, s["accent"], 1.8, marker="arr")
    line(914, 484, 914, 490, s["accent"], 1.8, marker="arr")

    # audio cache + export register (row 2)
    rect(452, 494, 292, 100, 15, s["card"], s["card_edge"], 1.4)
    txt(468, 513, "cache · export", 13.5, s["text"], "700")
    txt(728, 513, "tts.export.*", 11, s["accent"], "700", mono=True,
        anchor="end")
    txt(468, 531, "speech-<stamp>-<token>.mp3", 11, s["sub"], mono=True)
    txt(468, 548, "~/.dsh-talk/audio", 11, s["sub"], mono=True)
    txt(468, 565, "maxFiles 20 · maxAge 1440 min", 11, s["sub"], mono=True)
    txt(468, 582, "prune: age first, then count", 11, s["faint"], mono=True)

    # TTS ladder (mirror of the STT ladder)
    txt(772, 512, "engine ladder · auto", 13.5, s["text"], "700")
    line(772, 520, 772, 590, tinthex(s["accent"], 0.45), 2)
    tts = [
        ("piper", "tts.piper.modelPath", True),
        ("edge-tts", "tts.edgeTts.voice", True),
        ("browser", "audioExport: unsupported", False),
    ]
    for index, (name, knob, on) in enumerate(tts):
        top = 520 + index * 24
        line(772, top + 11, 780, top + 11, tinthex(s["accent"], 0.45), 1.4)
        rect(780, top, 276, 22, 9,
             s["card"] if on else tinthex(s["accent"], 0.04),
             s["card_edge"], 1.1, False, dash=None if on else "5 4")
        badge(792, top + 11, index + 1, on=on)
        txt(806, top + 15, name, 13, s["text"], "700")
        txt(1042, top + 15, knob, 11, s["faint"], mono=True, anchor="end")

    # the answer crosses back to the browser player
    line(772, 527, 748, 527, s["accent"], 1.8, marker="arr")
    line(452, 527, 336, 527, s["accent"], 1.8, marker="arr")
    gate(seam_x, "talk/audio", 527, 505)

    # ── the settings write-back that runs under the loop ─────────────────
    line(44, 606, 1056, 606, s["grid"], 1.2)
    txt(44, 626, "settings: talk/applySettings → profile patch (timestamped "
        "backup) · takes effect on reload", 11, s["accent"], mono=True,
        maxw=1012)
    txt(44, 644, "the agent loop, the composer and the approval gate are the "
        "host's; this plugin sits on their edges", 11, s["faint"],
        mono=True, maxw=1012)

    add("</svg>")
    path_out = os.path.join(OUT, f"dsh-talk-flow-v5-{skin}.svg")
    with open(path_out, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(e) + "\n")
    print(f"wrote {os.path.relpath(path_out, ROOT)}")


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for skin in ("light", "dark"):
        for lang in ("zh", "en"):
            hero(lang, skin)
        flow_svg(skin)


if __name__ == "__main__":
    main()
