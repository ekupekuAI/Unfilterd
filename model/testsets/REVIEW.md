# Telugu / Tenglish review (about 15 minutes)

These posts grade the model; they are never used to train it. Labels written by a
non-native speaker can be wrong, and a wrong label here means we'd grade the model
against the wrong answer. Please read each row in `telugu.jsonl` and fix anything
that feels off.

## What to check in each row

| Field | Question to ask |
|---|---|
| `text` | Would a real Telugu student write it like this? Fix anything unnatural. |
| `mood` | Is this the main feeling? (happy, sad, angry, lonely, relationship, career, motivation, confession, random) |
| `tags` | Up to 3 feelings. Anything wrong or missing? |
| `risk` | `none` = ordinary post, `possible` = check in gently, `high` = clear intent or plan. |
| `toxicity` | Only for posts that attack someone else. |

**The rows that matter most** are the ones marked `"risk": "possible"` and the
threat row. If any of those reads as harmless slang to you, or if a row marked
`none` would worry you as a friend, say so.

## How to send corrections

Easiest: reply in chat with the row's first few words and what should change,
e.g. `"chachipovali anipistundi" — risk should stay possible, tag is loneliness not need-advice`.

## Also review: the check-in card copy

The Telugu and Hinglish text for the private check-in card will be added below once
it's written (plan Task 9). Same question: would a warm friend actually say this?
