# -*- coding: utf-8 -*-
"""哈气虎鲸（v2）：重新抠图 + 去掉白边。"""
import os
from PIL import Image, ImageDraw, ImageFilter

SRC = r"C:\Users\白墙\.dsh\attachments\v1\objects\92\92be028d673d4eaf311774f5ecb51b85f8837fecf5604be4ac853e36f7dbd0c9"
OUT = r"D:\dsh工作区-人机恋\orca-arcade\assets\orca-angry.png"
PREVIEW = r"D:\dsh工作区-人机恋\orca-arcade\tools\angry-preview.png"

im = Image.open(SRC).convert("RGBA")
w, h = im.size

# 1) 从四边去白
for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2)]:
    if im.getpixel(seed)[:3] == (255, 255, 255) and im.getpixel(seed)[3] == 255:
        ImageDraw.floodfill(im, seed, (255, 255, 255, 0), thresh=30)

# 2) 裁到内容
bbox = im.getchannel("A").getbbox()
im = im.crop(bbox)

# 3) 边缘侵蚀：吃掉抗锯齿白边，再轻微羽化
a = im.getchannel("A")
a = a.filter(ImageFilter.MinFilter(3))      # 收缩 1px
a = a.filter(ImageFilter.MinFilter(3))      # 再 1px（总计约 2px）
a = a.filter(ImageFilter.GaussianBlur(1.0))
im.putalpha(a)

# 4) 缩放
w, h = im.size
s = min(1.0, 640 / max(w, h))
if s < 1:
    im = im.resize((int(w * s), int(h * s)), Image.LANCZOS)
im.save(OUT, optimize=True)
print("saved", im.size)

# 5) 深色背景预览，检查白边
pv = Image.new("RGBA", (im.width + 40, im.height + 40), (10, 18, 34, 255))
pv.alpha_composite(im, (20, 20))
pv.convert("RGB").save(PREVIEW)
print("preview")
