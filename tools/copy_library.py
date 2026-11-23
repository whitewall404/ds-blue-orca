# -*- coding: utf-8 -*-
"""把筛好的作品复制进素材库，并生成清单。"""
import os
import json
import shutil

ROOT = r"D:\dsh工作区-人机恋\orca-arcade"
DRAW = r"D:\画"
LIB = os.path.join(ROOT, "library")
SCAN = os.path.join(ROOT, "tools", "scan-result.json")


def main():
    os.makedirs(LIB, exist_ok=True)
    with open(SCAN, encoding="utf-8") as fp:
        data = json.load(fp)
    files = data["final"]

    copied = 0
    skipped = 0
    for name in files:
        src = os.path.join(DRAW, name)
        dst = os.path.join(LIB, name)
        if not os.path.exists(src):
            skipped += 1
            continue
        if not os.path.exists(dst):
            shutil.copy2(src, dst)
        copied += 1

    # 清单
    lines = []
    total = 0
    for name in sorted(files, key=lambda s: int(s[1:-4])):
        p = os.path.join(LIB, name)
        if os.path.exists(p):
            size = os.path.getsize(p)
            total += size
            lines.append(f"{name}\t{size/1024/1024:.1f} MB")
    with open(os.path.join(LIB, "list.txt"), "w", encoding="utf-8") as fp:
        fp.write("\n".join(lines))

    readme = f"""素材库 · 小虎鲸的游戏屋

来源：D:\\画（原图没动，这里只是副本）
筛法：文件名是 d+数字 的（排除带括号的版本）
剔除：约稿记录里的 {len(data['excluded_by_commission'])} 张 + d378（表情包封面，墙墙之后另给）

现在里面 {len(lines)} 张，合计 {total/1024/1024:.1f} MB。

这个文件夹随便删、随便改——游戏读取的就是这里。
删错了也不要紧，D:\\画 里的原图还在。
"""
    with open(os.path.join(LIB, "README.txt"), "w", encoding="utf-8") as fp:
        fp.write(readme)

    print(f"复制 {copied} 张，跳过 {skipped} 张，合计 {total/1024/1024:.1f} MB")


if __name__ == "__main__":
    main()
