# Unfilterd

**Say it. Someone feels it too.**

Unfilterd is an anonymous place to say what you can't say anywhere else. AI reads the feeling behind a post, finds someone going through the same thing, and, if both people say yes, opens a private, anonymous chat between them.

## What's in it

| | |
|---|---|
| 🌌 **Cinematic opening** | A three.js scene: scattered lights gather into one glowing sphere before the app opens. Full length the first time, short after that, skipped for reduced-motion users. |
| ✨ **Vibe reading** | The `vibe-analyze` edge function reads mood, vibe tags (loneliness, exam stress, heartbreak and more), intensity and crisis risk. It uses Claude when a key is set and keyword rules otherwise. |
| 💞 **Vibe Matcher** | Opt in when you post. We pair you with someone whose recent post shares your tags. They accept or decline. On accept, both get a private chat with fresh anonymous nicknames. |
| 🧭 **Feed by feeling** | Filter the feed by the vibes you relate to. The choice is saved on your device. |
| 🌬️ **Breathe** | A guided breathing orb (Calm, Box, 4-7-8) for 1 to 5 minutes, with optional phone vibration. |
| 🛟 **Help** | Real helplines (India first, then 988, Samaritans, Find A Helpline) and a 5-4-3-2-1 grounding exercise. Works signed out. |

## Safety rules (enforced in the database)

- Posts with crisis language are flagged by a database trigger, even if the app says otherwise. They are never matched; the author sees helplines instead.
- People who turn matching off, have blocked each other, or are suspended are never paired.
- 5 match requests per person per day, and at most 3 pending requests waiting on anyone.
- Only the two participants can read or write a chat. Either can leave, or leave and block.

## Setup

1. Create a Supabase project and set these in `.env.local`:

   | Variable | Where to get it |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase → Project settings → API |
   | `VITE_SUPABASE_ANON_KEY` | Supabase → Project settings → API |

2. Apply every file in `supabase/migrations` in order.
3. Deploy the edge function: `supabase functions deploy vibe-analyze`.
4. Optional, for AI vibe reading: `supabase secrets set ANTHROPIC_API_KEY=...` (from console.anthropic.com). Without it, keyword rules are used.
5. Create the storage buckets `post-media` and `community-assets` (public read if you want previews without signed URLs).

```bash
npm install
npm run dev
```

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

Unfilterd is peer support, not a replacement for professional care.
