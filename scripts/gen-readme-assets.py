#!/usr/bin/env python3
"""Generate README image assets for dsh-talk (docs/assets/).

Outputs (idempotent overwrite):
  dsh-talk-flow-light.svg / dsh-talk-flow-dark.svg
      Hero voice-loop diagram. Two hand-written SVG files (vector — never
      rasterized to webp). Text inside is command-surface tokens only
      (talk/transcribe, tts.engine, speak, ...), so all five README
      languages share the same pair.

No evidence chart is generated: this repository has no benchmark/RESULTS.md.
The test counts in the README come from the vitest run, not from a measured
benchmark, and a chart must never invent data.

Run once:  python scripts/gen-readme-assets.py
Requires:  Pillow (pip install pillow) — only the CJK font probe below uses
           it; the diagrams themselves are plain SVG text.
"""
from __future__ import annotations

import os
import sys

from PIL import ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

# --- palette: PerryLink family (accent) + GitHub page backgrounds ----------
FAMILY = "#4B67B4"   # family accent (badges labelColor family uses #2B3245)
SKIN = {
    "light": dict(bg="#ffffff", box="#f6f8fa", border="#d0d7de",
                  text="#1f2328", sub="#57606a"),
    "dark": dict(bg="#0d1117", box="#161b22", border="#30363d",
                 text="#f0f6fc", sub="#8b949e"),
}

# --- CJK font probe: Chinese must never render as tofu boxes ----------------
# Kept from the family skeleton so any future Chinese caption fails loudly
# instead of shipping boxes. This script renders ASCII-only SVG today.
FONT_CANDIDATES = [
    r"C:\Windows\Fonts\msyh.ttc",      # Microsoft YaHei
    r"C:\Windows\Fonts\simhei.ttf",    # SimHei
    r"C:\Windows\Fonts\Deng.ttf",      # DengXian
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/System/Library/Fonts/PingFang.ttc",
]
FONT_PATH = next((p for p in FONT_CANDIDATES if os.path.exists(p)), None)
if FONT_PATH is None:
    sys.exit("FATAL: no CJK font found (looked for msyh.ttc, simhei.ttf, "
             "Deng.ttf, Noto Sans CJK, PingFang). Refusing to render Chinese "
             "as tofu boxes; install one of the probed fonts and re-run.")


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATH, size)


# ---------------------------------------------------------------------------
# Hero voice-loop SVG (light + dark)
# ---------------------------------------------------------------------------
# Top lane flows left -> right (speech in); the loop drops to the bottom lane
# through the agent turn and flows right -> left (speech out); starting to
# talk climbs back up as talk/interrupt. Tokens only — no prose.
TOP = [
    ("mic button", "record.*"),
    ("MediaRecorder", "Web Speech"),
    ("talk/transcribe", "stt.engine"),
    ("FunASR", "whisper.cpp"),
    ("draft / submit", "record.autoSubmit"),
]
BOTTOM = [
    ("playback", "speechSynthesis"),
    ("talk/audio", "audio cache"),
    ("synthesize", "browser · edge-tts · piper"),
    ("tts.engine", "auto"),
    ("speak", "tool call · audioPath"),
]
BOTTOM_LEFT_TO_RIGHT = BOTTOM


