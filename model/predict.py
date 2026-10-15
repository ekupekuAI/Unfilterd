"""PyTorch inference for a trained checkpoint: raw probabilities plus the decision
rules (thresholds + safety floor) shared by evaluation and the server."""
from __future__ import annotations

import json
from pathlib import Path

import torch

from decision import DEFAULT_THRESHOLDS, decide, load_thresholds  # noqa: F401  (re-exported)
from vibe_model import VibeModel, load_tokenizer


class Predictor:
    def __init__(self, ckpt: Path, device: str | None = None):
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.model = VibeModel.load(ckpt).to(self.device).eval()
        self.tokenizer = load_tokenizer(str(ckpt / "tokenizer"))
        self.max_len = json.loads((ckpt / "vibe_config.json").read_text(encoding="utf-8"))["max_len"]

    @torch.no_grad()
    def probs(self, texts: list[str], batch_size: int = 64) -> list[dict]:
        results = []
        for i in range(0, len(texts), batch_size):
            chunk = texts[i:i + batch_size]
            enc = self.tokenizer(chunk, padding=True, truncation=True, max_length=self.max_len, return_tensors="pt").to(self.device)
            out = self.model(enc["input_ids"], enc["attention_mask"])
            mood = out["mood"].float().softmax(-1).cpu()
            tags = out["tags"].float().sigmoid().cpu()
            tox = out["toxicity"].float().softmax(-1).cpu()
            risk = out["risk"].float().softmax(-1).cpu()
            lang = out["lang"].float().softmax(-1).cpu()
            intensity = out["intensity"].float().sigmoid().cpu() * 100
            for j in range(len(chunk)):
                results.append({"mood": mood[j].tolist(), "tags": tags[j].tolist(), "toxicity": tox[j].tolist(),
                                "risk": risk[j].tolist(), "lang": lang[j].tolist(), "intensity": float(intensity[j])})
        return results

