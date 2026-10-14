import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Reads a post and returns its mood, vibe tags, intensity and a crisis flag.
 *
 * With ANTHROPIC_API_KEY set it asks Claude; otherwise (or if the call fails)
 * it uses keyword rules. The keyword crisis check always runs, so a post the
 * model misses is still caught.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MOODS = ["happy", "sad", "angry", "lonely", "relationship", "career", "motivation", "confession", "random"];

const VIBE_TAGS = [
  "loneliness", "anxiety", "heartbreak", "family", "friendship", "exam-stress", "work-stress",
  "burnout", "self-doubt", "body-image", "grief", "money", "health", "identity", "overthinking",
  "hope", "gratitude", "small-win", "venting", "need-advice",
];

const CRISIS_RESOURCES = [
  "India: Tele-MANAS 14416 (free, 24x7) or KIRAN 1800-599-0019.",
  "US & Canada: call or text 988.",
  "Anywhere: contact local emergency services or someone you trust nearby.",
];

const CRISIS_PATTERNS = [
  "end my life", "end it all", "want to die", "kill myself", "suicidal", "suicide",
  "self harm", "self-harm", "hurt myself", "no reason to live", "can’t go on", "can't go on",
  "want to disappear", "better off dead", "not worth living", "cutting myself",
];

const TOXICITY_KEYWORDS = [
  "kill you", "murder", "threat", "attack", "rape", "assault", "bomb", "terrorist", "shoot", "stab",
  "torture", "slur", "harass",
];

const MOOD_KEYWORDS: Record<string, string[]> = {
  happy: ["happy", "joy", "excited", "amazing", "wonderful", "grateful", "blessed", "awesome"],
  sad: ["sad", "depressed", "crying", "heartbroken", "grief", "loss", "tears", "miserable", "hopeless"],
  angry: ["angry", "furious", "rage", "hate", "pissed", "mad", "outraged", "frustrated"],
  lonely: ["alone", "lonely", "isolated", "nobody", "no friends", "no one", "ignored", "left out"],
  relationship: ["relationship", "boyfriend", "girlfriend", "partner", "dating", "breakup", "cheated", "crush"],
  career: ["job", "work", "career", "boss", "fired", "promotion", "interview", "salary", "layoff"],
  motivation: ["motivated", "goals", "dream", "inspire", "never give up", "push through"],
  confession: ["confession", "secret", "guilty", "admit", "never told", "confess", "regret"],
};

const TAG_KEYWORDS: Record<string, string[]> = {
  loneliness: ["alone", "lonely", "isolated", "nobody", "no one", "no friends", "ignored", "invisible"],
  anxiety: ["anxious", "anxiety", "panic", "worried", "nervous", "scared", "restless"],
  heartbreak: ["breakup", "broke up", "heartbroken", "cheated", "dumped", "ghosted"],
  family: ["family", "mom", "dad", "mother", "father", "parents", "brother", "sister"],
  friendship: ["friend", "friends", "bestie", "best friend"],
  "exam-stress": ["exam", "exams", "marks", "grades", "study", "semester", "college", "assignment"],
  "work-stress": ["work", "job", "boss", "office", "deadline", "coworker", "manager"],
  burnout: ["burnout", "burned out", "burnt out", "exhausted", "drained", "no energy"],
  "self-doubt": ["not good enough", "worthless", "useless", "failure", "imposter", "doubt myself"],
  "body-image": ["body", "weight", "fat", "ugly", "skinny", "mirror", "appearance"],
  grief: ["died", "death", "passed away", "grief", "funeral", "lost my"],
  money: ["money", "broke", "debt", "rent", "afford", "loan", "bills"],
  health: ["sick", "illness", "diagnosed", "hospital", "pain", "doctor", "therapy"],
  identity: ["who i am", "identity", "coming out", "queer", "trans", "lost myself"],
  overthinking: ["overthinking", "overthink", "can't stop thinking", "spiraling"],
  hope: ["hope", "hopeful", "better days", "getting better", "looking forward"],
  gratitude: ["grateful", "thankful", "blessed", "appreciate"],
  "small-win": ["small win", "finally did", "proud of myself", "i did it", "managed to"],
  venting: ["just venting", "need to vent", "rant", "had to get this out"],
  "need-advice": ["advice", "what should i do", "help me", "any tips", "how do i"],
};

