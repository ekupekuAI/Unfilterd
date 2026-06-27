import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TOXICITY_KEYWORDS = [
  "kill", "die", "murder", "threat", "suicide", "harm", "attack",
  "rape", "assault", "bomb", "terrorist", "shoot", "stab", "torture",
  "genocide", "ethnic cleansing", "mass shooting", "self-harm",
  "end my life", "end it all", "no reason to live",
  "abuse", "harass", "harassment", "spam", "hate", "slur",
];

const MOOD_KEYWORDS: Record<string, string[]> = {
  happy: ["happy", "joy", "excited", "amazing", "wonderful", "grateful", "blessed", "love it", "awesome", "fantastic", "elated", "thrilled", "ecstatic", "delighted", "cheerful"],
  sad: ["sad", "depressed", "crying", "heartbroken", "grief", "loss", "tears", "devastated", "miserable", "unhappy", "melancholy", "sorrow", "despair", "hopeless"],
  angry: ["angry", "furious", "rage", "hate", "pissed", "mad", "outraged", "frustrated", "livid", "infuriated", "irate", "seething", "enraged"],
  lonely: ["alone", "lonely", "isolated", "nobody", "no friends", "no one", "ignored", "abandoned", "forsaken", "left out", "excluded", "disconnected"],
  relationship: ["relationship", "boyfriend", "girlfriend", "partner", "dating", "marriage", "divorce", "ex", "breakup", "cheated", "love", "crush", "heart", "together"],
  career: ["job", "work", "career", "boss", "fired", "promotion", "interview", "salary", "coworker", "toxic workplace", "layoff", "resignation", "hired", "workplace"],
  motivation: ["motivated", "hustle", "goals", "dream", "inspire", "grind", "never give up", "push through", "strong", "determined", "ambition", "drive", "perseverance"],
  anxiety: ["anxious", "anxiety", "panic", "worried", "overthinking", "stressed", "stress", "nervous", "fear", "fearful", "burned out", "burnout", "restless"],
  confession: ["confession", "secret", "guilty", "admit", "never told", "confess", "came clean", "regret", "i lied", "the truth is", "honestly", "unpopular opinion"],
};

function detectMood(text: string): { mood: string; confidence: number }[] {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > 0) scores[mood] = score;
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total === 0) return [{ mood: "random", confidence: 0.5 }];

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([mood, score]) => ({
      mood,
      confidence: Math.round((score / total) * 100) / 100,
    }));
}

function detectToxicity(text: string): { isToxic: boolean; severity: "low" | "medium" | "high"; flags: string[] } {
  const lower = text.toLowerCase();
  const flags: string[] = [];

  for (const kw of TOXICITY_KEYWORDS) {
    if (lower.includes(kw)) flags.push(kw);
  }

  const severity = flags.length >= 3 ? "high" : flags.length >= 2 ? "medium" : flags.length >= 1 ? "low" as const : "low";

  return {
    isToxic: flags.length > 0,
    severity: flags.length > 0 ? severity : "low",
    flags,
  };
}

function detectCrisis(text: string): { isCrisis: boolean; resources: string[] } {
  const lower = text.toLowerCase();
  const crisisPatterns = [
    "end my life", "end it all", "want to die", "kill myself", "suicidal",
    "self harm", "self-harm", "hurt myself", "no reason to live", "can’t go on",
    "can't go on", "want to disappear", "better off dead",
  ];
  const isCrisis = crisisPatterns.some(pattern => lower.includes(pattern));
  return {
    isCrisis,
    resources: isCrisis ? [
      "If you're in the U.S. or Canada, call or text 988 for immediate help.",
      "If you're elsewhere, contact local emergency services or a trusted person nearby.",
    ] : [],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text field is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mood = detectMood(text);
    const toxicity = detectToxicity(text);
    const crisis = detectCrisis(text);

    return new Response(
      JSON.stringify({ mood, toxicity, crisis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
