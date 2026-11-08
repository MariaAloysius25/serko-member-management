# GitHub Copilot Instructions

Before making changes to this repository:

1. Read the root `AGENTS.md` file in full.
2. Read `openapi.yaml` before implementing or changing API behavior.
3. Follow the requirements, technology choices, scope boundaries, and delivery expectations in `AGENTS.md`.
4. Treat `openapi.yaml` as the source of truth for API routes, request schemas, response schemas, and status codes.

## Working rules

- Work incrementally. Do not generate the entire application in one step.
- Explain the intended changes before making them.
- Do not add features outside the exercise scope.
- Do not introduce a database, authentication, or unnecessary dependencies.
- Keep frontend and backend as separate applications.
- Do not silently change the API contract to accommodate an implementation.
- Add or update tests when behavior changes.
- Run relevant tests and report their actual results.
- Never claim a command, test, or build succeeded unless you ran it and observed the result.
- Do not fabricate screenshots, evidence, runtime versions, or time records.
- Flag ambiguity or conflicting requirements before proceeding.
- Prefer small, readable, maintainable changes over clever abstractions.

## Completion reports

At the end of each task, report:

1. Files created or changed.
2. Important implementation decisions.
3. Commands actually executed.
4. Test and build results, including failures.
5. Remaining issues or recommended next steps.

Do not begin implementation until the user explicitly asks you to do so.
