"""Task 1: shared taxonomy + safety pattern source of truth."""
import json
from pathlib import Path

import pytest

from vibe_schema import (
    normalize,
    MOODS,
    TAGS,
    RISK_LEVELS,
    TOX_LEVELS,
    LANG_STYLES,
    floor_risk,
)

PATTERNS_PATH = Path(__file__).resolve().parents[1] / "shared" / "safety_patterns.json"


def load_patterns():
    return json.loads(PATTERNS_PATH.read_text(encoding="utf-8"))


def test_constants_exact():
    assert MOODS == [
        "happy", "sad", "angry", "lonely", "relationship",
        "career", "motivation", "confession", "random",
    ]
    assert len(TAGS) == 24
    for new in ("placement-stress", "parental-pressure", "comparison", "homesickness"):
        assert new in TAGS
    assert RISK_LEVELS == ["none", "possible", "high"]
    assert TOX_LEVELS == ["none", "low", "medium", "high"]
    assert LANG_STYLES == ["en", "hinglish", "telugu", "tenglish", "devanagari"]


def test_patterns_file_shape_and_quotas():
    data = load_patterns()
    for key in ("crisis", "crisis_explicit", "toxicity", "profanity_whitelist"):
        assert key in data, key

    crisis = data["crisis"]
    per_lang = {lang: 0 for lang in LANG_STYLES}
    for row in crisis:
        assert row["pattern"] == row["pattern"].lower()
        assert row["lang"] in LANG_STYLES
        per_lang[row["lang"]] += 1
    for lang, count in per_lang.items():
        assert count >= 15, f"need >=15 crisis patterns for {lang}, have {count}"

    assert len(data["crisis_explicit"]) >= 8
    for row in data["crisis_explicit"]:
        assert row["lang"] in LANG_STYLES
        assert row["pattern"] == row["pattern"].lower()

    assert len(data["toxicity"]) >= 20
    for row in data["toxicity"]:
        assert row["flag"]
        assert row["pattern"] == row["pattern"].lower()

    assert len(data["profanity_whitelist"]) >= 4


def test_no_duplicate_patterns():
    data = load_patterns()
    crisis_all = [r["pattern"] for r in data["crisis"]] + [
        r["pattern"] for r in data["crisis_explicit"]
    ]
    assert len(crisis_all) == len(set(crisis_all)), "duplicate crisis pattern"
    tox = [r["pattern"] for r in data["toxicity"]]
    assert len(tox) == len(set(tox)), "duplicate toxicity pattern"


def test_floor_risk_ordinary_text_untouched():
    assert floor_risk("kal exam hai yaar", "none") == "none"


def test_floor_risk_ambiguous_crisis_floors_to_possible():
    assert floor_risk("exam fail ho gaya toh mar jaunga 😂", "none") == "possible"


def test_floor_risk_mixed_script():
    text = "ఈ రోజు చాలా బాధగా ఉంది and honestly mar jaunga"
    assert floor_risk(text, "none") == "possible"


def test_floor_risk_explicit_intent_is_high():
    assert floor_risk("I am going to kill myself tonight", "none") == "high"


def test_floor_risk_case_insensitive():
    assert floor_risk("MAR JAUNGA", "none") == "possible"


@pytest.mark.parametrize(
    "text",
    ["hello", "mar jaunga", "I am going to kill myself tonight", ""],
)
def test_floor_risk_never_lowers(text):
    assert floor_risk(text, "high") == "high"


def test_floor_risk_keeps_possible_when_no_match():
    assert floor_risk("totally fine text", "possible") == "possible"


@pytest.mark.parametrize("text", ["i want to\ndie", "i want  to   die", "I WANT TO DIE!!!", "ＫＩＬＬ ＭＹＳＥＬＦ", "selfharm again"])
def test_normalisation_collapses_spacing_punctuation_and_width(text):
    assert floor_risk(text, "none") != "none"


def test_widened_list_and_explicit_tier():
    assert floor_risk("mujhe marna hai", "none") == "possible"
    assert floor_risk("I will kill myself tonight", "none") == "high"
    assert floor_risk("if I fail again I'm literally going to kill myself lol", "none") == "possible"
    assert floor_risk("this assignment is killing me lol", "none") == "none"


def test_normalisation_parity_cases():
    cases = json.loads((Path(__file__).resolve().parents[1] / "shared" / "normalize_cases.json").read_text(encoding="utf-8"))
    for raw, expected in cases:
        assert normalize(raw) == expected, raw
