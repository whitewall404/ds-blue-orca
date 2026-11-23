# -*- coding: utf-8 -*-
"""跳一跳的三张纵向长背景（1200x6000），先出概念稿。"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1200, 6000
OUT = r"D:\dsh工作区-人机恋\orca-arcade\assets\jump"
rng = np.random.default_rng(20261123)


def gradient(stops):
    """stops: [(t, (r,g,b))]，t=0 底部，t=1 顶部。"""
    ts = np.array([s[0] for s in stops], float)
    cs = np.array([s[1] for s in stops], float)
    ys = np.linspace(1, 0, H)  # 第 0 行是顶(t=1)，最后一行是底(t=0)
    r = np.interp(ys, ts, cs[:, 0])
    g = np.interp(ys, ts, cs[:, 1])
    b = np.interp(ys, ts, cs[:, 2])
    arr = np.stack([r, g, b], axis=1)[:, None, :]
    arr = np.repeat(arr, W, axis=1).astype(np.uint8)
    return Image.fromarray(arr, "RGB").convert("RGBA")


def add_glow(im, cx, cy, r, color, alpha=90):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.55))
    return Image.alpha_composite(im, layer)


def stars(im, count, y0, y1, color=(255, 255, 255), maxr=2):
    d = ImageDraw.Draw(im)
    for _ in range(count):
        x = rng.integers(0, W)
        y = rng.integers(y0, y1)
        r = rng.integers(1, maxr + 1)
        a = rng.integers(70, 220)
        d.ellipse([x - r, y - r, x + r, y + r], fill=color + (a,))
    return im


# ---------------- 第 1 关：实验室 ----------------
def make_lab():
    im = gradient([
        (0.00, (7, 12, 22)),
        (0.18, (11, 20, 36)),
        (0.40, (18, 32, 54)),
        (0.62, (30, 48, 76)),
        (0.80, (54, 66, 92)),
        (0.92, (96, 96, 118)),
        (1.00, (140, 150, 190)),
    ])
    d = ImageDraw.Draw(im)

    # 地板（底部）
    floor_y = 5480
    d.rectangle([0, floor_y, W, H], fill=(14, 20, 32, 255))
    for i in range(0, W, 90):
        d.line([i, floor_y, i - 260, H], fill=(30, 44, 66, 180), width=2)
    for k in range(4):
        y = floor_y + 40 + k * 130
        d.line([0, y, W, y], fill=(30, 44, 66, 140), width=2)

    # 服务器机柜
    for i in range(7):
        x = 40 + i * 170
        top = 4780 + (i % 3) * 40
        d.rounded_rectangle([x, top, x + 140, floor_y - 10], radius=8,
                            fill=(16, 26, 42, 255), outline=(46, 70, 104, 220), width=2)
        for row in range(9):
            yy = top + 30 + row * 70
            d.rectangle([x + 14, yy, x + 126, yy + 46], fill=(20, 32, 52, 255))
            for c in range(5):
                on = rng.random() > 0.35
                col = (77, 255, 195, 230) if (c + row) % 2 == 0 else (77, 166, 255, 220)
                if on:
                    d.ellipse([x + 22 + c * 20, yy + 18, x + 28 + c * 20, yy + 24], fill=col)

    # 实验台 + 显示器
    for i in range(4):
        x = 80 + i * 290
        top = 4180 + (i % 2) * 90
        d.rectangle([x, top, x + 240, top + 16], fill=(40, 56, 82, 255))
        d.rectangle([x + 16, top + 16, x + 32, top + 210], fill=(30, 44, 66, 255))
        d.rectangle([x + 208, top + 16, x + 224, top + 210], fill=(30, 44, 66, 255))
        # 显示器
        d.rounded_rectangle([x + 40, top - 130, x + 200, top - 10], radius=8,
                            fill=(10, 16, 28, 255), outline=(70, 110, 160, 220), width=2)
        d.rectangle([x + 50, top - 120, x + 190, top - 22], fill=(24, 52, 84, 255))
        for k in range(4):
            d.line([x + 60, top - 100 + k * 20, x + 60 + rng.integers(60, 120), top - 100 + k * 20],
                   fill=(90, 200, 255, 180), width=3)

    # 窗户（暖光）
    for i in range(3):
        x = 120 + i * 380
        top = 3300 + (i % 2) * 120
        d.rectangle([x, top, x + 300, top + 420], fill=(255, 214, 150, 60), outline=(120, 140, 180, 200), width=3)
        d.line([x + 150, top, x + 150, top + 420], fill=(120, 140, 180, 160), width=3)
        d.line([x, top + 210, x + 300, top + 210], fill=(120, 140, 180, 160), width=3)
    im = add_glow(im, W * 0.5, 3500, 520, (255, 214, 150), 70)
    d = ImageDraw.Draw(im)

    # 书架 / 上一层
    for i in range(6):
        x = 30 + i * 200
        top = 2600 + (i % 3) * 60
        d.rectangle([x, top, x + 150, top + 300], fill=(22, 32, 50, 255), outline=(52, 74, 108, 180), width=2)
        for row in range(3):
            yy = top + 30 + row * 90
            for b in range(5):
                d.rectangle([x + 12 + b * 26, yy, x + 30 + b * 26, yy + 62],
                            fill=(rng.integers(60, 140), rng.integers(70, 150), rng.integers(120, 200), 200))

    # 天花板 + 管道
    ceil_y = 1900
    d.rectangle([0, 0, W, ceil_y], fill=(18, 26, 42, 255))
    for k in range(6):
        y = 200 + k * 280
        d.line([0, y, W, y], fill=(40, 58, 86, 200), width=6)
    for i in range(8):
        x = 60 + i * 150
        d.rectangle([x - 10, 120, x + 10, ceil_y], fill=(30, 44, 66, 220))
    # 吸顶灯
    for i in range(5):
        x = 120 + i * 240
        d.rounded_rectangle([x, 1400, x + 160, 1440], radius=40, fill=(255, 236, 200, 200))
    im = add_glow(im, W * 0.5, 1500, 600, (255, 230, 190), 55)
    d = ImageDraw.Draw(im)

    # 上层实验室：窗户 + 门 + 楼梯
    for i in range(3):
        x = 60 + i * 400
        top = 2100
        d.rectangle([x, top, x + 260, top + 430], fill=(255, 214, 150, 34), outline=(86, 106, 146, 200), width=3)
        d.line([x + 130, top, x + 130, top + 430], fill=(86, 106, 146, 160), width=3)
        d.line([x, top + 215, x + 260, top + 215], fill=(86, 106, 146, 160), width=3)
    # 楼梯剪影
    for k in range(14):
        yy = 1150 + k * 52
        d.rectangle([880 - k * 6, yy, 1140, yy + 26], fill=(26, 38, 60, 230))
    # 门
    d.rounded_rectangle([560, 1180, 760, 1620], radius=8, fill=(24, 36, 58, 255),
                        outline=(70, 92, 128, 220), width=3)
    d.ellipse([730, 1400, 744, 1414], fill=(255, 220, 160, 220))

    # 天窗（顶部）
    d.rectangle([0, 0, W, 900], fill=(9, 14, 30, 255))
    d.polygon([(120, 900), (1080, 900), (900, 180), (300, 180)], fill=(20, 34, 60, 255))
    im = add_glow(im, W * 0.5, 700, 420, (120, 160, 255), 60)
    im = stars(im, 90, 60, 800, (200, 220, 255), 2)
    return im


# ---------------- 第 2 关：深海 → 天空 ----------------
def make_sea():
    im = gradient([
        (0.00, (2, 8, 18)),
        (0.16, (4, 18, 36)),
        (0.34, (6, 40, 66)),
        (0.50, (12, 74, 104)),
        (0.64, (32, 132, 160)),
        (0.74, (96, 190, 210)),
        (0.84, (170, 224, 238)),
        (0.92, (210, 238, 250)),
        (1.00, (255, 250, 235)),
    ])
    d = ImageDraw.Draw(im)

    # 珊瑚 / 海草
    for i in range(16):
        x = 40 + i * 74
        top = 5000 + rng.integers(-260, 160)
        col = (20, 70, 96, 220)
        d.line([x, H, x, top], fill=col, width=8)
        for k in range(4):
            yy = top + k * 90
            d.line([x, yy, x + rng.integers(-60, 60), yy - 50], fill=col, width=5)

    # 气泡
    for _ in range(120):
        x = rng.integers(0, W)
        y = rng.integers(2600, 5900)
        r = rng.integers(2, 9)
        d.ellipse([x - r, y - r, x + r, y + r], outline=(150, 220, 255, 90), width=2)

    # 鱼群（剪影）
    for _ in range(40):
        x = rng.integers(60, W - 60)
        y = rng.integers(3000, 5200)
        s = rng.integers(8, 22)
        d.polygon([(x, y), (x - s, y - s * 0.6), (x - s, y + s * 0.6)], fill=(18, 60, 88, 200))
        d.ellipse([x, y - s * 0.45, x + s * 1.2, y + s * 0.45], fill=(18, 60, 88, 200))

    # 光柱
    for i in range(5):
        x = 140 + i * 240
        d.polygon([(x, 3000), (x + 120, 3000), (x + 260, 1800), (x + 40, 1800)],
                  fill=(200, 240, 255, 18))

    # 海面
    d.rectangle([0, 1500, W, 1900], fill=(180, 232, 245, 60))
    for k in range(3):
        y = 1560 + k * 90
        pts = [(x, y + int(14 * np.sin(x / 90 + k))) for x in range(0, W, 24)]
        d.line(pts, fill=(255, 255, 255, 150), width=4)
    im = add_glow(im, W * 0.5, 1650, 520, (255, 255, 255), 70)

    # 云
    for i in range(5):
        cx = 150 + i * 230
        cy = 700 + rng.integers(-120, 160)
        for k in range(4):
            r = 90 - k * 12
            ox = k * 70 - 100
            d.ellipse([cx + ox - r, cy - r * 0.7, cx + ox + r, cy + r * 0.7],
                      fill=(255, 255, 255, 40))
    # 太阳
    im = add_glow(im, W * 0.72, 320, 220, (255, 240, 200), 190)
    d = ImageDraw.Draw(im)
    d.ellipse([W * 0.72 - 90, 230, W * 0.72 + 90, 410], fill=(255, 248, 220, 235))
    return im


# ---------------- 第 3 关：地球 → 太阳系 → 银河 ----------------
def make_space():
    im = gradient([
        (0.00, (2, 4, 12)),
        (0.30, (4, 6, 20)),
        (0.52, (8, 10, 30)),
        (0.70, (12, 8, 34)),
        (0.86, (18, 10, 40)),
        (1.00, (26, 14, 48)),
    ])
    d = ImageDraw.Draw(im)

    # 地球（底部弧）
    cx, cy, R = W * 0.5, H + 2100, 3600
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=(20, 52, 110, 255))
    d.ellipse([cx - R + 40, cy - R + 40, cx + R - 40, cy + R - 40], fill=(30, 78, 150, 255))
    # 大气光
    im = add_glow(im, cx, H - 200, 1400, (120, 190, 255), 90)
    d = ImageDraw.Draw(im)
    # 云
    for _ in range(60):
        x = rng.integers(0, W)
        y = rng.integers(H - 900, H)
        r = rng.integers(30, 110)
        d.ellipse([x - r, y - r * 0.4, x + r, y + r * 0.4], fill=(255, 255, 255, 40))

    # 星星
    im = stars(im, 520, 200, 5600, (220, 230, 255), 2)
    im = stars(im, 40, 300, 5200, (255, 255, 255), 4)

    # 月球
    im = add_glow(im, 260, 3900, 200, (200, 210, 255), 60)
    d = ImageDraw.Draw(im)
    d.ellipse([150, 3790, 370, 4010], fill=(190, 196, 214, 255))
    d.ellipse([190, 3820, 260, 3890], fill=(168, 176, 198, 255))
    d.ellipse([280, 3930, 340, 3990], fill=(168, 176, 198, 255))

    # 太阳系（中段）
    sx, sy = W * 0.5, 2400
    im = add_glow(im, sx, sy, 420, (255, 200, 120), 150)
    d = ImageDraw.Draw(im)
    d.ellipse([sx - 120, sy - 120, sx + 120, sy + 120], fill=(255, 236, 180, 255))
    planets = [(430, 3000, 26, (90, 170, 255)), (600, 2760, 18, (255, 150, 120)),
               (780, 2520, 30, (220, 180, 120)), (960, 2260, 16, (160, 220, 255))]
    for px, py, pr, pc in planets:
        d.ellipse([px - pr, py - pr, px + pr, py + pr], fill=pc + (255,))

    # 银河（顶部）：模糊光带
    band = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(band)
    bd.ellipse([-400, -500, W + 400, 1600], fill=(150, 120, 255, 46))
    bd.ellipse([-200, -300, W + 200, 1900], fill=(120, 170, 255, 34))
    bd.ellipse([-600, 200, W + 600, 2400], fill=(90, 100, 220, 26))
    band = band.filter(ImageFilter.GaussianBlur(220))
    im = Image.alpha_composite(im, band)
    im = add_glow(im, W * 0.4, 600, 700, (160, 120, 255), 55)
    im = add_glow(im, W * 0.72, 900, 520, (120, 180, 255), 45)
    im = stars(im, 160, 0, 2200, (255, 255, 255), 2)
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    makers = [("bg-lab.png", make_lab), ("bg-sea.png", make_sea), ("bg-space.png", make_space)]
    thumbs = []
    for name, fn in makers:
        im = fn()
        im.convert("RGB").save(os.path.join(OUT, name), optimize=True)
        print(name, im.size)
        thumbs.append(im.convert("RGB").resize((360, 1800), Image.LANCZOS))

    # 预览：三张并排
    prev = Image.new("RGB", (360 * 3 + 40, 1800), (12, 16, 26))
    for i, t in enumerate(thumbs):
        prev.paste(t, (i * 380, 0))
    prev.save(r"D:\dsh工作区-人机恋\orca-arcade\tools\bg-preview.png")
    print("preview ok")


if __name__ == "__main__":
    main()
