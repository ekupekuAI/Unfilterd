"""Export the best checkpoint to an int8 ONNX bundle for CPU serving.

    python export_onnx.py --ckpt checkpoints/best

Writes model/artifacts/: vibe-v1-int8.onnx, tokenizer.json, vibe_config.json,
thresholds.json, safety_patterns.json. Fails unless the int8 model agrees with
PyTorch on mood and risk for >= 99% of a validation sample.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from onnxruntime.quantization import QuantType, quantize_dynamic

from decision import decide, load_thresholds
from predict import Predictor
from vibe_model import VibeModel

HERE = Path(__file__).resolve().parent
ARTIFACTS = HERE / "artifacts"
OUTPUTS = ["mood", "tags", "intensity", "toxicity", "risk", "lang"]


class Wrapper(torch.nn.Module):
    def __init__(self, model: VibeModel):
        super().__init__()
        self.model = model

    def forward(self, input_ids, attention_mask):
        out = self.model(input_ids, attention_mask)
        return tuple(out[name] for name in OUTPUTS)


def onnx_probs(session: ort.InferenceSession, tokenizer, texts: list[str], max_len: int) -> list[dict]:
    enc = tokenizer(texts, padding=True, truncation=True, max_length=max_len, return_tensors="np")
    raw = session.run(None, {"input_ids": enc["input_ids"].astype(np.int64),
                             "attention_mask": enc["attention_mask"].astype(np.int64)})
    out = dict(zip(OUTPUTS, raw))

    def softmax(x):
        e = np.exp(x - x.max(-1, keepdims=True))
        return e / e.sum(-1, keepdims=True)

    sig = lambda x: 1 / (1 + np.exp(-x))  # noqa: E731
    return [{"mood": softmax(out["mood"][i]).tolist(), "tags": sig(out["tags"][i]).tolist(),
             "toxicity": softmax(out["toxicity"][i]).tolist(), "risk": softmax(out["risk"][i]).tolist(),
             "lang": softmax(out["lang"][i]).tolist(), "intensity": float(sig(out["intensity"][i]) * 100)}
            for i in range(len(texts))]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ckpt", type=Path, required=True)
    ap.add_argument("--sample", type=int, default=400)
    args = ap.parse_args()

    ARTIFACTS.mkdir(exist_ok=True)
    predictor = Predictor(args.ckpt, device="cpu")
    model = predictor.model.float().eval()
    max_len = predictor.max_len
    fp32 = ARTIFACTS / "vibe-v1-fp32.onnx"
    int8 = ARTIFACTS / "vibe-v1-int8.onnx"

    dummy = predictor.tokenizer(["export sample text"], return_tensors="pt")
    torch.onnx.export(
        Wrapper(model), (dummy["input_ids"], dummy["attention_mask"]), str(fp32),
        input_names=["input_ids", "attention_mask"], output_names=OUTPUTS,
        dynamic_axes={"input_ids": {0: "batch", 1: "seq"}, "attention_mask": {0: "batch", 1: "seq"},
                      **{name: {0: "batch"} for name in OUTPUTS}},
        opset_version=17, dynamo=False,
    )
    quantize_dynamic(str(fp32), str(int8), weight_type=QuantType.QInt8)
    fp32.unlink()

    predictor.tokenizer.backend_tokenizer.save(str(ARTIFACTS / "tokenizer.json"))
    shutil.copy(args.ckpt / "vibe_config.json", ARTIFACTS / "vibe_config.json")
    shutil.copy(HERE / "thresholds.json", ARTIFACTS / "thresholds.json")
    shutil.copy(HERE.parent / "shared" / "safety_patterns.json", ARTIFACTS / "safety_patterns.json")

    # parity: int8 ONNX vs PyTorch on a validation sample
    val = [json.loads(l) for l in (HERE / "data" / "val.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
    texts = [r["text"] for r in val[: args.sample]]
    th = load_thresholds(HERE / "thresholds.json")
    session = ort.InferenceSession(str(int8), providers=["CPUExecutionProvider"])
    torch_p = predictor.probs(texts)
    onnx_p = []
    for i in range(0, len(texts), 64):
        onnx_p += onnx_probs(session, predictor.tokenizer, texts[i:i + 64], max_len)
    agree = sum(decide(t, a, th)["mood"] == decide(t, b, th)["mood"] and decide(t, a, th)["risk"] == decide(t, b, th)["risk"]
                for t, a, b in zip(texts, torch_p, onnx_p)) / len(texts)
    size_mb = int8.stat().st_size / 1e6
    print(f"int8 model {size_mb:.0f} MB; ONNX/PyTorch agreement on mood+risk: {agree:.1%}")
    return 0 if agree >= 0.99 else 1


if __name__ == "__main__":
    sys.exit(main())
