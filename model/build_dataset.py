"""Build model/data/{train,val}.jsonl from GoEmotions + the synthetic code-mix corpus.

Fails loudly if any frozen test-set text would leak into training data.
"""
from __future__ import annotations

import json
import random
from collections import Counter
from pathlib import Path

from gen_corpus import generate
from map_goemotions import load_goemotions
from vibe_schema import normalize

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
TESTSETS = HERE / "testsets"
VAL_SHARE = 0.10


def frozen_texts() -> set[str]:
    keys = set()
    for path in TESTSETS.glob("*.jsonl"):
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                keys.add(normalize(json.loads(line)["text"]).strip())
    return keys


def build(seed: int = 21) -> tuple[list[dict], list[dict]]:
    frozen = frozen_texts()
    rows, seen, dropped = [], set(), 0
    for row in generate() + load_goemotions():
        key = normalize(row["text"]).strip()
        if key in frozen:
            dropped += 1
            continue
        if key in seen:
            continue
        seen.add(key)
        rows.append(row)
    if dropped:
        print(f"dropped {dropped} rows that matched frozen test-set texts")

    rng = random.Random(seed)
    by_source: dict[str, list[dict]] = {}
    for row in rows:
        by_source.setdefault(row["source"], []).append(row)
    train, val = [], []
    for group in by_source.values():
        rng.shuffle(group)
        cut = max(1, round(len(group) * VAL_SHARE))
        val.extend(group[:cut])
        train.extend(group[cut:])
    rng.shuffle(train)
    rng.shuffle(val)
    return train, val


def write(name: str, rows: list[dict]) -> None:
    DATA.mkdir(exist_ok=True)
    with (DATA / f"{name}.jsonl").open("w", encoding="utf-8", newline="\n") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    train, val = build()
    write("train", train)
    write("val", val)
    print(f"train {len(train)}  val {len(val)}")
    print("moods:", Counter(r["mood"] for r in train).most_common())
    print("langs:", Counter(r["lang"] for r in train).most_common())
    print("risk:", Counter(r["risk"] for r in train).most_common())
    print("tox:", Counter(r["toxicity"] for r in train).most_common())
