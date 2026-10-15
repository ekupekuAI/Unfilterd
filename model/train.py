"""Train Unfilterd Vibe v1.

    python train.py --data data --out checkpoints            # full run (GPU)
    python train.py --data data --out checkpoints --resume   # continue after an interruption

Saves `last.pt` every --save-every steps (model + optimizer + scheduler + position),
so shutting the laptop loses at most a few minutes. The best model by validation
crisis recall (then mood accuracy) is written to <out>/best/.
"""
from __future__ import annotations

import argparse
import json
import math
import random
import time
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset
from transformers import get_linear_schedule_with_warmup

from vibe_model import MAX_LEN, VibeModel, load_tokenizer
from vibe_schema import MOODS, TAGS, TOX_LEVELS, RISK_LEVELS, LANG_STYLES

LOSS_WEIGHTS = {"mood": 1.0, "tags": 1.0, "intensity": 0.5, "toxicity": 1.0, "risk": 2.0, "lang": 0.3}


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


class VibeDataset(Dataset):
    def __init__(self, rows: list[dict]):
        self.rows = rows

    def __len__(self) -> int:
        return len(self.rows)

    def __getitem__(self, idx: int) -> dict:
        row = self.rows[idx]
        tags = torch.zeros(len(TAGS))
        for tag in row["tags"]:
            tags[TAGS.index(tag)] = 1.0
        return {
            "text": row["text"],
            "mood": MOODS.index(row["mood"]),
            "tags": tags,
            "intensity": row["intensity"] / 100.0,
            "toxicity": TOX_LEVELS.index(row["toxicity"]),
            "risk": RISK_LEVELS.index(row["risk"]),
            "lang": LANG_STYLES.index(row["lang"]),
        }


def make_collate(tokenizer, max_len: int):
    def collate(batch: list[dict]) -> dict:
        enc = tokenizer([b["text"] for b in batch], padding=True, truncation=True, max_length=max_len, return_tensors="pt")
        return {
            "input_ids": enc["input_ids"],
            "attention_mask": enc["attention_mask"],
            "mood": torch.tensor([b["mood"] for b in batch]),
            "tags": torch.stack([b["tags"] for b in batch]),
            "intensity": torch.tensor([b["intensity"] for b in batch], dtype=torch.float),
            "toxicity": torch.tensor([b["toxicity"] for b in batch]),
            "risk": torch.tensor([b["risk"] for b in batch]),
            "lang": torch.tensor([b["lang"] for b in batch]),
        }
    return collate


def class_weights(values: list[int], n: int, cap: float = 8.0) -> torch.Tensor:
    counts = torch.bincount(torch.tensor(values), minlength=n).float().clamp(min=1)
    weights = (counts.sum() / (n * counts)).sqrt().clamp(max=cap)
    return weights / weights.min()


class Losses(nn.Module):
    def __init__(self, train_rows: list[dict]):
        super().__init__()
        risk_w = class_weights([RISK_LEVELS.index(r["risk"]) for r in train_rows], len(RISK_LEVELS))
        tox_w = class_weights([TOX_LEVELS.index(r["toxicity"]) for r in train_rows], len(TOX_LEVELS))
        mood_w = class_weights([MOODS.index(r["mood"]) for r in train_rows], len(MOODS), cap=3.0)
        tag_pos = torch.zeros(len(TAGS))
        for r in train_rows:
            for t in r["tags"]:
                tag_pos[TAGS.index(t)] += 1
        tag_pos = tag_pos.clamp(min=1)
        pos_weight = ((len(train_rows) - tag_pos) / tag_pos).sqrt().clamp(max=10.0)
        self.mood = nn.CrossEntropyLoss(weight=mood_w)
        self.tags = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
        self.toxicity = nn.CrossEntropyLoss(weight=tox_w)
        self.risk = nn.CrossEntropyLoss(weight=risk_w)
        self.lang = nn.CrossEntropyLoss()

    def forward(self, out: dict, batch: dict) -> torch.Tensor:
        parts = {
            "mood": self.mood(out["mood"].float(), batch["mood"]),
            "tags": self.tags(out["tags"].float(), batch["tags"]),
            "intensity": nn.functional.smooth_l1_loss(torch.sigmoid(out["intensity"].float()), batch["intensity"]),
            "toxicity": self.toxicity(out["toxicity"].float(), batch["toxicity"]),
            "risk": self.risk(out["risk"].float(), batch["risk"]),
            "lang": self.lang(out["lang"].float(), batch["lang"]),
        }
        return sum(LOSS_WEIGHTS[k] * v for k, v in parts.items())


@torch.no_grad()
def evaluate(model: VibeModel, loader: DataLoader, device: torch.device, amp_dtype) -> dict:
    model.eval()
    mood_ok = total = flagged = caught = 0
    for batch in loader:
        with torch.autocast(device.type, dtype=amp_dtype, enabled=amp_dtype is not None):
            out = model(batch["input_ids"].to(device), batch["attention_mask"].to(device))
        mood_ok += (out["mood"].argmax(-1).cpu() == batch["mood"]).sum().item()
        total += len(batch["mood"])
        is_flagged = batch["risk"] > 0
        flagged += is_flagged.sum().item()
        caught += ((out["risk"].argmax(-1).cpu() > 0) & is_flagged).sum().item()
    model.train()
    return {"mood_acc": mood_ok / max(total, 1), "risk_recall": caught / max(flagged, 1)}


