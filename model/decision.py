"""Turn model probabilities into labels. Torch-free, shared by evaluation and the server."""
from __future__ import annotations

import json
from pathlib import Path

from vibe_schema import MOODS, TAGS, TOX_LEVELS, LANG_STYLES, floor_risk, toxicity_flags

DEFAULT_THRESHOLDS = {"tag_threshold": 0.5, "risk_possible": 0.5, "risk_high": 0.5}


def _argmax(values: list[float]) -> int:
    return max(range(len(values)), key=values.__getitem__)


def decide(text: str, p: dict, th: dict) -> dict:
    """Risk uses tuned thresholds and then the safety floor (never lowered).
    A toxicity pattern match raises severity to at least 'low' so it reaches review."""
    _, p_possible, p_high = p["risk"]
    if p_high >= th["risk_high"]:
        risk = "high"
    elif p_possible + p_high >= th["risk_possible"]:
        risk = "possible"
    else:
        risk = "none"
    risk = floor_risk(text, risk)

    ranked = sorted(range(len(TAGS)), key=lambda i: p["tags"][i], reverse=True)
    tags = [TAGS[i] for i in ranked[:3] if p["tags"][i] >= th["tag_threshold"]]

    toxicity = TOX_LEVELS[_argmax(p["toxicity"])]
    flags = toxicity_flags(text)
    if flags and toxicity == "none":
        toxicity = "low"

    return {
        "mood": MOODS[_argmax(p["mood"])],
        "tags": tags,
        "intensity": int(round(p["intensity"])),
        "risk": risk,
        "toxicity": toxicity,
        "toxicity_flags": flags,
        "lang": LANG_STYLES[_argmax(p["lang"])],
    }


def load_thresholds(path: Path) -> dict:
    if path.exists():
        return {**DEFAULT_THRESHOLDS, **json.loads(path.read_text(encoding="utf-8"))}
    return dict(DEFAULT_THRESHOLDS)
