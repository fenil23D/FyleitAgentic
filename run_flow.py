from __future__ import annotations

from pathlib import Path

from agentic_flow.flow import AgenticFlow, ensure_api_key
from agentic_flow.git_ops import commit_and_push, ensure_git_ready


def ask_yes_no(question: str) -> bool:
    while True:
        raw = input(f"{question} (yes/no): ").strip().lower()
        if raw in {"yes", "y"}:
            return True
        if raw in {"no", "n"}:
            return False
        print("Please type 'yes' or 'no'.")


def main() -> None:
    ensure_api_key()
    root = Path.cwd()
    user_story = input("Enter user story: ").strip()
    if not user_story:
        raise RuntimeError("User story is required.")

    max_iterations_raw = input("Max iterations [default 5]: ").strip()
    max_iterations = int(max_iterations_raw) if max_iterations_raw else 5

    flow = AgenticFlow(root=root)
    result = flow.run(user_story=user_story, max_iterations=max_iterations)

    print("\n=== BA Final Summary ===")
    print(result.release_summary or "(No summary provided by BA Agent)")
    print(f"Tests passed: {result.test_passed}")
    print(f"Iterations run: {result.iterations_run}")
    print("\n=== Latest pytest output ===")
    print(result.last_pytest_output)

    if not result.success:
        print("\nBA did not mark the software as complete yet. Skipping push.")
        return

    ensure_git_ready(root)
    if ask_yes_no("\nBA Agent asks: Do you approve pushing this to GitHub now?"):
        commit_message = result.release_summary[:120] if result.release_summary else "Agentic flow update"
        output = commit_and_push(root, commit_message)
        print("\nPush completed.")
        print(output.strip())
    else:
        print("\nPush cancelled by user.")


if __name__ == "__main__":
    main()

