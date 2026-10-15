import { supabase } from './supabase';
import safetyPatterns from '../../shared/safety_patterns.json';
import type { Mood, VibeMatch } from '../types';

/**
 * Shared contract for the Vibe Matcher.
 *
 * - `analyzeVibe` reads a post and returns its mood, vibe tags, intensity and
 *   whether it looks like a crisis. It calls the `vibe-analyze` edge function
 *   and falls back to local keyword heuristics when the function is unreachable.
 * - `requestVibeMatch` / `respondToVibeMatch` wrap the database RPCs that pair
 *   two people feeling the same thing and open a private chat between them.
 */

export const VIBE_TAGS = [
  'loneliness',
  'anxiety',
  'heartbreak',
  'family',
  'friendship',
  'exam-stress',
  'work-stress',
  'burnout',
  'self-doubt',
  'body-image',
  'grief',
  'money',
  'health',
  'identity',
  'overthinking',
  'hope',
  'gratitude',
  'small-win',
  'venting',
  'need-advice',
  'placement-stress',
  'parental-pressure',
  'comparison',
  'homesickness',
] as const;

export type VibeTag = (typeof VIBE_TAGS)[number];

export const VIBE_TAG_LABELS: Record<VibeTag, string> = {
  loneliness: 'Loneliness',
  anxiety: 'Anxiety',
  heartbreak: 'Heartbreak',
  family: 'Family',
  friendship: 'Friendship',
  'exam-stress': 'Exam stress',
  'work-stress': 'Work stress',
  burnout: 'Burnout',
  'self-doubt': 'Self-doubt',
  'body-image': 'Body image',
  grief: 'Grief',
  money: 'Money',
  health: 'Health',
  identity: 'Identity',
  overthinking: 'Overthinking',
  hope: 'Hope',
  gratitude: 'Gratitude',
  'small-win': 'Small win',
  venting: 'Venting',
  'need-advice': 'Need advice',
  'placement-stress': 'Placement stress',
  'parental-pressure': 'Parental pressure',
  comparison: 'Comparison',
  homesickness: 'Homesickness',
};

export function isVibeTag(value: string): value is VibeTag {
  return (VIBE_TAGS as readonly string[]).includes(value);
}

export const CRISIS_RESOURCES = [
  'India: Tele-MANAS 14416 (free, 24x7) or Vandrevala Foundation +91 9999 666 555 (24x7).',
  'US & Canada: call or text 988.',
  'Anywhere: contact local emergency services or someone you trust nearby.',
];

export interface VibeToxicity {
  isToxic: boolean;
  severity: 'low' | 'medium' | 'high';
  flags: string[];
}

export interface VibeAnalysis {
  mood: Mood;
  vibe_tags: VibeTag[];
  /** 0-100, how strong the feeling reads. */
  intensity: number;
  is_crisis: boolean;
  crisis_resources: string[];
  toxicity: VibeToxicity;
  /** 'ai' when the edge function used a language model, 'local' for keyword heuristics. */
  source: 'ai' | 'local';
}

const MOOD_KEYWORDS: Record<Exclude<Mood, 'random'>, string[]> = {
  happy: ['happy', 'joy', 'excited', 'amazing', 'wonderful', 'grateful', 'blessed', 'love it', 'awesome'],
  sad: ['sad', 'depressed', 'crying', 'heartbroken', 'grief', 'loss', 'tears', 'miserable', 'hopeless'],
  angry: ['angry', 'furious', 'rage', 'hate', 'pissed', 'mad', 'outraged', 'frustrated'],
  lonely: ['alone', 'lonely', 'isolated', 'nobody', 'no friends', 'no one', 'ignored', 'left out'],
  relationship: ['relationship', 'boyfriend', 'girlfriend', 'partner', 'dating', 'marriage', 'divorce', 'breakup', 'cheated', 'crush'],
  career: ['job', 'work', 'career', 'boss', 'fired', 'promotion', 'interview', 'salary', 'coworker', 'layoff'],
  motivation: ['motivated', 'hustle', 'goals', 'dream', 'inspire', 'grind', 'never give up', 'push through'],
  confession: ['confession', 'secret', 'guilty', 'admit', 'never told', 'confess', 'came clean', 'regret'],
};

