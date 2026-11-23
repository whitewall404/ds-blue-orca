# -*- coding: utf-8 -*-
"""第五个游戏（跳一跳）的图标与主角，外加第六个游戏的占位图标。"""
import os
from PIL import Image, ImageDraw

A = r"C:\Users\白墙\.dsh\attachments\v1\objects"
OUT = r"D:\dsh工作区-人机恋\orca-arcade\assets"

ICON = A + r"\f3\f3e55cf83ae98d3db110756e291032826cff32043fd26c6118a231e5faf83f0d"
HERO = A + r"\91\917ebba8f546c9bfc16fab6597e07b3728a3675845a9a32b1bb4a5b3b4e300b5"

SIZE = 512
RADIUS = 96


def rounded(path, out, radius=RADIUS):
    im = Image.open(path).convert("RGBA")
    im = im.resize((SIZE, SIZE), Image.LANCZOS)
    mask = Image.new("L", (SIZE, SIZE), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=radius, fill=255)
    im.putalpha(mask)
    im.save(os.path.join(OUT, out))
    print(out, im.size)


def tinted(color, out):
    im = Image.new("RGBA", (SIZE * 4, SIZE * 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, SIZE * 4 - 1, SIZE * 4 - 1], radius=RADIUS * 4, fill=color + (255,))
    im.resize((SIZE, SIZE), Image.LANCZOS).save(os.path.join(OUT, out))
    print(out)


rounded(ICON, "icon-jump.png")

hero = Image.open(HERO).convert("RGBA")
bbox = hero.getchannel("A").getbbox()
hero = hero.crop(bbox)
w, h = hero.size
s = min(1.0, 512 / max(w, h))
if s < 1:
    hero = hero.resize((int(w * s), int(h * s)), Image.LANCZOS)
hero.save(os.path.join(OUT, "jump-hero.png"), optimize=True)
print("jump-hero.png", hero.size)

# 第六个游戏：纯色占位
tinted((110, 100, 140), "icon-six-placeholder.png")
