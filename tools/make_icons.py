# -*- coding: utf-8 -*-
"""把小虎鲸白底原图处理成透明 PNG + 多尺寸 ICO。"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = r"D:\dsh工作区-人机恋\orca-arcade"
SRC = os.path.join(ROOT, "assets", "source-orca.png")
OUT = os.path.join(ROOT, "assets")


def strip_white(im: Image.Image, thresh=28):
    """从四边 flood fill 去掉外部白底，保留内部白色斑块。"""
    im = im.convert("RGBA")
    w, h = im.size
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
             (w // 2, 0), (0, h // 2), (w - 1, h // 2), (w // 2, h - 1)]
    for seed in seeds:
        px = im.getpixel(seed)
        if px[:3] == (255, 255, 255) and px[3] == 255:
            ImageDraw.floodfill(im, seed, (255, 255, 255, 0), thresh=thresh)
    return im


def crop_to_content(im: Image.Image):
    bbox = im.getchannel("A").getbbox()
    return im.crop(bbox)


def clean_edges(im: Image.Image):
    """背景收缩 1px 吃掉抗锯齿白边，再给 alpha 轻微羽化。"""
    a = im.getchannel("A")
    a2 = a.filter(ImageFilter.MinFilter(3))
    a3 = a2.filter(ImageFilter.GaussianBlur(0.8))
    im = im.copy()
    im.putalpha(a3)
    return im


def pad_square(im: Image.Image, pad_ratio=0.05):
    w, h = im.size
    side = max(w, h)
    pad = int(side * pad_ratio)
    canvas = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    canvas.paste(im, ((canvas.width - w) // 2, (canvas.height - h) // 2), im)
    return canvas


def main():
    src = Image.open(SRC)
    print("source", src.mode, src.size)

    im = strip_white(src)
    im = crop_to_content(im)
    print("crop", im.size)
    im = clean_edges(im)
    im = pad_square(im)
    print("square", im.size)

    im.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "orca.png"))
    im.resize((768, 768), Image.LANCZOS).save(os.path.join(OUT, "orca-menu.png"))

    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    im.resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, "orca.ico"), sizes=sizes)

    for s in (16, 32, 48, 64, 256):
        im.resize((s, s), Image.LANCZOS).save(os.path.join(OUT, f"orca-{s}.png"))

    print("ok: orca.png / orca-menu.png / orca.ico")


if __name__ == "__main__":
    main()