def flow_svg(skin: str) -> str:
    s = SKIN[skin]
    w, h = 1200, 480
    nw, nh, gap = 168, 88, 60
    xs = [60 + i * (nw + gap) for i in range(5)]
    y_top, y_bottom = 150, 300
    mono = "ui-monospace,monospace"
    sans = "ui-sans-serif,system-ui,sans-serif"
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" role="img" aria-label="dsh-talk voice loop">',
        '<title>dsh-talk voice loop</title>',
        f'<rect width="{w}" height="{h}" rx="18" fill="{s["bg"]}"/>',
        f'<text x="60" y="60" fill="{s["text"]}" font-family="{sans}" '
        f'font-size="30" font-weight="700">dsh-talk</text>',
        f'<text x="60" y="94" fill="{s["sub"]}" font-family="{mono}" '
        f'font-size="15">voice loop · stt.engine · tts.engine · announce.* · '
        f'talk/* (Remote)</text>',
        f'<line x1="60" y1="116" x2="1140" y2="116" stroke="{s["border"]}"/>',
    ]

    def box(x: int, y: int, label: str, sub: str, accent: str) -> None:
        parts.append(
            f'<rect x="{x}" y="{y}" width="{nw}" height="{nh}" rx="14" '
            f'fill="{s["box"]}" stroke="{accent}" stroke-width="2"/>')
        parts.append(
            f'<text x="{x + nw // 2}" y="{y + 38}" fill="{s["text"]}" '
            f'text-anchor="middle" font-family="{mono}" font-size="16" '
            f'font-weight="700">{label}</text>')
        sub_size = "10.5" if len(sub) > 20 else "12"
        parts.append(
            f'<text x="{x + nw // 2}" y="{y + 64}" fill="{s["sub"]}" '
            f'text-anchor="middle" font-family="{mono}" font-size="{sub_size}">'
            f'{sub}</text>')

    def arrow_right(x1: int, x2: int, y: int) -> None:
        parts.append(
            f'<path d="M{x1} {y}h{x2 - x1}" stroke="{s["sub"]}" '
            f'stroke-width="3"/>')
        parts.append(
            f'<path d="M{x2 - 12} {y - 7}l10 7-10 7" fill="none" '
            f'stroke="{s["sub"]}" stroke-width="3" stroke-linecap="round" '
            f'stroke-linejoin="round"/>')

    def arrow_left(x1: int, x2: int, y: int) -> None:
        # x1 > x2: points left
        parts.append(
            f'<path d="M{x1} {y}h{x2 - x1}" stroke="{s["sub"]}" '
            f'stroke-width="3"/>')
        parts.append(
            f'<path d="M{x2 + 12} {y - 7}l-10 7 10 7" fill="none" '
            f'stroke="{s["sub"]}" stroke-width="3" stroke-linecap="round" '
            f'stroke-linejoin="round"/>')

    for i, (label, sub) in enumerate(TOP):
        accent = FAMILY if i in (0, 2) else s["border"]
        box(xs[i], y_top, label, sub, accent)
        if i < len(TOP) - 1:
            arrow_right(xs[i] + nw + 6, xs[i + 1] - 6, y_top + nh // 2)

    for i, (label, sub) in enumerate(BOTTOM_LEFT_TO_RIGHT):
        accent = FAMILY if i in (2, 4) else s["border"]
        box(xs[i], y_bottom, label, sub, accent)
        if i < len(BOTTOM_LEFT_TO_RIGHT) - 1:
            arrow_left(xs[i + 1] - 6, xs[i] + nw + 6, y_bottom + nh // 2)

    # agent turn: rightmost top box -> rightmost bottom box
    ax = xs[-1] + nw // 2
    parts.append(
        f'<path d="M{ax} {y_top + nh}v{y_bottom - y_top - nh}" '
        f'stroke="{FAMILY}" stroke-width="3"/>')
    parts.append(
        f'<path d="M{ax - 7} {y_bottom - 12}l7 10 7-10" fill="none" '
        f'stroke="{FAMILY}" stroke-width="3" stroke-linecap="round" '
        f'stroke-linejoin="round"/>')
    parts.append(
        f'<text x="{ax - 12}" y="{y_bottom - 26}" fill="{s["sub"]}" '
        f'text-anchor="end" font-family="{mono}" font-size="13">agent '
        f'turn</text>')

    # speak-to-interrupt: leftmost bottom box -> leftmost top box (dashed)
    ix = xs[0] + nw // 2
    head_y = y_top + nh + 10
    parts.append(
        f'<path d="M{ix} {y_bottom}v{head_y - y_bottom}" '
        f'stroke="{FAMILY}" stroke-width="2" stroke-dasharray="5 5"/>')
    parts.append(
        f'<path d="M{ix - 7} {head_y}l7 -10 7 10" fill="none" '
        f'stroke="{FAMILY}" stroke-width="2" stroke-linecap="round" '
        f'stroke-linejoin="round"/>')
    parts.append(
        f'<text x="{ix + 12}" y="{y_top + 124}" fill="{s["sub"]}" '
        f'font-family="{mono}" font-size="13">talk/interrupt</text>')

    parts.append(
        f'<text x="60" y="438" fill="{s["sub"]}" font-family="{mono}" '
        f'font-size="13">tts.export.dir · speech-&lt;stamp&gt;-&lt;token&gt;'
        f'.mp3|.wav · maxFiles · maxAgeMinutes</text>')
    parts.append(
        f'<text x="1140" y="438" fill="{s["sub"]}" text-anchor="end" '
        f'font-family="{mono}" font-size="13">announce.* · agent/status · '
        f'agent/error · approval/request</text>')
    parts.append('</svg>')
    return "\n".join(parts) + "\n"


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for skin in ("light", "dark"):
        with open(os.path.join(OUT, f"dsh-talk-flow-{skin}.svg"),
                  "w", encoding="utf-8", newline="\n") as fh:
            fh.write(flow_svg(skin))
    print("wrote 2 SVG assets to docs/assets/ (no evidence chart: "
          "no benchmark data in this repository)")


if __name__ == "__main__":
    main()
