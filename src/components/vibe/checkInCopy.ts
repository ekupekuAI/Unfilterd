import type { LangStyle } from '../../lib/vibe';

/**
 * Fixed, hand-written check-in copy (never AI-generated). Warm-friend voice, never preachy.
 * Hinglish and Telugu are reviewed by a native speaker before launch (model/testsets/REVIEW.md).
 */
export interface CheckInCopy {
  title: string;
  prompt: string;
  privateNote: string;
  options: { joking: string; overwhelmed: string; not_okay: string };
  responses: { joking: string; overwhelmed: string; not_okay: string };
  highTitle: string;
  highBody: string;
  trustedPerson: string;
  breathe: string;
  dismiss: string;
  close: string;
}

export const HELPLINES = [
  { name: 'Tele-MANAS', detail: '14416 · free, 24x7', tel: '14416' },
  { name: 'Vandrevala Foundation', detail: '+91 9999 666 555 · 24x7', tel: '+919999666555' },
  { name: 'US & Canada', detail: 'call or text 988', tel: '988' },
];

const EN: CheckInCopy = {
  title: 'Checking in, just between us',
  prompt: 'Hey, that sounded heavy. Were you joking, or are you actually not feeling okay right now?',
  privateNote: 'Only you can see this.',
  options: { joking: 'Just joking 😂', overwhelmed: "I'm really overwhelmed", not_okay: "I'm not okay" },
  responses: {
    joking: "Got it 😄 Exams and deadlines make everyone dramatic. If it ever stops being a joke, we're one tap away.",
    overwhelmed: "That's a lot to carry. Take one slow minute with us. And if it starts to feel unsafe, please talk to someone today.",
    not_okay: "Thank you for telling us. You don't have to handle this alone. Please reach out right now:",
  },
  highTitle: 'You matter. Please reach out now',
  highBody: "It sounds like you're in a lot of pain right now. Talking to someone really helps, and they're there right now:",
  trustedPerson: 'Or message someone you trust and tell them you need them tonight.',
  breathe: 'Breathe with me (1 min)',
  dismiss: 'Not now',
  close: 'Close',
};

const HINGLISH: CheckInCopy = {
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
};

const TELUGU: CheckInCopy = {
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
};

const BY_STYLE: Record<LangStyle, CheckInCopy> = {
  en: EN,
  hinglish: HINGLISH,
  devanagari: HINGLISH,
  telugu: TELUGU,
  tenglish: TELUGU,
};

export function getCheckInCopy(lang: LangStyle): CheckInCopy {
  return BY_STYLE[lang] ?? EN;
}
