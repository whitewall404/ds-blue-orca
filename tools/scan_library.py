# -*- coding: utf-8 -*-
"""扫描 D:\\画，筛出 d+数字 的作品，并读约稿记录做对照（dry-run）。"""
import os
import re
import json
import openpyxl

DRAW = r"D:\画"
XLSX = r"C:\Users\白墙\Desktop\约稿\约稿记录.xlsx"
OUT = r"D:\dsh工作区-人机恋\orca-arcade\tools\scan-result.json"

PAT = re.compile(r"^d(\d+)\.png$", re.IGNORECASE)


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb.worksheets[0]
    headers = [c.value for c in ws[1]]
    print("表头:", headers)

    # 找"文件编号"列
    col = None
    for i, h in enumerate(headers):
        if h and "文件" in str(h):
            col = i
            break
    print("编号列索引:", col)

    commissions = set()
    rows = []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if col is not None and col < len(r) and r[col]:
            code = str(r[col]).strip()
            rows.append(code)
            if re.match(r"^d\d+$", code, re.IGNORECASE):
                commissions.add(code.lower())
    print("约稿编号（d 形式的）:", sorted(commissions))
    print("约稿记录全部编号:", rows)

    files = [f for f in os.listdir(DRAW) if os.path.isfile(os.path.join(DRAW, f))]
    matched = []
    for f in files:
        m = PAT.match(f)
        if m:
            matched.append((f, int(m.group(1))))

    print("画目录文件数:", len(files))
    print("d+数字 匹配数:", len(matched))

    # 剔除约稿
    after_commission = [x for x in matched if f"d{x[1]}".lower() not in commissions]
    print("剔除约稿后:", len(after_commission))

    # 剔除 d378
    final = [x for x in after_commission if x[1] != 378]
    print("剔除 d378 后:", len(final))

    result = {
        "headers": [str(h) for h in headers if h],
        "commission_codes": rows,
        "commission_d_codes": sorted(commissions),
        "total_files": len(files),
        "matched": len(matched),
        "after_commission": len(after_commission),
        "final": sorted(f"d{n}.png" for _, n in final),
        "excluded_by_commission": sorted(f"d{n}.png" for f_, n in matched if f"d{n}".lower() in commissions),
    }
    with open(OUT, "w", encoding="utf-8") as fp:
        json.dump(result, fp, ensure_ascii=False, indent=2)
    print("写出:", OUT)


if __name__ == "__main__":
    main()
