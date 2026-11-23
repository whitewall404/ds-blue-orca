# -*- coding: utf-8 -*-
"""统计 library 里图片的比例分布，筛出 1:1。"""
import os
from collections import Counter
from PIL import Image

LIB = r"D:\dsh工作区-人机恋\orca-arcade\library"
OUT = r"D:\dsh工作区-人机恋\orca-arcade\tools\aspect-result.json"


def main():
    files = sorted(
        [f for f in os.listdir(LIB) if f.lower().endswith(".png")],
        key=lambda s: int(s[1:-4]) if s[1:-4].isdigit() else 0,
    )
    exact, near, other = [], [], []
    sizes = Counter()
    for f in files:
        p = os.path.join(LIB, f)
        try:
            with Image.open(p) as im:
                w, h = im.size
        except Exception as e:
            print("读取失败", f, e)
            continue
        sizes[(w, h)] += 1
        if w == h:
            exact.append((f, w, h))
        elif abs(w / h - 1) <= 0.02:
            near.append((f, w, h))
        else:
            other.append((f, w, h))

    print("总数:", len(files))
    print("严格 1:1:", len(exact))
    print("接近 1:1（±2%）:", len(near))
    print("其他:", len(other))
    print("\n最常见尺寸 top 15:")
    for (w, h), c in sizes.most_common(15):
        print(f"  {w}x{h}  ({w/h:.3f})  ×{c}")

    print("\n接近 1:1 但不相等的：")
    for f, w, h in near:
        print(f"  {f}  {w}x{h}  {w/h:.4f}")

    import json
    with open(OUT, "w", encoding="utf-8") as fp:
        json.dump({
            "exact": [f for f, _, _ in exact],
            "near": [f for f, _, _ in near],
            "other": [f for f, _, _ in other],
        }, fp, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
