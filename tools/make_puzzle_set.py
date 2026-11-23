# -*- coding: utf-8 -*-
"""把墙墙挑的 16 张拼图素材整理进 library-puzzle，并重建关卡数据。"""
import os
import json
from PIL import Image

ROOT = r"D:\dsh工作区-人机恋\orca-arcade"
OUT = os.path.join(ROOT, "library-puzzle")
OUT_JS = os.path.join(ROOT, "games", "puzzle-levels.js")
OUT_JSON = os.path.join(ROOT, "tools", "puzzle-levels.json")

A = r"C:\Users\白墙\.dsh\attachments\v1\objects"

SRC = {
    2:   A + r"\9b\9bd95a89f522d128f0583b51ed0c89f6c1b7b81acf15ea6c71a3d22373c1a051",
    19:  A + r"\a7\a7d75a881412ca1d95fa4a4336081d16cee720ad6b837442d63c845756b502a7",
    21:  A + r"\1a\1a73698763a84bebfb1b516d938ebfccd278368f05026d423402c4ed61a803f8",
    31:  A + r"\82\828a0180d8c756724b91d68fbc578a7634247aecc883138bc26cf85c13d8baa1",
    54:  A + r"\aa\aaf0c856a8aee46624c42495772f9936085c454831064831eaff43d390c09b88",
    65:  A + r"\5f\5fdda1f86e4249e0eff75e8f9984a160963a9eeb2f48289b88d515daf2dd14ae",
    67:  A + r"\7d\7d73566bf109afbd3fc6e899e5c824569d9f78e71c9acc4679356d127ea89231",
    76:  A + r"\e6\e611e66a989f84166916aaf5eeb2effc47493ee3031d83f9163aa587a9a8f312",
    175: A + r"\23\23c8d5e84bfcd47d12cead730d57f77fa70c6771ee3efeffbc1ff50c017cc669",
    218: A + r"\b5\b5f5c8aeaa18e2292bbdf6440ee32aad98ca74f628692f87cca4a51e5ddd1ddc",
    224: A + r"\e5\e5e5ad5f71b69b325c81aeb4b8095671efc38a809a19fc19f455ec5f4f1ceca3",
    264: A + r"\8f\8faa0d101f5414f423c7f5e12615a09a43ac239852f7e066451a3ed1da64a58d",
    326: A + r"\d6\d60c8aa37d138952d33a196effada2f78100d90a05e38b16edfd3d5181543f41",
    335: A + r"\5b\5bd1cc052af86a265e8c53479ef756992cfc6372f617dbef2673bb2bd9853b58",
    338: A + r"\63\630f5b1a8a9c957bd157a4c24dcb2acbe6dd90598050f9eefe4fa2159c44aa72",
    361: A + r"\d7\d7f0bdb96051a2f5da2263b5313bd543005341fbf3a4d84ccedd00356fee1e66",
}

MAX_SIDE = 1500
GRIDS = [3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6]


def main():
    os.makedirs(OUT, exist_ok=True)
    for old in os.listdir(OUT):
        if old.lower().endswith(".png"):
            os.remove(os.path.join(OUT, old))

    nums = sorted(SRC)
    assert len(nums) == 16, len(nums)

    levels = []
    for i, n in enumerate(nums):
        im = Image.open(SRC[n])
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
            bg.alpha_composite(im)
            im = bg
        im = im.convert("RGB")
        w, h = im.size
        scale = min(1.0, MAX_SIDE / max(w, h))
        if scale < 1:
            im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        name = f"d{n}.png"
        im.save(os.path.join(OUT, name), optimize=True)
        levels.append({"n": i + 1, "img": name, "grid": GRIDS[i]})
        print(f"第{i+1:>2}关 {GRIDS[i]}x{GRIDS[i]}  {name}  {im.size[0]}x{im.size[1]}")

    with open(OUT_JSON, "w", encoding="utf-8") as fp:
        json.dump(levels, fp, ensure_ascii=False, indent=2)

    js = "/* 自动生成：tools/make_puzzle_set.py */\nwindow.PUZZLE_LEVELS = "
    js += json.dumps(levels, ensure_ascii=False, indent=2)
    js += ";\n"
    with open(OUT_JS, "w", encoding="utf-8") as fp:
        fp.write(js)
    print("写出:", OUT_JS)


if __name__ == "__main__":
    main()
