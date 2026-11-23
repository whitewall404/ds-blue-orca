# -*- coding: utf-8 -*-
"""生成四个游戏的纯色占位图标（512x512 圆角 PNG）。"""
import os
from PIL import Image, ImageDraw

ROOT = r"D:\dsh工作区-人机恋\orca-arcade"
OUT = os.path.join(ROOT, "assets")

GAMES = {
    "puzzle": (124, 92, 255),
    "fish": (34, 184, 207),
    "whack": (255, 143, 63),
    "memory": (255, 107, 157),
}

SIZE = 512
RADIUS = 112


def rounded(color):
    im = Image.new("RGBA", (SIZE * 4, SIZE * 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, SIZE * 4 - 1, SIZE * 4 - 1], radius=RADIUS * 4, fill=color + (255,))
    return im.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    for name, color in GAMES.items():
        rounded(color).save(os.path.join(OUT, f"icon-{name}-placeholder.png"))
        print("ok", name)


if __name__ == "__main__":
    main()
