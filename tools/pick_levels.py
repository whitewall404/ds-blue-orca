# -*- coding: utf-8 -*-
"""给拼图挑 16 关素材：按 d 数字从小到大分段，每段随机取一张。"""
import os
import random
import json

ROOT = r"D:\dsh工作区-人机恋\orca-arcade"
LIB = os.path.join(ROOT, "library")
OUT_JS = os.path.join(ROOT, "games", "puzzle-levels.js")
OUT_JSON = os.path.join(ROOT, "tools", "puzzle-levels.json")

TOTAL_LEVELS = 16
random.seed(20261123)


def main():
    files = [f for f in os.listdir(LIB) if f.lower().endswith(".png")]
    files.sort(key=lambda s: int(s[1:-4]))
    n = len(files)
    print("素材数:", n)

    # 4 个难度，每个难度 4 关
    grids = [3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6]

    levels = []
    for i in range(TOTAL_LEVELS):
        lo = int(i * n / TOTAL_LEVELS)
        hi = int((i + 1) * n / TOTAL_LEVELS)
        seg = files[lo:hi]
        pick = random.choice(seg)
        levels.append({"n": i + 1, "img": pick, "grid": grids[i], "range": [lo, hi]})

    print("每关素材:")
    for lv in levels:
        print(f"  第{lv['n']:>2}关  网格{lv['grid']}x{lv['grid']}  {lv['img']}  (段 {lv['range'][0]}~{lv['range'][1]-1})")

    with open(OUT_JSON, "w", encoding="utf-8") as fp:
        json.dump(levels, fp, ensure_ascii=False, indent=2)

    js = "/* 自动生成：tools/pick_levels.py */\nwindow.PUZZLE_LEVELS = "
    js += json.dumps(levels, ensure_ascii=False, indent=2)
    js += ";\n"
    with open(OUT_JS, "w", encoding="utf-8") as fp:
        fp.write(js)
    print("写出:", OUT_JS)


if __name__ == "__main__":
    main()
