"""Task 3: training corpus checks. Run `python build_dataset.py` first."""
import json
from collections import Counter
from pathlib import Path

import pytest

from vibe_schema import MOODS, TAGS, RISK_LEVELS, TOX_LEVELS, LANG_STYLES, floor_risk, normalize

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
TESTSETS = HERE / "testsets"

# Hard-case quotas from the plan (counted on train + val by `source`).
QUOTAS = {
    "syn:hyperbole_crisis": 400,  # exam humor / ambiguous crisis wording
    "syn:sarcasm": 300,
    "syn:vent": 300,               # venting about absent people, not toxic
    "syn:toxic": 200,              # targeted abuse
    "syn:inject": 100,
    "syn:neutral": 500,
}


def read(name):
    path = DATA / f"{name}.jsonl"
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


@pytest.fixture(scope="module")
def train():
    return read("train")


@pytest.fixture(scope="module")
def val():
    return read("val")


def test_rows_validate(train, val):
    for row in train + val:
        assert row["text"].strip()
        assert row["mood"] in MOODS
        assert len(row["tags"]) <= 3 and all(t in TAGS for t in row["tags"]), row
        assert 0 <= row["intensity"] <= 100
        assert row["risk"] in RISK_LEVELS
        assert row["toxicity"] in TOX_LEVELS
        assert row["lang"] in LANG_STYLES
        assert row["source"]


def test_size_and_split(train, val):
    synthetic = [r for r in train + val if r["source"].startswith("syn:")]
    assert len(synthetic) >= 8000, len(synthetic)
    share = len(val) / (len(train) + len(val))
    assert 0.08 <= share <= 0.12, share


def test_hard_case_quotas(train, val):
    counts = Counter(r["source"] for r in train + val)
    for source, minimum in QUOTAS.items():
        assert counts[source] >= minimum, f"{source}: {counts[source]} < {minimum}"


def test_every_style_well_represented(train):
    counts = Counter(r["lang"] for r in train)
    for lang in LANG_STYLES:
        assert counts[lang] >= 1000, f"{lang}: {counts[lang]}"


def test_mood_balance(train):
    counts = Counter(r["mood"] for r in train)
    for mood in MOODS:
        assert counts[mood] > 0, mood
        assert counts[mood] / len(train) <= 0.30, f"{mood} is {counts[mood] / len(train):.0%}"


def test_risk_classes_present(train):
    counts = Counter(r["risk"] for r in train)
    assert counts["possible"] >= 600 and counts["high"] >= 150, counts


def test_labels_respect_safety_floor(train, val):
    for row in train + val:
        assert floor_risk(row["text"], row["risk"]) == row["risk"], row["text"]


def test_no_overlap_with_frozen_testsets(train, val):
    frozen = set()
    for path in TESTSETS.glob("*.jsonl"):
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                frozen.add(normalize(json.loads(line)["text"]).strip())
    leaked = [r["text"] for r in train + val if normalize(r["text"]).strip() in frozen]
    assert not leaked, f"{len(leaked)} test-set texts leaked into training data: {leaked[:3]}"


def test_no_duplicates(train, val):
    keys = [normalize(r["text"]).strip() for r in train + val]
    assert len(keys) == len(set(keys))
