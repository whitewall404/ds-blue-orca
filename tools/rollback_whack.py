# -*- coding: utf-8 -*-
"""回滚：8 张恢复成上一轮（bbox 裁剪 + 缩到 512）的版本；
只有「随机出现1」按墙墙要求裁成上半部分（虎鲸头）。"""
import os
from PIL import Image

SRC = r"D:\画\小游戏素材\打地鼠"
OUT = r"D:\dsh工作区-人机恋\orca-arcade\assets\whack"

MAP = {
    "随机出现1.png": "pop1.png",
    "随机出现2.png": "pop2.png",
    "随机出现3.png": "pop3.png",
    "随机出现4.png": "pop4.png",
    "随机出现5.png": "pop5.png",
    "随机出现6.png": "pop6.png",
    "被打中1.png": "hit1.png",
    "被打中2.png": "hit2.png",
    "被打中3.png": "hit3.png",
}

os.makedirs(OUT, exist_ok=True)

for name, outname in MAP.items():
    im = Image.open(os.path.join(SRC, name)).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if bbox:
        im = im.crop(bbox)

    if name == "随机出现1.png":
        # 只裁上半部分：保留头部
        w, h = im.size
        im = im.crop((0, 0, w, int(h * 0.56)))

    w, h = im.size
    scale = min(1.0, 512 / max(w, h))
    if scale < 1:
        im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    im.save(os.path.join(OUT, outname), optimize=True)
    print(outname, im.size)
