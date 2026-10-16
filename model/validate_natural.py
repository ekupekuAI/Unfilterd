"""Check hand-written natural training files: python validate_natural.py data_natural/<file>.jsonl ..."""
import json
import sys
from collections import Counter
from pathlib import Path

from vibe_schema import MOODS, TAGS, RISK_LEVELS, TOX_LEVELS, LANG_STYLES, floor_risk, normalize

KEYS = {"text", "mood", "tags", "intensity", "risk", "toxicity", "lang", "kind"}
KINDS = {"crisis", "crisis_plan", "hyperbole", "safe_idiom", "everyday", "sarcasm", "vent", "toxic", "neutral"}

errors, seen, kinds, moods = [], set(), Counter(), Counter()
paths = [Path(p) for p in sys.argv[1:]] or sorted(Path(__file__).parent.joinpath("data_natural").glob("*.jsonl"))
total = 0
for path in paths:
    for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        total += 1
        where = f"{path.name}:{n}"
        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            errors.append(f"{where} bad JSON: {exc}")
            continue
        if set(row) != KEYS:
            errors.append(f"{where} keys {sorted(row)} != {sorted(KEYS)}")
            continue
        if row["mood"] not in MOODS: errors.append(f"{where} mood {row['mood']!r}")
        bad_tags = [t for t in row["tags"] if t not in TAGS]
        if bad_tags or len(row["tags"]) > 3: errors.append(f"{where} tags {row['tags']}")
        if not isinstance(row["intensity"], int) or not 0 <= row["intensity"] <= 100: errors.append(f"{where} intensity")
        if row["risk"] not in RISK_LEVELS: errors.append(f"{where} risk {row['risk']!r}")
        if row["toxicity"] not in TOX_LEVELS: errors.append(f"{where} toxicity {row['toxicity']!r}")
        if row["lang"] not in LANG_STYLES: errors.append(f"{where} lang {row['lang']!r}")
        if row["kind"] not in KINDS: errors.append(f"{where} kind {row['kind']!r}")
        if row["risk"] in RISK_LEVELS and floor_risk(row["text"], row["risk"]) != row["risk"]:
            errors.append(f"{where} risk '{row['risk']}' is below the safety floor; use 'possible' or rephrase: {row['text']}")
        key = normalize(row["text"]).strip()
        if key in seen: errors.append(f"{where} duplicate text")
        seen.add(key)
        kinds[row["kind"]] += 1
        moods[row["mood"]] += 1

print(f"{total} rows in {len(paths)} file(s)")
print("kinds:", dict(kinds))
print("moods:", dict(moods))
if errors:
    print(f"\n{len(errors)} problem(s):")
    print("\n".join(errors[:60]))
    sys.exit(1)
print("OK")
