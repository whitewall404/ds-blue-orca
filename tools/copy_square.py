# -*- coding: utf-8 -*-
"""把 library 里严格 1:1 的图复制到 library-square。"""
import os
import json
import shutil
from PIL import Image

ROOT = r"D:\dsh工作区-人机恋\orca-arcade"
LIB = os.path.join(ROOT, "library")
SQ = os.path.join(ROOT, "library-square")

with open(os.path.join(ROOT, "tools", "aspect-result.json"), encoding="utf-8") as fp:
    data = json.load(fp)

os.makedirs(SQ, exist_ok=True)
copied = []
for f in data["exact"]:
    src = os.path.join(LIB, f)
    if not os.path.exists(src):
        continue
    dst = os.path.join(SQ, f)
    if not os.path.exists(dst):
        shutil.copy2(src, dst)
    copied.append(f)

lines = []
for f in sorted(copied, key=lambda s: int(s[1:-4])):
    p = os.path.join(SQ, f)
    with Image.open(p) as im:
        w, h = im.size
    lines.append(f"{f}\t{w}x{h}")
with open(os.path.join(SQ, "list.txt"), "w", encoding="utf-8") as fp:
    fp.write("\n".join(lines))

print(f"复制 {len(copied)} 张 1:1 到 {SQ}")