def log(out_dir: Path, **record) -> None:
    with (out_dir / "log.jsonl").open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record) + "\n")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--epochs", type=int, default=5)
    ap.add_argument("--batch-size", type=int, default=32)
    ap.add_argument("--lr", type=float, default=4e-5)
    ap.add_argument("--head-lr", type=float, default=1e-3)
    ap.add_argument("--max-steps", type=int, default=0)
    ap.add_argument("--save-every", type=int, default=200)
    ap.add_argument("--resume", action="store_true")
    ap.add_argument("--smoke", action="store_true", help="200 rows, short sequences: a quick correctness check")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    random.seed(args.seed)
    torch.manual_seed(args.seed)

    train_rows = read_jsonl(args.data / "train.jsonl")
    val_rows = read_jsonl(args.data / "val.jsonl")
    max_len = MAX_LEN
    if args.smoke:
        rng = random.Random(0)
        flagged = [r for r in train_rows if r["risk"] != "none"]
        rest = [r for r in train_rows if r["risk"] == "none"]
        train_rows = rng.sample(flagged, 50) + rng.sample(rest, 150)
        val_rows = rng.sample(val_rows, 64)
        args.batch_size, max_len = 8, 64

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    amp_dtype = torch.bfloat16 if device.type == "cuda" else None
    tokenizer = load_tokenizer()
    collate = make_collate(tokenizer, max_len)
    val_loader = DataLoader(VibeDataset(val_rows), batch_size=64, collate_fn=collate)

    model = VibeModel.from_backbone().to(device)
    losses = Losses(train_rows).to(device)
    head_params = list(model.heads.parameters())
    enc_params = [p for p in model.encoder.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(
        [{"params": enc_params, "lr": args.lr}, {"params": head_params, "lr": args.head_lr}], weight_decay=0.01
    )
    steps_per_epoch = math.ceil(len(train_rows) / args.batch_size)
    total_steps = args.max_steps or steps_per_epoch * args.epochs
    scheduler = get_linear_schedule_with_warmup(optimizer, int(0.06 * total_steps), total_steps)

    step, best_score = 0, (-1.0, -1.0)
    last_path = args.out / "last.pt"
    if args.resume and last_path.exists():
        state = torch.load(last_path, map_location=device, weights_only=False)
        model.load_state_dict(state["model"])
        optimizer.load_state_dict(state["optimizer"])
        scheduler.load_state_dict(state["scheduler"])
        step, best_score = state["step"], tuple(state["best_score"])
        log(args.out, event="resume", step=step)
        print(f"resumed at step {step}")

    def save_last() -> None:
        tmp = args.out / "last.pt.tmp"
        torch.save({"model": model.state_dict(), "optimizer": optimizer.state_dict(),
                    "scheduler": scheduler.state_dict(), "step": step, "best_score": list(best_score)}, tmp)
        tmp.replace(last_path)

    def maybe_save_best() -> None:
        nonlocal best_score
        metrics = evaluate(model, val_loader, device, amp_dtype)
        score = (round(metrics["risk_recall"], 3), round(metrics["mood_acc"], 4))
        log(args.out, event="eval", step=step, **metrics)
        print(f"step {step}: val risk recall {metrics['risk_recall']:.3f}, mood acc {metrics['mood_acc']:.3f}")
        if score > best_score:
            best_score = score
            model.save(args.out / "best", tokenizer, extra={"step": step, **metrics})

    model.train()
    started = time.time()
    while step < total_steps:
        epoch = step // steps_per_epoch
        order = list(range(len(train_rows)))
        random.Random(args.seed + epoch).shuffle(order)
        skip = step - epoch * steps_per_epoch
        rows = [train_rows[i] for i in order][skip * args.batch_size:]
        loader = DataLoader(VibeDataset(rows), batch_size=args.batch_size, collate_fn=collate)
        for batch in loader:
            batch = {k: v.to(device) for k, v in batch.items()}
            with torch.autocast(device.type, dtype=amp_dtype, enabled=amp_dtype is not None):
                out = model(batch["input_ids"], batch["attention_mask"])
            loss = losses(out, batch)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            optimizer.zero_grad(set_to_none=True)
            step += 1
            log(args.out, event="step", step=step, loss=round(loss.item(), 5))
            if step % 50 == 0:
                rate = step / max(time.time() - started, 1e-6)
                print(f"step {step}/{total_steps} loss {loss.item():.4f} ({rate:.1f} steps/s)", flush=True)
            if step % args.save_every == 0:
                save_last()
            if step % steps_per_epoch == 0 and step < total_steps:
                maybe_save_best()
            if step >= total_steps:
                break
    maybe_save_best()
    save_last()
    log(args.out, event="done", step=step, best=list(best_score))
    print(f"done: {step} steps, best (risk recall, mood acc) = {best_score}")


if __name__ == "__main__":
    main()
