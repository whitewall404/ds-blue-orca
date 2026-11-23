# -*- coding: utf-8 -*-
"""消消乐棋子素材：6 张画转 256 的 PNG。"""
import os
from PIL import Image

A = r"C:\Users\白墙\.dsh\attachments\v1\objects"
OUT = r"D:\dsh工作区-人机恋\orca-arcade\assets\match"

SRC = [
    ("d30",  A + r"\84\84a8f6809b1add8e4665317d41fc3fe62ecbc7263314327a34fcdd21e6825090"),
    ("d81",  A + r"\96\96dfab47ac18f5a16249d08d9cda35d5dba86b662432324422e27cc4ca122364"),
    ("d255", A + r"\44\44e80a4a74aaffb7540d4ffb61e4064e38cfe600bcffc32f8a1de5a0da01685a"),
    ("d291", A + r"\86\86b4a14834d9b685e9e6f3613918824cff61b01e1e12555410b24e4c16c2d6f6"),
    ("d331", A + r"\ac\ac00bb7581acb0bb7757e3e40b1d69d7f4e2f375569061db5bfcd37bb1c580c4"),
    ("d37",  A + r"\3a\3a5f7895e6c95af8dac756a2bb84243d59caf123950d2317446adafffa48f9e4"),
]

os.makedirs(OUT, exist_ok=True)

for name, p in SRC:
    im = Image.open(p).convert("RGB")
    w, h = im.size
    s = min(1.0, 256 / max(w, h))
    if s < 1:
        im = im.resize((int(w * s), int(h * s)), Image.LANCZOS)
    im.save(os.path.join(OUT, name + ".png"), optimize=True)
    print(name, im.size)
