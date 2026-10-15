"""Task 4: training smoke test (tiny data, few steps; CPU is fine)."""
import json
import subprocess
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent


def run_train(out: Path, *extra: str) -> None:
    cmd = [sys.executable, str(HERE / "train.py"), "--data", str(HERE / "data"), "--out", str(out), "--smoke", *extra]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900)
    assert result.returncode == 0, result.stdout[-2000:] + result.stderr[-3000:]


def read_log(out: Path) -> list[dict]:
    return [json.loads(line) for line in (out / "log.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]


@pytest.fixture(scope="module")
def smoke_run(tmp_path_factory):
    out = tmp_path_factory.mktemp("ckpt")
    run_train(out, "--max-steps", "20", "--save-every", "10")
    return out


def test_smoke_writes_checkpoint(smoke_run):
    assert (smoke_run / "last.pt").exists()
    assert (smoke_run / "best" / "heads.pt").exists()
    assert (smoke_run / "best" / "vibe_config.json").exists()


def test_smoke_loss_decreases(smoke_run):
    steps = [r for r in read_log(smoke_run) if r["event"] == "step"]
    assert steps[-1]["step"] == 20
    first = sum(r["loss"] for r in steps[:3]) / 3
    last = sum(r["loss"] for r in steps[-3:]) / 3
    assert last < first, f"loss did not fall: {first:.3f} -> {last:.3f}"


def test_resume_continues_from_saved_step(smoke_run):
    run_train(smoke_run, "--max-steps", "30", "--save-every", "10", "--resume")
    log = read_log(smoke_run)
    resumes = [r for r in log if r["event"] == "resume"]
    assert resumes and resumes[-1]["step"] == 20
    steps_after = [r["step"] for r in log if r["event"] == "step"]
    assert steps_after[-1] == 30
    assert 21 in steps_after and steps_after.count(21) == 1
