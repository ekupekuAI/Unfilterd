"""Unfilterd Vibe v1 network: one multilingual encoder, six small heads."""
from __future__ import annotations

import json
from pathlib import Path

import torch
from torch import nn
from transformers import AutoModel, XLMRobertaTokenizerFast

from vibe_schema import MOODS, TAGS, TOX_LEVELS, RISK_LEVELS, LANG_STYLES

BACKBONE = "microsoft/Multilingual-MiniLM-L12-H384"
TOKENIZER = "xlm-roberta-base"  # the MiniLM multilingual checkpoint uses XLM-R's vocabulary
MAX_LEN = 128
HEAD_SIZES = {
    "mood": len(MOODS),
    "tags": len(TAGS),
    "intensity": 1,
    "toxicity": len(TOX_LEVELS),
    "risk": len(RISK_LEVELS),
    "lang": len(LANG_STYLES),
}
CACHE = str(Path(__file__).resolve().parent / "hf_cache")


def load_tokenizer(path: str | None = None) -> XLMRobertaTokenizerFast:
    if path:
        return XLMRobertaTokenizerFast.from_pretrained(path)
    return XLMRobertaTokenizerFast.from_pretrained(TOKENIZER, cache_dir=CACHE)


class VibeModel(nn.Module):
    def __init__(self, encoder: nn.Module):
        super().__init__()
        self.encoder = encoder
        hidden = encoder.config.hidden_size
        self.dropout = nn.Dropout(0.1)
        self.heads = nn.ModuleDict({name: nn.Linear(hidden, size) for name, size in HEAD_SIZES.items()})

    @classmethod
    def from_backbone(cls, freeze_embeddings: bool = True) -> "VibeModel":
        encoder = AutoModel.from_pretrained(BACKBONE, cache_dir=CACHE)
        if freeze_embeddings:
            encoder.embeddings.word_embeddings.weight.requires_grad_(False)
        return cls(encoder)

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> dict[str, torch.Tensor]:
        hidden = self.encoder(input_ids=input_ids, attention_mask=attention_mask).last_hidden_state
        mask = attention_mask.unsqueeze(-1).to(hidden.dtype)
        pooled = (hidden * mask).sum(1) / mask.sum(1).clamp(min=1.0)
        pooled = self.dropout(pooled)
        out = {name: head(pooled) for name, head in self.heads.items()}
        out["intensity"] = out["intensity"].squeeze(-1)
        return out

    def save(self, directory: Path, tokenizer, extra: dict | None = None) -> None:
        directory.mkdir(parents=True, exist_ok=True)
        self.encoder.save_pretrained(directory / "encoder")
        tokenizer.save_pretrained(directory / "tokenizer")
        torch.save(self.heads.state_dict(), directory / "heads.pt")
        config = {
            "moods": MOODS, "tags": TAGS, "toxicity": TOX_LEVELS, "risk": RISK_LEVELS,
            "lang": LANG_STYLES, "max_len": MAX_LEN, "backbone": BACKBONE, **(extra or {}),
        }
        (directory / "vibe_config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")

    @classmethod
    def load(cls, directory: Path) -> "VibeModel":
        encoder = AutoModel.from_pretrained(directory / "encoder")
        model = cls(encoder)
        model.heads.load_state_dict(torch.load(directory / "heads.pt", map_location="cpu"))
        return model