const TAG_KEYWORDS: Record<VibeTag, string[]> = {
  loneliness: ['alone', 'lonely', 'isolated', 'nobody', 'no one', 'no friends', 'ignored', 'left out', 'invisible'],
  anxiety: ['anxious', 'anxiety', 'panic', 'worried', 'nervous', 'scared', 'fear', 'restless', 'on edge'],
  heartbreak: ['breakup', 'broke up', 'heartbroken', 'ex ', 'cheated', 'dumped', 'ghosted', 'miss him', 'miss her'],
  family: ['family', 'mom', 'dad', 'mother', 'father', 'parents', 'brother', 'sister', 'home'],
  friendship: ['friend', 'friends', 'bestie', 'best friend', 'group', 'left out'],
  'exam-stress': ['exam', 'exams', 'test', 'marks', 'grades', 'study', 'studying', 'semester', 'college', 'assignment'],
  'work-stress': ['work', 'job', 'boss', 'office', 'deadline', 'coworker', 'manager', 'overtime'],
  burnout: ['burnout', 'burned out', 'burnt out', 'exhausted', 'drained', 'tired of everything', 'no energy'],
  'self-doubt': ['not good enough', 'worthless', 'useless', 'failure', 'imposter', 'self-doubt', 'doubt myself', 'can\'t do anything'],
  'body-image': ['body', 'weight', 'fat', 'ugly', 'skinny', 'look', 'mirror', 'appearance'],
  grief: ['died', 'death', 'passed away', 'grief', 'funeral', 'lost my', 'miss them'],
  money: ['money', 'broke', 'debt', 'rent', 'salary', 'afford', 'loan', 'bills'],
  health: ['sick', 'illness', 'diagnosed', 'hospital', 'pain', 'doctor', 'therapy', 'medication'],
  identity: ['who i am', 'identity', 'coming out', 'gay', 'queer', 'trans', 'don\'t know myself', 'lost myself'],
  overthinking: ['overthinking', 'overthink', 'can\'t stop thinking', 'in my head', 'spiraling', 'ruminating'],
  hope: ['hope', 'hopeful', 'better days', 'getting better', 'looking forward', 'maybe things'],
  gratitude: ['grateful', 'thankful', 'blessed', 'appreciate', 'lucky'],
  'small-win': ['small win', 'finally did', 'proud of myself', 'i did it', 'managed to', 'first time in'],
  venting: ['just venting', 'need to vent', 'rant', 'ranting', 'had to get this out', 'ugh'],
  'need-advice': ['advice', 'what should i do', 'help me', 'any tips', 'how do i', 'what do i do'],
  'placement-stress': ['placement', 'placements', 'campus drive', 'no offer', 'offer letter', 'internship', 'package', 'shortlist', 'rejected again'],
  'parental-pressure': ['my parents want', 'parents expect', 'papa ne', 'mummy ne', 'ghar wale', 'parents force', 'amma nanna', 'family pressure', 'disappoint my parents'],
  comparison: ['log kya kahenge', 'everyone else is', 'compared to', 'sharma ji', 'cousin got', 'friends got placed', 'behind everyone', 'better than me'],
  homesickness: ['homesick', 'miss home', 'ghar ki yaad', 'miss my mom', 'miss amma', 'hostel food', 'far from home', 'want to go home', 'intiki vellali'],
};

export type Risk = 'none' | 'possible' | 'high';
const RISK_ORDER: Risk[] = ['none', 'possible', 'high'];

/** Same normalisation as the server and DB: NFC, apostrophes folded, no zero-width chars, lowercase. */
function normalizeForSafety(text: string): string {
  return (text ?? '')
    .normalize('NFC')
    .replace(/[​‌‍﻿]/g, '')
    .replace(/[’‘ʼ]/g, "'")
    .toLowerCase();
}

const CRISIS_PATTERNS = safetyPatterns.crisis.map(row => normalizeForSafety(row.pattern));
const CRISIS_EXPLICIT_PATTERNS = safetyPatterns.crisis_explicit.map(row => normalizeForSafety(row.pattern));
const TOXICITY_PATTERNS = safetyPatterns.toxicity.map(row => ({ pattern: normalizeForSafety(row.pattern), flag: row.flag }));

/**
 * Raise a risk level to what the shared safety patterns require. Never lowers it.
 * The database trigger applies the same list again server-side.
 */
export function applyRiskFloor(text: string, risk: Risk): Risk {
  const norm = normalizeForSafety(text);
  let floor: Risk = 'none';
  if (CRISIS_EXPLICIT_PATTERNS.some(pattern => norm.includes(pattern))) floor = 'high';
  else if (CRISIS_PATTERNS.some(pattern => norm.includes(pattern))) floor = 'possible';
  return RISK_ORDER.indexOf(risk) >= RISK_ORDER.indexOf(floor) ? risk : floor;
}

export function detectCrisisLocally(text: string): boolean {
  return applyRiskFloor(text, 'none') !== 'none';
}

/** Keyword fallback used when the edge function is unreachable. */
export function analyzeVibeLocally(text: string): VibeAnalysis {
  const lower = text.toLowerCase();

  let mood: Mood = 'random';
  let bestMoodScore = 0;
  for (const [candidate, keywords] of Object.entries(MOOD_KEYWORDS) as [Mood, string[]][]) {
    const score = keywords.reduce((sum, kw) => (lower.includes(kw) ? sum + kw.length : sum), 0);
    if (score > bestMoodScore) {
      bestMoodScore = score;
      mood = candidate;
    }
  }

  const tagScores = (Object.entries(TAG_KEYWORDS) as [VibeTag, string[]][])
    .map(([tag, keywords]) => [tag, keywords.filter(kw => lower.includes(kw)).length] as const)
    .filter(([, hits]) => hits > 0)
    .sort((a, b) => b[1] - a[1]);
  const vibe_tags = tagScores.slice(0, 4).map(([tag]) => tag);

  const exclamations = (text.match(/!/g) ?? []).length;
  const caps = (text.match(/[A-Z]{3,}/g) ?? []).length;
  const intensity = Math.min(100, 30 + tagScores.length * 12 + exclamations * 5 + caps * 5 + (bestMoodScore > 0 ? 10 : 0));

  const normForSafety = normalizeForSafety(text);
  const flags = [...new Set(TOXICITY_PATTERNS.filter(row => normForSafety.includes(row.pattern)).map(row => row.flag))];
  const is_crisis = detectCrisisLocally(text);

  return {
    mood,
    vibe_tags,
    intensity,
    is_crisis,
    crisis_resources: is_crisis ? CRISIS_RESOURCES : [],
    toxicity: {
      isToxic: flags.length > 0,
      severity: flags.length >= 3 ? 'high' : flags.length === 2 ? 'medium' : 'low',
      flags,
    },
    source: 'local',
  };
}

