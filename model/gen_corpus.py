"""Compose the synthetic code-mix corpus from the hand-written phrase banks.

Every row's labels come from the fragments it was built from, then the shared
safety floor is applied so labels never sit below what the pattern layer enforces.
Run directly to print the quota table.
"""
from __future__ import annotations

import random
from collections import Counter

from corpus_banks import EN, HINGLISH
from corpus_banks_te import TENGLISH, TELUGU, DEVANAGARI
from vibe_schema import floor_risk, normalize

BANKS = {"en": EN, "hinglish": HINGLISH, "tenglish": TENGLISH, "telugu": TELUGU, "devanagari": DEVANAGARI}

# rows per language style for each generator: (standard, hyper_crisis, hyper_safe,
# crisis_soft, crisis_plan, sarcasm, vent, toxic, inject, neutral)
PLAN = {
    "en":         (1800, 100, 80, 160, 50, 80, 80, 60, 30, 130),
    "hinglish":   (2000, 100, 80, 160, 50, 80, 80, 60, 30, 130),
    "tenglish":   (2000, 100, 80, 160, 50, 80, 80, 60, 30, 130),
    "telugu":     (1300, 100, 80, 160, 50, 80, 80, 60, 30, 130),
    "devanagari": (1300, 100, 80, 160, 50, 80, 80, 60, 30, 130),
}
GENERATORS = ["standard", "hyperbole_crisis", "hyperbole_safe", "crisis_soft", "crisis_plan",
              "sarcasm", "vent", "toxic", "inject", "neutral"]

MOOD_WEIGHTS = {"sad": 22, "happy": 16, "lonely": 12, "relationship": 12, "career": 12,
                "angry": 10, "motivation": 8, "confession": 8}
MOOD_TAGS = {
    "sad": ["exam-stress", "self-doubt", "burnout", "grief", "overthinking", "anxiety", "family",
            "money", "health", "body-image", "comparison", "parental-pressure", "homesickness", "identity"],
    "lonely": ["loneliness", "friendship", "homesickness"],
    "relationship": ["heartbreak", "overthinking", "anxiety"],
    "career": ["placement-stress", "work-stress", "money"],
    "angry": ["venting", "work-stress", "friendship", "family", "exam-stress"],
    "confession": ["family", "friendship", "identity", "heartbreak", "self-doubt"],
    "motivation": ["exam-stress", "placement-stress", "self-doubt", "burnout"],
}
HAPPY_TAGS = ["small-win", "gratitude", "hope", "family", "friendship"]
BASE_INTENSITY = {"happy": 32, "sad": 55, "angry": 48, "lonely": 52, "relationship": 52,
                  "career": 52, "motivation": 38, "confession": 50, "random": 5}
STRUGGLE_MOOD = {"loneliness": "lonely", "friendship": "lonely", "homesickness": "lonely",
                 "placement-stress": "career", "work-stress": "career", "heartbreak": "relationship"}


def _join(*parts: str) -> str:
    text = " ".join(p for p in parts if p)
    return text.replace(" ,", ",").replace(" .", ".").replace(" ?", "?").strip()


def _clamp(value: int) -> int:
    return max(0, min(100, value))


