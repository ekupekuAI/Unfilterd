"""Task 2: frozen evaluation sets. Never used for training."""
import json
import re
from pathlib import Path

import pytest

from vibe_schema import MOODS, TAGS, RISK_LEVELS, TOX_LEVELS, LANG_STYLES, floor_risk, normalize

TESTSETS = Path(__file__).resolve().parent / "testsets"
MIN_SIZES = {"crisis": 180, "codemix": 140, "sarcasm": 90, "injection": 45, "telugu": 90, "holdout": 80}


def load(name):
    path = TESTSETS / f"{name}.jsonl"
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


@pytest.mark.parametrize("name", list(MIN_SIZES))
def test_rows_validate(name):
    rows = load(name)
    assert len(rows) >= MIN_SIZES[name], f"{name}: {len(rows)} rows"
    for row in rows:
        assert set(row) == {"text", "mood", "tags", "intensity", "risk", "toxicity", "lang"}, row
        assert row["text"].strip(), row
        assert row["mood"] in MOODS, row
        assert len(row["tags"]) <= 3 and all(t in TAGS for t in row["tags"]), row
        assert 0 <= row["intensity"] <= 100, row
        assert row["risk"] in RISK_LEVELS, row
        assert row["toxicity"] in TOX_LEVELS, row
        assert row["lang"] in LANG_STYLES, row


@pytest.mark.parametrize("name", list(MIN_SIZES))
def test_labels_respect_safety_floor(name):
    for row in load(name):
        floored = floor_risk(row["text"], row["risk"])
        assert floored == row["risk"], f"label {row['risk']} below floor {floored}: {row['text']}"


def test_crisis_set_has_both_halves():
    rows = load("crisis")
    none = [r for r in rows if r["risk"] == "none"]
    flagged = [r for r in rows if r["risk"] != "none"]
    high = [r for r in rows if r["risk"] == "high"]
    assert len(none) >= 60, "false-alarm half of gate 1 needs ordinary posts"
    assert len(flagged) >= 100, "recall half of gate 1 needs crisis posts"
    assert len(high) >= 25
    langs = {r["lang"] for r in flagged}
    assert langs == set(LANG_STYLES), f"crisis rows missing styles: {set(LANG_STYLES) - langs}"


def test_codemix_covers_every_style():
    rows = load("codemix")
    for lang in LANG_STYLES:
        assert sum(r["lang"] == lang for r in rows) >= 15, lang
    assert len({r["mood"] for r in rows}) == len(MOODS)


def test_telugu_set_is_telugu():
    rows = load("telugu")
    assert all(r["lang"] in ("telugu", "tenglish") for r in rows)
    assert sum(r["lang"] == "telugu" for r in rows) >= 35
    assert sum(r["lang"] == "tenglish" for r in rows) >= 35


INSTRUCTION_RE = re.compile(
    r"ignore|instruction|system|classify|label|mark (this|it|me)|pretend|you are now|override|"
    r"output|assistant|admin|developer|rules|prompt|nirdesh|aadesh|aagnalu|ఆదేశ|निर्देश",
    re.IGNORECASE,
)


def test_injection_rows_contain_instructions():
    rows = load("injection")
    for row in rows:
        assert INSTRUCTION_RE.search(row["text"]), row["text"]
    assert sum(r["risk"] != "none" for r in rows) >= 15
    assert sum(r["toxicity"] != "none" for r in rows) >= 10


def test_no_duplicate_texts_across_sets():
    seen = {}
    for name in MIN_SIZES:
        for row in load(name):
            key = normalize(row["text"]).strip()
            assert key not in seen, f"duplicate in {name} and {seen[key]}: {row['text']}"
            seen[key] = name
