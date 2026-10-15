"""Map Google's GoEmotions (58k Reddit comments, 27 emotions; CC BY 4.0) onto the
Unfilterd taxonomy. English breadth for the model; code-mix comes from gen_corpus.py.

Citation: Demszky et al., "GoEmotions: A Dataset of Fine-Grained Emotions", ACL 2020.
"""
from __future__ import annotations

import random
from pathlib import Path

from vibe_schema import floor_risk

CACHE = Path(__file__).resolve().parent / "hf_cache"

LABELS = [
    "admiration", "amusement", "anger", "annoyance", "approval", "caring", "confusion",
    "curiosity", "desire", "disappointment", "disapproval", "disgust", "embarrassment",
    "excitement", "fear", "gratitude", "grief", "joy", "love", "nervousness", "optimism",
    "pride", "realization", "relief", "remorse", "sadness", "surprise", "neutral",
]

# emotion -> (mood, tags, base intensity). Earlier entries win when a comment has several.
EMOTION_MAP = {
    "grief": ("sad", ["grief"], 75),
    "sadness": ("sad", [], 55),
    "remorse": ("confession", [], 50),
    "fear": ("sad", ["anxiety"], 55),
    "nervousness": ("sad", ["anxiety"], 50),
    "disappointment": ("sad", ["self-doubt"], 45),
    "embarrassment": ("sad", [], 40),
    "anger": ("angry", ["venting"], 60),
    "disgust": ("angry", ["venting"], 50),
    "annoyance": ("angry", ["venting"], 35),
    "disapproval": ("angry", [], 30),
    "gratitude": ("happy", ["gratitude"], 35),
    "optimism": ("motivation", ["hope"], 35),
    "pride": ("happy", ["small-win"], 40),
    "relief": ("happy", ["hope"], 30),
    "joy": ("happy", [], 35),
    "excitement": ("happy", [], 40),
    "amusement": ("happy", [], 20),
    "love": ("happy", [], 35),
    "admiration": ("happy", [], 25),
    "approval": ("happy", [], 15),
    "caring": ("happy", [], 25),
    "desire": ("random", [], 15),
    "curiosity": ("random", [], 10),
    "confusion": ("random", [], 15),
    "surprise": ("random", [], 20),
    "realization": ("random", [], 10),
    "neutral": ("random", [], 5),
}
PRIORITY = list(EMOTION_MAP)


def map_row(text: str, label_ids: list[int]) -> dict | None:
    names = [LABELS[i] for i in label_ids]
    if not names:
        return None
    best = min(names, key=PRIORITY.index)
    mood, tags, intensity = EMOTION_MAP[best]
    tags = list(dict.fromkeys(tags + [t for n in names for t in EMOTION_MAP[n][1] if EMOTION_MAP[n][0] == mood]))[:3]
    intensity = min(100, intensity + 5 * (len(names) - 1))
    return {
        "text": text,
        "mood": mood,
        "tags": tags,
        "intensity": intensity,
        "risk": floor_risk(text, "none"),
        "toxicity": "none",
        "lang": "en",
        "source": "goemotions",
    }


def load_goemotions(limit: int = 10000, neutral_cap: int = 1800, seed: int = 7) -> list[dict]:
    from datasets import load_dataset

    ds = load_dataset("google-research-datasets/go_emotions", "simplified", cache_dir=str(CACHE))
    rows = []
    for split in ("train", "validation"):
        for item in ds[split]:
            text = item["text"].replace("[NAME]", "someone").replace("[RELIGION]", "religion").strip()
            if len(text) < 12:
                continue
            row = map_row(text, item["labels"])
            if row:
                rows.append(row)
    rng = random.Random(seed)
    rng.shuffle(rows)
    neutral = [r for r in rows if r["mood"] == "random"][:neutral_cap]
    others = [r for r in rows if r["mood"] != "random"]
    return (others[: limit - len(neutral)] + neutral)[:limit]


if __name__ == "__main__":
    data = load_goemotions()
    from collections import Counter
    print(len(data), Counter(r["mood"] for r in data))
