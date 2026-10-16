"""Rows without tag annotations (GoEmotions) must not teach the tag head 'no tags'."""
import torch

from train import Losses, VibeDataset, make_collate
from vibe_model import load_tokenizer
from vibe_schema import TAGS


def row(source, tags):
    return {"text": "x", "mood": "sad", "tags": tags, "intensity": 50, "risk": "none",
            "toxicity": "none", "lang": "en", "source": source}


def test_unannotated_rows_contribute_no_tag_loss():
    rows = [row("goemotions", []), row("syn:standard", ["loneliness"])]
    losses = Losses(rows)
    batch = make_collate(load_tokenizer(), 16)([VibeDataset(rows)[0]])
    out = {
        "mood": torch.zeros(1, 9), "tags": torch.full((1, len(TAGS)), 5.0),  # confidently predicts every tag
        "intensity": torch.zeros(1), "toxicity": torch.zeros(1, 4), "risk": torch.zeros(1, 3), "lang": torch.zeros(1, 5),
    }
    assert losses.parts(out, batch)["tags"].item() == 0.0


def test_annotated_rows_do_contribute_tag_loss():
    rows = [row("goemotions", []), row("syn:standard", ["loneliness"])]
    losses = Losses(rows)
    batch = make_collate(load_tokenizer(), 16)([VibeDataset(rows)[1]])
    out = {
        "mood": torch.zeros(1, 9), "tags": torch.full((1, len(TAGS)), 5.0),
        "intensity": torch.zeros(1), "toxicity": torch.zeros(1, 4), "risk": torch.zeros(1, 3), "lang": torch.zeros(1, 5),
    }
    assert losses.parts(out, batch)["tags"].item() > 0.0


def test_natural_rows_are_upweighted_in_epoch_order():
    from train import epoch_indices
    rows = [{"source": "syn:standard"}, {"source": "nat:crisis"}, {"source": "goemotions"}]
    order = epoch_indices(rows, natural_weight=4, seed=1, epoch=0)
    assert sorted(order) == [0, 1, 1, 1, 1, 2]


def test_selection_rows_prefer_natural_validation():
    from train import selection_rows
    val = [{"source": "syn:standard"}, {"source": "nat:crisis"}, {"source": "nat:everyday"}]
    assert [r["source"] for r in selection_rows(val)] == ["nat:crisis", "nat:everyday"]
    assert selection_rows([{"source": "syn:standard"}]) == [{"source": "syn:standard"}]
