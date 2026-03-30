from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from agentic_flow.flow import AgenticFlow, ensure_api_key


class RunRequest(BaseModel):
    user_story: str = Field(..., min_length=10)
    max_iterations: int = Field(default=5, ge=1, le=12)


class RunResponse(BaseModel):
    success: bool
    iterations_run: int
    test_passed: bool
    release_summary: str
    last_pytest_output: str
    next_step: str


app = FastAPI(title="Agentic BA/Dev/Tester Flow", version="1.0.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/run", response_model=RunResponse)
def run_flow(payload: RunRequest) -> RunResponse:
    try:
        ensure_api_key()
        flow = AgenticFlow(root=Path.cwd())
        result = flow.run(payload.user_story, payload.max_iterations)
        return RunResponse(
            success=result.success,
            iterations_run=result.iterations_run,
            test_passed=result.test_passed,
            release_summary=result.release_summary,
            last_pytest_output=result.last_pytest_output,
            next_step=(
                "Run `python run_flow.py` to use interactive BA approval prompt before git push."
            ),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