type Analysis = {
  mood: string;
  vibe_tags: string[];
  intensity: number;
  is_crisis: boolean;
  crisis_resources: string[];
  toxicity: { isToxic: boolean; severity: "low" | "medium" | "high"; flags: string[] };
  source: "ai" | "local";
};

function keywordCrisis(lower: string) {
  return CRISIS_PATTERNS.some((p) => lower.includes(p));
}

function keywordToxicity(lower: string): Analysis["toxicity"] {
  const flags = TOXICITY_KEYWORDS.filter((kw) => lower.includes(kw));
  return {
    isToxic: flags.length > 0,
    severity: flags.length >= 3 ? "high" : flags.length === 2 ? "medium" : "low",
    flags,
  };
}

function analyzeLocally(text: string): Analysis {
  const lower = text.toLowerCase();

  let mood = "random";
  let best = 0;
  for (const [candidate, keywords] of Object.entries(MOOD_KEYWORDS)) {
    const score = keywords.reduce((sum, kw) => (lower.includes(kw) ? sum + kw.length : sum), 0);
    if (score > best) {
      best = score;
      mood = candidate;
    }
  }

  const tagHits = Object.entries(TAG_KEYWORDS)
    .map(([tag, kws]) => [tag, kws.filter((kw) => lower.includes(kw)).length] as const)
    .filter(([, hits]) => hits > 0)
    .sort((a, b) => b[1] - a[1]);

  const exclamations = (text.match(/!/g) ?? []).length;
  const intensity = Math.min(100, 30 + tagHits.length * 12 + exclamations * 5 + (best > 0 ? 10 : 0));
  const is_crisis = keywordCrisis(lower);

  return {
    mood,
    vibe_tags: tagHits.slice(0, 4).map(([tag]) => tag),
    intensity,
    is_crisis,
    crisis_resources: is_crisis ? CRISIS_RESOURCES : [],
    toxicity: keywordToxicity(lower),
    source: "local",
  };
}

const SYSTEM_PROMPT = `You read anonymous posts on a peer-support app where people share feelings they can't tell anyone.
Return ONLY a JSON object with these keys:
- "mood": one of ${JSON.stringify(MOODS)}
- "vibe_tags": 1 to 4 items from ${JSON.stringify(VIBE_TAGS)}, most relevant first
- "intensity": integer 0-100, how strongly the feeling comes through
- "is_crisis": true if the writer may be at risk of suicide or self-harm, including indirect hints
- "toxic_severity": "none", "low", "medium" or "high" for threats, harassment or hate aimed at others
No prose, no markdown.`;

async function analyzeWithClaude(text: string, apiKey: string): Promise<Partial<Analysis> & { toxic_severity?: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: Deno.env.get("VIBE_MODEL") ?? "claude-haiku-5-5",
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: text.slice(0, 4000) }],
      }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const raw: string = body?.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function merge(local: Analysis, ai: (Partial<Analysis> & { toxic_severity?: string }) | null): Analysis {
  if (!ai) return local;
  const mood = typeof ai.mood === "string" && MOODS.includes(ai.mood) ? ai.mood : local.mood;
  const tags = Array.isArray(ai.vibe_tags)
    ? [...new Set(ai.vibe_tags.filter((t): t is string => typeof t === "string" && VIBE_TAGS.includes(t)))].slice(0, 4)
    : [];
  const intensity = typeof ai.intensity === "number" ? Math.max(0, Math.min(100, Math.round(ai.intensity))) : local.intensity;
  const is_crisis = ai.is_crisis === true || local.is_crisis;
  const sev = ai.toxic_severity;
  const toxicity = sev === "low" || sev === "medium" || sev === "high"
    ? { isToxic: true, severity: sev, flags: local.toxicity.flags }
    : local.toxicity;

  return {
    mood,
    vibe_tags: tags.length ? tags : local.vibe_tags,
    intensity,
    is_crisis,
    crisis_resources: is_crisis ? CRISIS_RESOURCES : [],
    toxicity,
    source: "ai",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text field is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const local = analyzeLocally(text);
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    const result = apiKey ? merge(local, await analyzeWithClaude(text, apiKey)) : local;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
