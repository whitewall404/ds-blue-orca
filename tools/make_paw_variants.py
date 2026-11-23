# -*- coding: utf-8 -*-
"""猫爪光标候选：PIL 画毛发丝版（B、C 两版，按参考图排布）。"""
import math
import random
from PIL import Image, ImageDraw, ImageFilter

S = 1024
OUT = r"D:\dsh工作区-人机恋\orca-arcade\assets"


def draw_paw(fuzz_len, density, out):
    rng = random.Random(20261123)
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    cx, cy = S * 0.5, S * 0.52
    rx, ry = S * 0.40, S * 0.38

    # 阴影
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ds = ImageDraw.Draw(sh)
    ds.ellipse([cx - rx * 1.02, cy - ry * 0.95, cx + rx * 1.02, cy + ry * 1.10],
               fill=(70, 58, 66, 110))
    sh = sh.filter(ImageFilter.GaussianBlur(30))
    im = Image.alpha_composite(im, sh)
    d = ImageDraw.Draw(im)

    # 毛发丝（先画，让主体盖在上面）
    n = int(density)
    for i in range(n):
        a = rng.uniform(0, 2 * math.pi)
        ex = cx + rx * math.cos(a)
        ey = cy + ry * math.sin(a)
        L = rng.uniform(fuzz_len * 0.3, fuzz_len)
        aa = a + rng.uniform(-0.35, 0.35)
        col = (246, 240, 236, rng.randint(90, 210)) if rng.random() < 0.5 else (255, 255, 255, rng.randint(120, 235))
        d.line([ex, ey, ex + math.cos(aa) * L, ey + math.sin(aa) * L],
               fill=col, width=rng.choice([2, 3]))

    # 主体
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(253, 251, 250, 255))
    # 主体内阴影（下缘略灰）
    d.arc([cx - rx * 0.98, cy - ry * 0.98, cx + rx * 0.98, cy + ry * 0.98],
          20, 160, fill=(232, 224, 220, 180), width=14)

    # 边缘再补一圈短毛（盖住主体硬边）
    for i in range(int(n * 0.7)):
        a = rng.uniform(0, 2 * math.pi)
        ex = cx + rx * 0.985 * math.cos(a)
        ey = cy + ry * 0.985 * math.sin(a)
        L = rng.uniform(4, fuzz_len * 0.45)
        aa = a + rng.uniform(-0.4, 0.4)
        d.line([ex, ey, ex + math.cos(aa) * L, ey + math.sin(aa) * L],
               fill=(255, 255, 255, rng.randint(150, 245)), width=2)

    # 肉垫：4 个趾在上弧线，大掌垫在下
    toes = [
        (0.26, 0.40, 0.088, 0.098),
        (0.42, 0.31, 0.092, 0.100),
        (0.59, 0.31, 0.092, 0.100),
        (0.75, 0.40, 0.088, 0.098),
    ]
    for px, py, prx, pry in toes:
        X, Y = S * px, S * py
        RX, RY = S * prx, S * pry
        d.ellipse([X - RX, Y - RY, X + RX, Y + RY], fill=(247, 168, 184, 255))
        d.ellipse([X - RX * 0.5, Y - RY * 0.58, X + RX * 0.05, Y - RY * 0.02],
                  fill=(255, 228, 234, 210))

    # 大掌垫
    X, Y = S * 0.51, S * 0.66
    RX, RY = S * 0.20, S * 0.16
    d.ellipse([X - RX, Y - RY, X + RX, Y + RY], fill=(247, 168, 184, 255))
    d.ellipse([X - RX * 0.58, Y - RY * 0.55, X - RX * 0.05, Y + RY * 0.05],
              fill=(255, 232, 238, 215))

    # 肉垫间的细毛
    for px, py, prx, pry in toes + [(0.51, 0.66, 0.20, 0.16)]:
        X, Y = S * px, S * py
        RX, RY = S * prx, S * pry
        for i in range(int(density * 0.08)):
            a = rng.uniform(0, 2 * math.pi)
            ex = X + RX * math.cos(a)
            ey = Y + RY * math.sin(a)
            L = rng.uniform(3, 9)
            d.line([ex, ey, ex + math.cos(a) * L, ey + math.sin(a) * L],
                   fill=(255, 245, 247, 190), width=2)

    im = im.resize((512, 512), Image.LANCZOS)
    im.save(out, optimize=True)
    print(out)


draw_paw(fuzz_len=34, density=3200, out=OUT + r"\paw-b.png")
draw_paw(fuzz_len=52, density=5200, out=OUT + r"\paw-c.png")
