# -*- coding: utf-8 -*-
"""记忆翻牌素材：统一转 PNG、缩到 800，放进 assets/memory。"""
import os
from PIL import Image

A = r"C:\Users\白墙\.dsh\attachments\v1\objects"
OUT = r"D:\dsh工作区-人机恋\orca-arcade\assets\memory"

SRC = {
    66:  A + r"\14\144cb91b8f65a9776d907668f44c2060b42982f02a7ff24e80805a9b9c971b9c",
    128: A + r"\8a\8a49d86410e9e3861bf4a220b726b7909dca23955a35ba10ce3669e205ad1b94",
    187: A + r"\1b\1bb8ad5aad9fd3252369930a105d58ff6e0e33401382af4a7dbb538b0707f63b",
    200: A + r"\0b\0b0d67e233d4728ac58ffab5a3f642a987804552c19413cf42c2f3ab0a347c0b",
    209: A + r"\f0\f00800c3b6d0f575822338c6878cd2031529675f484316c9a1ae4b923bc49a6d",
    212: A + r"\d6\d67c5fb68add457f6a417b28f12470e1c706dfb8f80c413924e6d3e663753705",
    214: A + r"\d4\d4ef778f22419ba59c33712339aabeefa4ca5cfabaa40b5a8dfc89d7462d5581",
    222: A + r"\34\346d8cfcc9a1c4b021e4d661946916de4347d1a5d5fc6cf24220a6877cd3826a",
    240: A + r"\76\76f942053f1cb4a0f274d61596ad8437e62f86ee9cf203f5af186ab70da8de9b",
    244: A + r"\f2\f253e889ff7474630bd0ab7848d64903898f39f9382799c014b5cf9afd1c08a7",
    280: A + r"\40\40567cdfe12260c36f32f23e4bdc0c073ffcd992fdbeef13d00d897976c3b789",
    295: A + r"\f6\f6f11dc55cd1d4525194cbb178c6d02b733270e5ed96ff58630b2d2006c02cf8",
    296: A + r"\c1\c154699a9081aeffaba71134c32b95c309fad491428ca988a7f98e2a35dbb80e",
    315: A + r"\30\30e4625934adcbb3671e555fb4deb658b425c879b2bd1bba2cad7de2a7cc3f33",
    322: A + r"\ad\ad27383d491fc2190ecf816fd53b23f1dd08787471f44c6822f2346f521f30cb",
    337: A + r"\78\78b2fbadb319c59d4cc779dc3e74941570a54cc642b39fd4c6ebf94a61a99596",
    338: A + r"\63\630f5b1a8a9c957bd157a4c24dcb2acbe6dd90598050f9eefe4fa2159c44aa72",
    342: A + r"\70\7047c1e4c7c501c1dfa72341662db131661742c9a8d9c8842599fef4e69eb7d0",
    355: A + r"\93\93455ee31afa0d54bf8af960dc552e853cefd740b5a6d8a707a435d00df3a7ff",
    366: A + r"\6e\6e6664ad36794003938b333fea2978a998b2ff452d4905f8217854e0790cd0e2",
}

MAX = 800
os.makedirs(OUT, exist_ok=True)

for n, p in SRC.items():
    im = Image.open(p).convert("RGB")
    w, h = im.size
    scale = min(1.0, MAX / max(w, h))
    if scale < 1:
        im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    im.save(os.path.join(OUT, f"d{n}.png"), optimize=True)
    print(f"d{n}.png", im.size)
