import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabase', () => ({ supabase: { rpc: vi.fn(), functions: { invoke: vi.fn() } } }));

import { analyzeVibe, analyzeVibeLocally, detectLangByScript } from './vibe';

const API = 'https://vibe.example';

function serverReply(body: Record<string, unknown>) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }));
}

const ok = {
  mood: 'lonely',
  vibe_tags: ['loneliness', 'homesickness'],
  intensity: 55,
  risk: 'none',
  is_crisis: false,
  crisis_resources: [],
  toxicity: { isToxic: false, severity: 'low', flags: [] },
  lang_style: 'hinglish',
  source: 'ai',
};

describe('analyzeVibe', () => {
  beforeEach(() => vi.stubEnv('VITE_VIBE_API_URL', API));
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('maps a successful model response', async () => {
    const fetchMock = serverReply(ok);
    vi.stubGlobal('fetch', fetchMock);
    const result = await analyzeVibe('hostel me akela feel hota hai');
    expect(fetchMock).toHaveBeenCalledWith(`${API}/analyze`, expect.objectContaining({ method: 'POST' }));
    expect(result).toMatchObject({ mood: 'lonely', vibe_tags: ['loneliness', 'homesickness'], risk: 'none',
      is_crisis: false, lang_style: 'hinglish', source: 'ai' });
  });

  it('applies the safety floor even when the model says none', async () => {
    vi.stubGlobal('fetch', serverReply(ok));
    const result = await analyzeVibe('exam fail ho gaya toh mar jaunga 😂');
    expect(result.risk).toBe('possible');
    expect(result.is_crisis).toBe(true);
    expect(result.crisis_resources.length).toBeGreaterThan(0);
  });

  it('keeps a model-reported high risk', async () => {
    vi.stubGlobal('fetch', serverReply({ ...ok, risk: 'high', is_crisis: true }));
    const result = await analyzeVibe('I have written my letters');
    expect(result.risk).toBe('high');
  });

  it('falls back to local analysis when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
    const result = await analyzeVibe('naaku bathakalani ledu ra');
    expect(result.source).toBe('local');
    expect(result.risk).toBe('possible');
  });

  it('falls back on a server error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })));
    expect((await analyzeVibe('just a normal day')).source).toBe('local');
  });

  it('falls back on malformed JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', { status: 200 })));
    expect((await analyzeVibe('just a normal day')).source).toBe('local');
  });

  it('falls back when the model is too slow', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    })));
    const pending = analyzeVibe('just a normal day');
    await vi.advanceTimersByTimeAsync(3100);
    expect((await pending).source).toBe('local');
  });

  it('works locally when no model URL is configured', async () => {
    vi.stubEnv('VITE_VIBE_API_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const result = await analyzeVibe('I want to die');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.source).toBe('local');
    expect(result.risk).toBe('possible');
  });
});

describe('local fallback', () => {
  it('detects the script of the post', () => {
    expect(detectLangByScript('ఈ రోజు చాలా బాధగా ఉంది')).toBe('telugu');
    expect(detectLangByScript('आज बहुत थक गया हूं')).toBe('devanagari');
    expect(detectLangByScript('feeling low today')).toBe('en');
  });

  it('floors explicit intent to high', () => {
    expect(analyzeVibeLocally('I am going to kill myself tonight').risk).toBe('high');
  });

  it('matches keywords as whole words, not inside other words', () => {
    // "gay" inside Hinglish "gaya", "ex " inside "next", "mad" inside "made"
    const hinglish = analyzeVibeLocally('exam fail ho gaya, sab khatam sa lag raha');
    expect(hinglish.vibe_tags).not.toContain('identity');
    expect(analyzeVibeLocally('made a plan for next week').mood).not.toBe('angry');
    expect(analyzeVibeLocally('I came out to my parents today').vibe_tags).toContain('identity');
  });

  it('keeps ordinary posts at none', () => {
    const local = analyzeVibeLocally('kal exam hai yaar, thoda tension');
    expect(local.risk).toBe('none');
    expect(local.is_crisis).toBe(false);
  });
});
