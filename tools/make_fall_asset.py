# -*- coding: utf-8 -*-
"""跳一跳的掉落表情：去白底 + 裁边 + 缩到 512。"""
import os
from PIL import Image, ImageDraw, ImageFilter

SRC = r"C:\Users\白墙\.dsh\attachments\v1\objects\91\9123a598940a30e805cdb5dd643d00337430b4a89e874d931db4d2a5b44485e4"
OUT = r"D:\dsh工作区-人机恋\orca-arcade\assets\jump-fall.png"

im = Image.open(SRC).convert("RGBA")
w, h = im.size

# 从四角去掉白底
for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
    if im.getpixel(seed)[:3] == (255, 255, 255) and im.getpixel(seed)[3] == 255:
        ImageDraw.floodfill(im, seed, (255, 255, 255, 0), thresh=26)

# 裁边
bbox = im.getchannel("A").getbbox()
im = im.crop(bbox)

# 缩到 512
w, h = im.size
s = min(1.0, 512 / max(w, h))
if s < 1:
    im = im.resize((int(w * s), int(h * s)), Image.LANCZOS)
im.save(OUT, optimize=True)
print("ok", im.size)
