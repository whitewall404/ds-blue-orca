# -*- coding: utf-8 -*-
"""消消乐：红围巾图标 + 三张结算图。"""
import os
from PIL import Image, ImageDraw

A = r"C:\Users\白墙\.dsh\attachments\v1\objects"
OUT = r"D:\dsh工作区-人机恋\orca-arcade\assets"

ICON = A + r"\97\9722438a8221f509cd0a13ba582d236a119edb06feea011b4bf6e1d7b0611aaf"
ENDS = {
    1: A + r"\51\512754a11acbd4fc858680c4e9128acda33f16a8eb64914f0e1b47368ad55bbd",
    2: A + r"\23\23618e340e60adb0f3c9fbd55d00bdb810346356b91b3bb61054372ab3e67b83",
    3: A + r"\a6\a6ca40ac33df901bdcdfe8124f7002e9cf07fb82886712e0eaa76e0633113ce6",
}

SIZE = 512
RADIUS = 96


def rounded_icon(path, out):
    im = Image.open(path).convert("RGBA")
    im = im.resize((SIZE, SIZE), Image.LANCZOS)
    mask = Image.new("L", (SIZE, SIZE), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=RADIUS, fill=255)
    im.putalpha(mask)
    im.save(os.path.join(OUT, out), optimize=True)
    print(out, im.size)


rounded_icon(ICON, "icon-match.png")

for n, p in ENDS.items():
    im = Image.open(p).convert("RGB")
    im.save(os.path.join(OUT, f"match-end-{n}.png"), optimize=True)
    print(f"match-end-{n}.png", im.size)
