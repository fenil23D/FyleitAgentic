from __future__ import annotations

import json
import os
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from openai import OpenAI
from pydantic import BaseModel, Field


EXCLUDED_DIRS = {".git", ".venv", "venv", "__pycache__", ".pytest_cache", ".mypy_cache"}
MAX_FILE_BYTES_FOR_CONTEXT = 120_000


class FileArtifact(BaseModel):
    path: str
    content: str


class AgentFileOutput(BaseModel):
    files: list[FileArtifact] = Field(default_factory=list)
    notes: str = ""


class BAInstruction(BaseModel):
    instruction_for_developer: str
    completion_signal: bool = False
    release_summary: str = ""


class FlowResult(BaseModel):
    success: bool
    iterations_run: int
    test_passed: bool
    release_summary: str = ""
    last_pytest_output: str = ""


@dataclass
class AgenticFlow:
    root: Path
    model: str = "gpt-5.3"

    def __post_init__(self) -> None:
        self.root = self.root.resolve()
        self.client = OpenAI()

    def run(self, user_story: str, max_iterations: int = 5) -> FlowResult:
        history: list[str] = []
        last_pytest_output = "No tests have been run yet."
        test_passed = False
        release_summary = ""

        for iteration in range(1, max_iterations + 1):
            repo_snapshot = self._build_repo_snapshot()
            ba_instruction = self._ba_step(
                user_story=user_story,
                repo_snapshot=repo_snapshot,
                history=history,
                test_output=last_pytest_output,
            )

            release_summary = ba_instruction.release_summary or release_summary
            if ba_instruction.completion_signal and test_passed:
                return FlowResult(
                    success=True,
                    iterations_run=iteration - 1,
                    test_passed=True,
                    release_summary=release_summary,
                    last_pytest_output=last_pytest_output,
                )

            dev_output = self._developer_step(
                user_story=user_story,
                ba_instruction=ba_instruction.instruction_for_developer,
                repo_snapshot=repo_snapshot,
                history=history,
            )
            self._materialize_files(dev_output.files)
            history.append(f"Iteration {iteration} developer notes: {dev_output.notes}")

            repo_snapshot_after_dev = self._build_repo_snapshot()
            tester_output = self._tester_step(
                user_story=user_story,
                repo_snapshot=repo_snapshot_after_dev,
                history=history,
            )
            self._materialize_files(tester_output.files)
            history.append(f"Iteration {iteration} tester notes: {tester_output.notes}")

            test_passed, last_pytest_output = self._run_pytest()
            history.append(
                f"Iteration {iteration} pytest_passed={test_passed}. Output:\n{last_pytest_output}"
            )

            if test_passed:
                # BA gets a final chance to confirm closure with passing tests.
                final_ba = self._ba_step(
                    user_story=user_story,
                    repo_snapshot=self._build_repo_snapshot(),
                    history=history,
                    test_output=last_pytest_output,
                )
                release_summary = final_ba.release_summary or release_summary
                if final_ba.completion_signal:
                    return FlowResult(
                        success=True,
                        iterations_run=iteration,
                        test_passed=True,
                        release_summary=release_summary,
                        last_pytest_output=last_pytest_output,
                    )

        return FlowResult(
            success=False,
            iterations_run=max_iterations,
            test_passed=test_passed,
            release_summary=release_summary,
            last_pytest_output=last_pytest_output,
        )

    def _ba_step(
        self,
        *,
        user_story: str,
        repo_snapshot: str,
        history: list[str],
        test_output: str,
    ) -> BAInstruction:
        system_prompt = (
            "You are the BA Agent. Analyze user story, coordinate delivery, and drive completion.\n"
            "Return STRICT JSON with keys: instruction_for_developer, completion_signal, release_summary.\n"
            "Rules:\n"
            "- completion_signal=true only when all acceptance criteria are met and tests pass.\n"
            "- instruction_for_developer must be specific and actionable.\n"
            "- release_summary should be short and user-friendly.\n"
        )
        user_prompt = (
            f"User story:\n{user_story}\n\n"
            f"Repo snapshot:\n{repo_snapshot}\n\n"
            f"History:\n{self._history_text(history)}\n\n"
            f"Latest pytest output:\n{test_output}\n"
        )
        data = self._json_from_model(system_prompt, user_prompt)
        return BAInstruction.model_validate(data)

    def _developer_step(
        self,
        *,
        user_story: str,
        ba_instruction: str,
        repo_snapshot: str,
        history: list[str],
    ) -> AgentFileOutput:
        system_prompt = (
            "You are the Developer Agent. Implement exactly what BA requests.\n"
            "Return STRICT JSON with keys: files, notes.\n"
            "files is an array of objects with keys: path, content.\n"
            "Rules:\n"
            "- Provide complete file contents (not diffs).\n"
            "- Keep architecture clean and maintainable.\n"
            "- If no code change needed, return files as empty list and explain in notes.\n"
        )
        user_prompt = (
            f"User story:\n{user_story}\n\n"
            f"BA instruction:\n{ba_instruction}\n\n"
            f"Repo snapshot:\n{repo_snapshot}\n\n"
            f"History:\n{self._history_text(history)}\n"
        )
        data = self._json_from_model(system_prompt, user_prompt)
        return AgentFileOutput.model_validate(data)

    def _tester_step(
        self,
        *,
        user_story: str,
        repo_snapshot: str,
        history: list[str],
    ) -> AgentFileOutput:
        system_prompt = (
            "You are the Tester Agent. Create/maintain unit and integration tests.\n"
            "Return STRICT JSON with keys: files, notes.\n"
            "files is an array of objects with keys: path, content.\n"
            "Rules:\n"
            "- Generate practical tests that verify behavior from the user story.\n"
            "- Prefer pytest.\n"
            "- If tests are already sufficient, return empty files list and explain in notes.\n"
        )
        user_prompt = (
            f"User story:\n{user_story}\n\n"
            f"Repo snapshot:\n{repo_snapshot}\n\n"
            f"History:\n{self._history_text(history)}\n"
        )
        data = self._json_from_model(system_prompt, user_prompt)
        return AgentFileOutput.model_validate(data)

    def _json_from_model(self, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        response = self.client.responses.create(
            model=self.model,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )

        text = getattr(response, "output_text", "") or self._fallback_response_text(response)
        payload = self._extract_json_object(text)
        return json.loads(payload)

    def _fallback_response_text(self, response: Any) -> str:
        chunks: list[str] = []
        for out in getattr(response, "output", []):
            for content in getattr(out, "content", []):
                txt = getattr(content, "text", "")
                if txt:
                    chunks.append(txt)
        return "\n".join(chunks)

    def _extract_json_object(self, text: str) -> str:
        text = text.strip()
        if text.startswith("{") and text.endswith("}"):
            return text

        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if not match:
            raise ValueError(f"Model response did not contain JSON object: {text[:400]}")
        return match.group(0)

    def _materialize_files(self, files: list[FileArtifact]) -> None:
        for artifact in files:
            target = (self.root / artifact.path).resolve()
            if self.root not in target.parents and target != self.root:
                raise ValueError(f"Refusing to write outside project root: {artifact.path}")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(artifact.content, encoding="utf-8")

    def _run_pytest(self) -> tuple[bool, str]:
        proc = subprocess.run(
            ["pytest", "-q"],
            cwd=self.root,
            text=True,
            capture_output=True,
            check=False,
        )
        output = (proc.stdout or "") + ("\n" + proc.stderr if proc.stderr else "")
        return proc.returncode == 0, output.strip()

    def _build_repo_snapshot(self) -> str:
        lines: list[str] = []
        for path in sorted(self.root.rglob("*")):
            if path.is_dir():
                continue
            if any(part in EXCLUDED_DIRS for part in path.parts):
                continue
            rel = path.relative_to(self.root).as_posix()
            size = path.stat().st_size
            lines.append(f"FILE: {rel} ({size} bytes)")
            if size <= MAX_FILE_BYTES_FOR_CONTEXT and path.suffix in {
                ".py",
                ".md",
                ".txt",
                ".json",
                ".toml",
                ".yaml",
                ".yml",
                ".ini",
            }:
                content = path.read_text(encoding="utf-8", errors="ignore")
                lines.append("```")
                lines.append(content[:5000])
                lines.append("```")
        if not lines:
            return "Repository is currently empty."
        return "\n".join(lines)

    def _history_text(self, history: list[str]) -> str:
        if not history:
            return "No previous iterations."
        return "\n\n".join(history[-8:])


def ensure_api_key() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not set.")

