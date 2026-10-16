"""Exporting must leave the PyTorch model in eval mode (a fresh wrapper module starts in
train mode, and torch.onnx.export restores that mode onto the whole model, which turned
dropout back on and corrupted the parity reference)."""
from pathlib import Path

import torch
from torch import nn

from export_onnx import export_model


class Tiny(nn.Module):
    def __init__(self):
        super().__init__()
        self.emb = nn.Embedding(10, 4)
        self.drop = nn.Dropout(0.5)
        self.heads = nn.ModuleDict({n: nn.Linear(4, 2) for n in ("mood", "tags", "toxicity", "risk", "lang")})
        self.heads["intensity"] = nn.Linear(4, 1)

    def forward(self, input_ids, attention_mask):
        h = self.drop(self.emb(input_ids)).mean(1)
        out = {n: head(h) for n, head in self.heads.items()}
        out["intensity"] = out["intensity"].squeeze(-1)
        return out


def test_export_leaves_model_in_eval_mode(tmp_path: Path):
    model = Tiny().eval()
    ids = torch.tensor([[1, 2, 3]])
    export_model(model, ids, torch.ones_like(ids), tmp_path / "tiny.onnx")
    assert (tmp_path / "tiny.onnx").exists()
    assert model.training is False
    assert all(not m.training for m in model.modules())
