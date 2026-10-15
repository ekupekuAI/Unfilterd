"""CPU inference for Unfilterd Vibe v1 (ONNX Runtime, no PyTorch).

The safety floor is applied after the model on the full raw text, so a crisis
phrase beyond the 128-token model window is still caught.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

HERE = Path(__file__).resolve().parent
BUNDLE = Path(os.environ.get("VIBE_BUNDLE", HERE.parent / "artifacts"))
os.environ.setdefault("VIBE_PATTERNS_PATH", str(BUNDLE / "safety_patterns.json"))
if str(HERE.parent) not in sys.path:  # vibe_schema / decision live one level up in the repo
    sys.path.insert(0, str(HERE.parent))

from decision import decide, load_thresholds  # noqa: E402

OUTPUTS = ["mood", "tags", "intensity", "toxicity", "risk", "lang"]
CRISIS_RESOURCES = [
    "India: Tele-MANAS 14416 (free, 24x7) or Vandrevala Foundation +91 9999 666 555 (24x7).",
    "US & Canada: call or text 988.",
    "Anywhere: contact local emergency services or someone you trust nearby.",
]


def _softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - x.max())
    return e / e.sum()


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1 / (1 + np.exp(-x))


class VibeAnalyzer:
    def __init__(self, bundle: Path = BUNDLE):
        config = json.loads((bundle / "vibe_config.json").read_text(encoding="utf-8"))
        options = ort.SessionOptions()
        options.intra_op_num_threads = int(os.environ.get("VIBE_THREADS", "2"))
        self.session = ort.InferenceSession(str(bundle / "vibe-v1-int8.onnx"), options, providers=["CPUExecutionProvider"])
        self.tokenizer = Tokenizer.from_file(str(bundle / "tokenizer.json"))
        self.tokenizer.enable_truncation(max_length=config["max_len"])
        self.thresholds = load_thresholds(bundle / "thresholds.json")

    def _probs(self, text: str) -> dict:
        enc = self.tokenizer.encode(text)
        ids = np.array([enc.ids], dtype=np.int64)
        mask = np.array([enc.attention_mask], dtype=np.int64)
        out = dict(zip(OUTPUTS, self.session.run(None, {"input_ids": ids, "attention_mask": mask})))
        return {"mood": _softmax(out["mood"][0]).tolist(), "tags": _sigmoid(out["tags"][0]).tolist(),
                "toxicity": _softmax(out["toxicity"][0]).tolist(), "risk": _softmax(out["risk"][0]).tolist(),
                "lang": _softmax(out["lang"][0]).tolist(), "intensity": float(_sigmoid(out["intensity"][0]) * 100)}

    def analyze(self, text: str) -> dict:
        if not any(ch.isalnum() for ch in text):
            labels = {"mood": "random", "tags": [], "intensity": 0, "risk": "none",
                      "toxicity": "none", "toxicity_flags": [], "lang": "en"}
        else:
            labels = decide(text, self._probs(text), self.thresholds)
        is_crisis = labels["risk"] != "none"
        severity = labels["toxicity"]
        return {
            "mood": labels["mood"],
            "vibe_tags": labels["tags"],
            "intensity": max(0, min(100, labels["intensity"])),
            "risk": labels["risk"],
            "is_crisis": is_crisis,
            "crisis_resources": CRISIS_RESOURCES if is_crisis else [],
            "toxicity": {"isToxic": severity != "none",
                         "severity": severity if severity != "none" else "low",
                         "flags": labels["toxicity_flags"]},
            "lang_style": labels["lang"],
            "source": "ai",
        }
