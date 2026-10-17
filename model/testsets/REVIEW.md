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

This is the private card shown to someone whose post might signal a crisis.
Same question for every line: would a warm friend actually say this? Is anything awkward,
too formal, or wrong? (Source: `src/components/vibe/checkInCopy.ts`.)

### Hinglish
```
title: 'Bas check kar rahe hai, sirf humare beech',
prompt: 'Yaar, yeh thoda heavy laga. Mazaak tha, ya sach me abhi theek nahi lag raha?',
privateNote: 'Yeh sirf tum dekh sakte ho.',
options: { joking: 'Bas mazaak tha 😂', overwhelmed: 'Sab bohot zyada ho gaya hai', not_okay: 'Main theek nahi hu' },
responses: {
joking: 'Samajh gaye 😄 exams kisi ko bhi dramatic bana dete hai. Kabhi mazaak na lage, toh hum yahi hai.',
overwhelmed: 'Itna sab ek saath bohot hota hai. Ek minute saath me dheere saans lete hai? Aur agar kabhi unsafe lage, toh aaj hi kisi se baat karna.',
not_okay: 'Batane ke liye shukriya. Tumhe yeh akele nahi jhelna hai. Abhi kisi se baat karo:',
},
highTitle: 'Tum important ho. Abhi kisi se baat karo',
highBody: 'Lag raha hai abhi bohot dard hai. Kisi se baat karna sach me madad karta hai, aur woh abhi available hai:',
trustedPerson: 'Ya kisi apne ko message karo ki aaj raat tumhe unki zarurat hai.',
breathe: 'Mere saath saans lo (1 min)',
dismiss: 'Abhi nahi',
close: 'Band karo',
```

### Telugu
```
title: 'నీతో మాత్రమే, ఒకసారి అడుగుతున్నాం',
prompt: 'అది కొంచెం బరువుగా అనిపించింది. సరదాగా అన్నావా, లేక నిజంగా ఇప్పుడు బాగాలేదా?',
privateNote: 'ఇది నువ్వు మాత్రమే చూడగలవు.',
options: { joking: 'సరదాగా అన్నా 😂', overwhelmed: 'చాలా ఒత్తిడిగా ఉంది', not_okay: 'నేను బాగాలేను' },
responses: {
joking: 'సరే 😄 పరీక్షలు ఎవరినైనా అలా మాట్లాడిస్తాయి. ఎప్పుడైనా సరదా కాకపోతే, మేము ఇక్కడే ఉన్నాం.',
overwhelmed: 'ఇంత ఒకేసారి మోయడం కష్టమే. ఒక్క నిమిషం నెమ్మదిగా ఊపిరి తీసుకుందామా? ఎప్పుడైనా సురక్షితంగా లేదనిపిస్తే, ఈ రోజే ఎవరితోనైనా మాట్లాడు.',
not_okay: 'చెప్పినందుకు థాంక్స్. ఇది నువ్వు ఒంటరిగా మోయాల్సిన అవసరం లేదు. ఇప్పుడే ఎవరితోనైనా మాట్లాడు:',
},
highTitle: 'నువ్వు ముఖ్యం. ఇప్పుడే ఎవరినైనా సంప్రదించు',
highBody: 'ఇప్పుడు చాలా బాధలో ఉన్నట్టు అనిపిస్తోంది. ఎవరితోనైనా మాట్లాడటం నిజంగా సహాయపడుతుంది, వాళ్ళు ఇప్పుడే అందుబాటులో ఉన్నారు:',
trustedPerson: 'లేదా నీకు నమ్మకమైన ఎవరికైనా, ఈ రాత్రి నువ్వు వాళ్ళ అవసరం ఉందని మెసేజ్ చెయ్యి.',
breathe: 'నాతో ఊపిరి తీసుకో (1 నిమి)',
dismiss: 'ఇప్పుడు కాదు',
close: 'మూసేయి',
```
