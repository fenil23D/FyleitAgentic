from __future__ import annotations

import subprocess
from pathlib import Path


def _run_git(args: list[str], root: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=root,
        text=True,
        capture_output=True,
        check=False,
    )


def ensure_git_ready(root: Path) -> None:
    inside = _run_git(["rev-parse", "--is-inside-work-tree"], root)
    if inside.returncode != 0 or "true" not in (inside.stdout or ""):
        raise RuntimeError("Current folder is not a git repository.")

    remote = _run_git(["remote", "-v"], root)
    if remote.returncode != 0 or not (remote.stdout or "").strip():
        raise RuntimeError("No git remote configured. Add a GitHub remote before pushing.")


def commit_and_push(root: Path, message: str) -> str:
    add = _run_git(["add", "-A"], root)
    if add.returncode != 0:
        raise RuntimeError(f"git add failed:\n{add.stderr}")

    commit = _run_git(["commit", "-m", message], root)
    if commit.returncode != 0 and "nothing to commit" not in (commit.stdout + commit.stderr).lower():
        raise RuntimeError(f"git commit failed:\n{commit.stderr}")

    push = _run_git(["push"], root)
    if push.returncode != 0:
        raise RuntimeError(f"git push failed:\n{push.stderr}")

    return (commit.stdout or "") + "\n" + (push.stdout or "") + (push.stderr or "")

