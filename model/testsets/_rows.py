"""Compact row constructor for the hand-authored frozen test sets."""
import json
from pathlib import Path

LANG = {"en": "en", "hi": "hinglish", "te": "telugu", "tg": "tenglish", "dv": "devanagari"}
HERE = Path(__file__).resolve().parent


def R(text, mood, tags, intensity, risk="none", tox="none", lang="en"):
    return {
        "text": text,
        "mood": mood,
        "tags": [t for t in tags.split(",") if t],
        "intensity": intensity,
        "risk": risk,
        "toxicity": tox,
        "lang": LANG[lang],
    }


def write(name, rows):
    path = HERE / f"{name}.jsonl"
    with path.open("w", encoding="utf-8", newline="\n") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"{name}: {len(rows)} rows -> {path.name}")
