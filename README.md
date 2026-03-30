# Agentic BA/Dev/Tester Flow (FastAPI + GPT-5.3)

This project creates a 3-agent loop:

- BA Agent: reads user story, coordinates work, decides when complete.
- Developer Agent: implements code files from BA instructions.
- Tester Agent: generates unit/integration tests and validates with `pytest`.

When the BA marks delivery complete and tests pass, the interactive runner asks for terminal approval (`yes/no`) before real `git push`.

## Prerequisites

- Python 3.11+
- Git repository initialized with a GitHub remote
- `OPENAI_API_KEY` set in environment

## Install

```bash
pip install -r requirements.txt
```

## Run interactive flow (recommended)

```bash
python run_flow.py
```

Behavior:

1. Prompts for user story
2. Runs BA <-> Developer <-> Tester loop
3. Executes `pytest -q`
4. BA asks terminal permission before actual push

## Run API mode

```bash
uvicorn app:app --reload
```

Then call:

`POST /run` with JSON:

```json
{
  "user_story": "As a user, I want ...",
  "max_iterations": 5
}
```

API mode does not push automatically. Use `python run_flow.py` for interactive BA push approval.

