"""Create/update the Hugging Face Space that serves Unfilterd Vibe.

Reads HF_TOKEN (write scope) and optionally HF_SPACE (default "<user>/unfilterd-vibe")
from the repo's .env. The token is never printed.
"""
from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path

from huggingface_hub import HfApi

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]


def read_env() -> dict[str, str]:
    env = {}
    for line in (REPO / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip()
    return env


def main() -> None:
    env = read_env()
    token = env.get("HF_TOKEN") or os.environ.get("HF_TOKEN")
    if not token:
        raise SystemExit("HF_TOKEN missing: add a write token to .env (HF_TOKEN=...)")
    api = HfApi(token=token)
    user = api.whoami()["name"]
    space = env.get("HF_SPACE") or f"{user}/unfilterd-vibe"
    api.create_repo(space, repo_type="space", space_sdk="docker", exist_ok=True, private=False)

    with tempfile.TemporaryDirectory() as tmp:
        stage = Path(tmp)
        for name in ("Dockerfile", "README.md", "requirements.txt", "app.py", "infer.py"):
            shutil.copy(HERE / name, stage / name)
        for name in ("decision.py", "vibe_schema.py"):
            shutil.copy(HERE.parent / name, stage / name)
        api.upload_folder(folder_path=str(stage), repo_id=space, repo_type="space",
                          commit_message="Deploy Unfilterd Vibe v1")
    host = space.replace("/", "-").lower().replace("_", "-")
    print(f"Space: https://huggingface.co/spaces/{space}")
    print(f"API:   https://{host}.hf.space")


if __name__ == "__main__":
    main()
