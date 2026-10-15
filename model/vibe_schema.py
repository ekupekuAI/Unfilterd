"""Unfilterd Vibe v1 label taxonomy and the shared safety floor.

The safety patterns live in shared/safety_patterns.json so the server, the
client fallback and the database trigger all apply exactly the same list.
"""
from __future__ import annotations

import json
import unicodedata
from functools import lru_cache
from pathlib import Path

MOODS = [
    "happy", "sad", "angry", "lonely", "relationship",
    "career", "motivation", "confession", "random",
]

TAGS = [
    "loneliness", "anxiety", "heartbreak", "family", "friendship",
    "exam-stress", "work-stress", "burnout", "self-doubt", "body-image",
    "grief", "money", "health", "identity", "overthinking",
    "hope", "gratitude", "small-win", "venting", "need-advice",
    "placement-stress", "parental-pressure", "comparison", "homesickness",
]

RISK_LEVELS = ["none", "possible", "high"]
TOX_LEVELS = ["none", "low", "medium", "high"]
LANG_STYLES = ["en", "hinglish", "telugu", "tenglish", "devanagari"]

PATTERNS_PATH = Path(__file__).resolve().parents[1] / "shared" / "safety_patterns.json"

_ZERO_WIDTH = dict.fromkeys(map(ord, "​‌‍﻿"))
_APOSTROPHES = str.maketrans({"’": "'", "‘": "'", "ʼ": "'"})


def normalize(text: str) -> str:
    """NFC, lowercase, fold curly apostrophes, drop zero-width characters."""
    return (
        unicodedata.normalize("NFC", text or "")
        .translate(_ZERO_WIDTH)
        .translate(_APOSTROPHES)
        .lower()
    )


@lru_cache(maxsize=1)
def load_patterns() -> dict:
    data = json.loads(PATTERNS_PATH.read_text(encoding="utf-8"))
    return {
        "crisis": [normalize(r["pattern"]) for r in data["crisis"]],
        "crisis_explicit": [normalize(r["pattern"]) for r in data["crisis_explicit"]],
        "toxicity": [(normalize(r["pattern"]), r["flag"]) for r in data["toxicity"]],
        "profanity_whitelist": [normalize(w) for w in data["profanity_whitelist"]],
    }


def _rank(risk: str) -> int:
    return RISK_LEVELS.index(risk)


def floor_risk(text: str, model_risk: str) -> str:
    """Raise model_risk to the level the safety patterns require. Never lowers it."""
    patterns = load_patterns()
    norm = normalize(text)
    floor = "none"
    if any(p in norm for p in patterns["crisis_explicit"]):
        floor = "high"
    elif any(p in norm for p in patterns["crisis"]):
        floor = "possible"
    return model_risk if _rank(model_risk) >= _rank(floor) else floor
