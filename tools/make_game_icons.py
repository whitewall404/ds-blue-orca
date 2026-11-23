# -*- coding: utf-8 -*-
"""把墙墙的四张游戏图标处理成 512 圆角 PNG。"""
import os
from PIL import Image, ImageDraw

ROOT = r"D:\dsh工作区-人机恋\orca-arcade"
OUT = os.path.join(ROOT, "assets")

SRC = {
    "puzzle": r"C:\Users\白墙\.dsh\attachments\v1\objects\c6\c6f7e5d071f4ced5bfa8bcd5e40e41a3b4215c7e88fba19a26275f75391b7820",
    "fish":   r"C:\Users\白墙\.dsh\attachments\v1\objects\df\df19cf93ba75a8bbe553edfd829a31b53295111210257d11845d2ab8813cf58f",
    "whack":  r"C:\Users\白墙\.dsh\attachments\v1\objects\a5\a584472d134ef908583942731f1908732e7d3218a6d17060c7b6e1797ecfa279",
    "memory": r"C:\Users\白墙\.dsh\attachments\v1\objects\46\46d8c928db6d519694ca1759b8068be0bcf4e390a65dceeffa40e1628de0da24",
}

SIZE = 512
RADIUS = 96


def make_icon(path, out_name):
    im = Image.open(path).convert("RGBA")
    im = im.resize((SIZE, SIZE), Image.LANCZOS)
    mask = Image.new("L", (SIZE, SIZE), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=RADIUS, fill=255)
    im.putalpha(mask)
    im.save(os.path.join(OUT, out_name))
    # 原图存档
    src = Image.open(path).convert("RGBA")
    src.save(os.path.join(OUT, f"source-icon-{out_name.split('-')[1].split('.')[0]}.png"))


if __name__ == "__main__":
    for name, path in SRC.items():
        make_icon(path, f"icon-{name}.png")
        print("ok", name)
