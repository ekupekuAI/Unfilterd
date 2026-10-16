---
title: Unfilterd Vibe
emoji: 💜
colorFrom: purple
colorTo: pink
sdk: docker
app_port: 7860
pinned: false
---

# Unfilterd Vibe v1 — inference server

`POST /analyze {"text": "..."}` → mood, feeling tags, intensity, crisis risk (`none` / `possible` / `high`),
toxicity and language style. `GET /health` → `{"ok": true, "model": "vibe-v1"}`.

- **Model:** fine-tuned from `intfloat/multilingual-e5-base`, exported to ONNX (int8 embeddings,
  100% agreement with the trained model). Downloaded from the `vibe-v1` GitHub Release at build time.
- **Safety:** the shared five-language pattern floor runs after the model on the full text; it can only
  raise risk. The app and the database apply the same list again.
- **Privacy:** post text is never logged or stored. Only method, path, status and latency are logged.
- **CORS:** only `https://unfilterd.vercel.app` and local development (`VIBE_ALLOWED_ORIGINS` to change).

## Why a Hugging Face Space and not Vercel
The bundle is ~550 MB; Vercel's free Python functions cap at 250 MB. Hugging Face Spaces (free CPU,
2 vCPU / 16 GB) fit it with room to spare. The free tier sleeps after ~48 h without traffic; the first
request after that takes ~30–60 s, during which the app falls back to its local safety check.

## Deploy / update
From the repo root: `model/.venv/Scripts/python model/server/deploy_space.py` (needs `HF_TOKEN` in `.env`).
