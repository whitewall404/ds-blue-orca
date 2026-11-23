# -*- coding: utf-8 -*-
"""把 9 张打地鼠素材裁成「头部特写」（相对 bbox 的手工裁剪框），并拼一张检查图。"""
import os
from PIL import Image, ImageDraw

SRC = r"D:\画\小游戏素材\打地鼠"
OUT = r"D:\dsh工作区-人机恋\orca-arcade\assets\whack"

# (x, y, w, h) 相对 bbox 的比例
CROPS = {
    "随机出现1.png": (0.02, 0.00, 0.62, 0.58),
    "随机出现2.png": (0.08, 0.00, 0.84, 0.62),
    "随机出现3.png": (0.26, 0.00, 0.72, 0.66),
    "随机出现4.png": (0.00, 0.00, 0.82, 0.68),
    "随机出现5.png": (0.10, 0.00, 0.80, 0.64),
    "随机出现6.png": (0.30, 0.00, 0.68, 0.74),
    "被打中1.png": (0.00, 0.30, 0.68, 0.68),
    "被打中2.png": (0.00, 0.42, 0.64, 0.58),
    "被打中3.png": (0.00, 0.40, 0.62, 0.60),
}

NAMES = {
    "随机出现1.png": "pop1.png", "随机出现2.png": "pop2.png", "随机出现3.png": "pop3.png",
    "随机出现4.png": "pop4.png", "随机出现5.png": "pop5.png", "随机出现6.png": "pop6.png",
    "被打中1.png": "hit1.png", "被打中2.png": "hit2.png", "被打中3.png": "hit3.png",
}

SIZE = 400
os.makedirs(OUT, exist_ok=True)

thumbs = []
for name, (rx, ry, rw, rh) in CROPS.items():
    p = os.path.join(SRC, name)
    im = Image.open(p).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    im = im.crop(bbox)
    w, h = im.size
    box = (int(w * rx), int(h * ry), int(w * (rx + rw)), int(h * (ry + rh)))
    im = im.crop(box)
    # 缩放到正方形画布（保持比例，居中，留白）
    cw, ch = im.size
    side = max(cw, ch)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - cw) // 2, (side - ch) // 2), im)
    canvas = canvas.resize((SIZE, SIZE), Image.LANCZOS)
    canvas.save(os.path.join(OUT, NAMES[name]))
    thumbs.append((canvas, NAMES[name]))
    print(NAMES[name], "->", canvas.size)

# 检查拼图
cell = 220
m = Image.new("RGB", (cell * 3, cell * 3), (20, 26, 40))
for i, (im, _) in enumerate(thumbs):
    t = im.copy()
    bg = Image.new("RGBA", t.size, (20, 26, 40, 255))
    bg.alpha_composite(t)
    t = bg.convert("RGB")
    t.thumbnail((cell - 8, cell - 8))
    m.paste(t, ((i % 3) * cell + (cell - t.width) // 2, (i // 3) * cell + (cell - t.height) // 2))
m.save(os.path.join(os.path.dirname(OUT), "..", "tools", "whack-crops.png"))
print("montage ok")