class Composer:
    def __init__(self, lang: str, rng: random.Random):
        self.lang = lang
        self.b = BANKS[lang]
        self.rng = rng

    def pick(self, items):
        return self.rng.choice(items)

    def sit(self, tag):
        return self.pick(self.b["sit"][tag])

    def row(self, text, mood, tags, intensity, risk="none", tox="none", source="syn:standard"):
        tags = list(dict.fromkeys(tags))[:3]
        return {"text": text, "mood": mood, "tags": tags, "intensity": _clamp(intensity),
                "risk": floor_risk(text, risk), "toxicity": tox, "lang": self.lang, "source": source}

    def jitter(self, spread=10):
        return self.rng.randint(-spread, spread)

    # --- generators -------------------------------------------------------
    def standard(self):
        r, b = self.rng, self.b
        mood = r.choices(list(MOOD_WEIGHTS), weights=list(MOOD_WEIGHTS.values()))[0]
        if mood == "happy":
            tags = r.sample(HAPPY_TAGS, r.choice([1, 1, 2]))
            body = ", ".join(self.pick(b["sit_pos"][t]) for t in tags)
            text = _join(self.pick(b["open"]), body + ",", self.pick(b["feel"]["happy"]), self.pick(["", "", "🙂", "😊", "!!", "🎉"]))
            return self.row(text, mood, tags, BASE_INTENSITY[mood] + self.jitter())
        if mood == "motivation":
            struggle = self.pick(MOOD_TAGS["motivation"])
            text = _join(self.pick(b["open"]), self.sit(struggle) + ",", "but", self.pick(b["feel"]["motivation"]), self.pick(["", "💪", "🔥", ""]))
            if self.lang != "en":
                text = text.replace(" but ", " ")
            return self.row(text, mood, [struggle, "hope"], BASE_INTENSITY[mood] + self.jitter())
        tags = r.sample(MOOD_TAGS[mood], r.choice([1, 1, 2]))
        body = ", ".join(self.sit(t) for t in tags)
        lead = self.pick(b["confess"]) if mood == "confession" else self.pick(b["open"])
        text = _join(lead, body + ",", self.pick(b["feel"][mood]), self.pick(b["close"]))
        intensity = BASE_INTENSITY[mood] + 8 * (len(tags) - 1) + self.jitter()
        if r.random() < 0.15:
            text = _join(text, self.pick(b["advice"]))
            tags = tags + ["need-advice"]
        return self.row(text, mood, tags, intensity)

    def hyperbole_crisis(self):
        tag = self.pick(["exam-stress", "exam-stress", "placement-stress", "work-stress"])
        lead = self.sit(tag) + "," if self.rng.random() < 0.6 else ""
        text = _join(self.pick(self.b["open"]), lead, self.pick(self.b["hyper_crisis"]))
        mood = "career" if tag != "exam-stress" else "sad"
        return self.row(text, mood, [tag], 48 + self.jitter(8), risk="possible", source="syn:hyperbole_crisis")

    def hyperbole_safe(self):
        tag = self.pick(["exam-stress", "work-stress", "burnout"])
        lead = self.sit(tag) + "," if self.rng.random() < 0.5 else ""
        text = _join(self.pick(self.b["open"]), lead, self.pick(self.b["hyper_safe"]))
        return self.row(text, "sad", [tag], 38 + self.jitter(8), source="syn:hyperbole_safe")

    def crisis_soft(self):
        tags = []
        lead = ""
        if self.rng.random() < 0.6:
            tag = self.pick(["loneliness", "self-doubt", "burnout", "grief", "family", "exam-stress", "heartbreak", "money"])
            tags, lead = [tag], self.sit(tag) + ","
        text = _join(self.pick(self.b["open"]), lead, self.pick(self.b["crisis_soft"]), self.pick(["", "", "...", "🥀"]))
        mood = "lonely" if tags == ["loneliness"] else "sad"
        return self.row(text, mood, tags, 86 + self.jitter(6), risk="possible", source="syn:crisis_soft")

    def crisis_plan(self):
        lead = ""
        if self.rng.random() < 0.4:
            lead = self.sit(self.pick(["loneliness", "family", "self-doubt", "exam-stress", "heartbreak"])) + ","
        text = _join(lead, self.pick(self.b["crisis_plan"]))
        return self.row(text, "sad", [], 98 + self.rng.randint(0, 2), risk="high", source="syn:crisis_plan")

    def sarcasm(self):
        tag = self.pick(list(self.b["sit"]))
        if tag in ("venting", "need-advice"):
            tag = "loneliness"
        x = self.sit(tag)
        text = self.pick(self.b["sarcasm"]).format(x=x[0].lower() + x[1:] if self.lang == "en" else x)
        mood = STRUGGLE_MOOD.get(tag, "sad")
        return self.row(text, mood, [tag], 52 + self.jitter(8), source="syn:sarcasm")

    def vent(self):
        text = _join(self.pick(self.b["vent"]), self.pick(["", "", self.pick(self.b["feel"]["angry"])]), self.pick(["", "😤", "🙄", "ugh" if self.lang == "en" else ""]))
        return self.row(text, "angry", ["venting"], 45 + self.jitter(10), source="syn:vent")

    def toxic(self):
        phrase, severity = self.pick(self.b["toxic"])
        text = _join(self.pick(["", "", self.pick(self.b["open"])]), phrase, self.pick(["", "", "😡", "🤡"]))
        return self.row(text, "angry", [], 78 + self.jitter(10), tox=severity, source="syn:toxic")

    def inject(self):
        prefix = self.pick(self.b["inject"])
        inner = self.pick([self.crisis_soft, self.crisis_plan, self.toxic, self.standard, self.neutral])()
        inner["text"] = _join(prefix, inner["text"])
        inner["risk"] = floor_risk(inner["text"], inner["risk"])
        inner["source"] = "syn:inject"
        return inner

    def neutral(self):
        text = _join(self.pick(["", "", self.pick(self.b["open"])]), self.pick(self.b["neutral"]))
        return self.row(text, "random", ["need-advice"], 5 + self.rng.randint(0, 5), source="syn:neutral")


def generate(seed: int = 13) -> list[dict]:
    rng = random.Random(seed)
    rows, seen = [], set()
    for lang, counts in PLAN.items():
        composer = Composer(lang, rng)
        for name, target in zip(GENERATORS, counts):
            made, attempts = 0, 0
            while made < target and attempts < target * 30:
                attempts += 1
                row = getattr(composer, name)()
                key = normalize(row["text"]).strip()
                if key in seen:
                    continue
                seen.add(key)
                rows.append(row)
                made += 1
    return rows


if __name__ == "__main__":
    data = generate()
    print(len(data))
    print(Counter(r["source"] for r in data))
    print(Counter(r["lang"] for r in data))
    print(Counter(r["mood"] for r in data))
    print(Counter(r["risk"] for r in data))