const MOODS: Mood[] = ['happy', 'sad', 'angry', 'lonely', 'relationship', 'career', 'motivation', 'confession', 'random'];

function normalizeAnalysis(raw: unknown, text: string): VibeAnalysis {
  const local = analyzeVibeLocally(text);
  if (!raw || typeof raw !== 'object') return local;
  const data = raw as Partial<VibeAnalysis> & { crisis_resources?: unknown; vibe_tags?: unknown };

  const mood = typeof data.mood === 'string' && MOODS.includes(data.mood as Mood) ? (data.mood as Mood) : local.mood;
  const vibe_tags = Array.isArray(data.vibe_tags)
    ? Array.from(new Set(data.vibe_tags.filter((t): t is VibeTag => typeof t === 'string' && isVibeTag(t)))).slice(0, 5)
    : local.vibe_tags;
  const intensity = typeof data.intensity === 'number' && Number.isFinite(data.intensity)
    ? Math.max(0, Math.min(100, Math.round(data.intensity)))
    : local.intensity;
  // The local crisis check always applies, even when the model missed it.
  const is_crisis = Boolean(data.is_crisis) || local.is_crisis;
  const toxicity = data.toxicity && typeof data.toxicity === 'object' ? { ...local.toxicity, ...data.toxicity } : local.toxicity;

  return {
    mood,
    vibe_tags: vibe_tags.length ? vibe_tags : local.vibe_tags,
    intensity,
    is_crisis,
    crisis_resources: is_crisis ? CRISIS_RESOURCES : [],
    toxicity,
    source: data.source === 'ai' ? 'ai' : 'local',
  };
}

/**
 * Analyze a post. Never throws: on any failure it returns the local analysis.
 */
export async function analyzeVibe(text: string, timeoutMs = 8000): Promise<VibeAnalysis> {
  const trimmed = text.trim();
  if (!trimmed) return analyzeVibeLocally('');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { data, error } = await supabase.functions.invoke('vibe-analyze', {
      body: { text: trimmed },
      signal: controller.signal,
    });
    if (error) return analyzeVibeLocally(trimmed);
    return normalizeAnalysis(data, trimmed);
  } catch {
    return analyzeVibeLocally(trimmed);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask the database to pair this post's author with someone feeling the same thing.
 * Returns the created match, or null when nobody suitable is around right now.
 */
export async function requestVibeMatch(postId: string): Promise<{ match: VibeMatch | null; error: string | null }> {
  const { data, error } = await supabase.rpc('find_vibe_match', { p_post_id: postId });
  if (error) return { match: null, error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  return { match: (row as VibeMatch | null) ?? null, error: null };
}

/**
 * Accept or decline a pending match. On accept the RPC returns the conversation id.
 */
export async function respondToVibeMatch(
  matchId: string,
  accept: boolean,
): Promise<{ conversationId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('respond_vibe_match', { p_match_id: matchId, p_accept: accept });
  if (error) return { conversationId: null, error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  const conversationId = row && typeof row === 'object' && 'conversation_id' in row
    ? ((row as { conversation_id: string | null }).conversation_id ?? null)
    : typeof row === 'string' ? row : null;
  return { conversationId, error: null };
}

const ALIAS_ADJECTIVES = ['Quiet', 'Gentle', 'Kind', 'Brave', 'Soft', 'Calm', 'Warm', 'Steady', 'Hopeful', 'Honest', 'Patient', 'Bright'];
const ALIAS_NOUNS = ['Moon', 'River', 'Cloud', 'Willow', 'Ember', 'Harbor', 'Comet', 'Meadow', 'Lantern', 'Tide', 'Sparrow', 'Pine'];

/**
 * Stable anonymous nickname for the other person in a chat. Derived from the
 * conversation and the person, so it never reveals their username and differs
 * between chats.
 */
export function chatAlias(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const n = Math.abs(hash);
  return `${ALIAS_ADJECTIVES[n % ALIAS_ADJECTIVES.length]} ${ALIAS_NOUNS[Math.floor(n / 12) % ALIAS_NOUNS.length]}`;
}

export function tagLabel(tag: string) {
  return isVibeTag(tag) ? VIBE_TAG_LABELS[tag] : tag;
}
