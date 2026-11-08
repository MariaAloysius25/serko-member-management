# Project Context — Serko Member Management Exercise

## Objective

Build a small member-management application that allows an administrator to search colleagues, view their details, and change their travel role.

## Technology

- Frontend: React, Next.js App Router, TypeScript, Tailwind CSS.
- Backend: C# and ASP.NET Core Minimal API.
- API contract: OpenAPI YAML, maintained before implementation.
- Frontend tests: Vitest and React Testing Library.
- Backend tests: xUnit and ASP.NET Core integration testing.
- Data storage: in-memory only.
- Frontend and backend run as separate local processes.

## Functional requirements

1. Seed the application with eight synthetic members.
2. Search by partial first name, last name, or email address.
3. Search must be case-insensitive.
4. Allow filtering by travel role.
5. Combine search and role filters using AND logic.
6. Display a member list and individual member details.
7. Allow an administrator to change a member's travel role.
8. Supported roles: `traveller`, `arranger`, and `administrator`.
9. Reject invalid roles with HTTP 400.
10. Return HTTP 404 for unknown member IDs.
11. Keep all data in memory; persistence across restarts is not required.

## Simulated failure requirement

Provide a development-only mechanism to make the next role-save request fail with HTTP 503.

- The failure must happen before changing the member's role.
- The simulated failure must be one-shot.
- A subsequent retry must succeed.
- The frontend must preserve the user's unsaved role selection after a failed save.

## Frontend quality requirements

- Responsive layout for desktop and mobile.
- Accessible semantic HTML and keyboard navigation.
- Visible loading, empty, and recoverable error states.
- Clear feedback when a save succeeds or fails.
- Do not discard unsaved changes after a failed save.

## Engineering expectations

- Keep the implementation small and understandable.
- Use clear separation between API access, UI components, and state management.
- Avoid unnecessary dependencies and abstractions.
- Keep API request and response types aligned with the OpenAPI contract.
- Include meaningful frontend and backend tests.
- Do not introduce a database, authentication, or unrelated features.

## Delivery requirements

- README with setup, run, and test instructions.
- APPROACH.md explaining design decisions and trade-offs.
- OpenAPI contract.
- AGENTS.md and GitHub Copilot instructions.
- Evidence of the main user journey and simulated failure/retry.
- Record actual runtime versions and actual time spent.
- Never claim tests passed unless they were actually run.

## Seed data

Use exactly these eight synthetic members for the initial in-memory dataset:

| ID  | First name | Last name | Email                   | Role          |
| --- | ---------- | --------- | ----------------------- | ------------- |
| m1  | Alex       | River     | alex@example.test       | traveller     |
| m2  | Sam        | Brook     | sam@example.test        | arranger      |
| m3  | Lee        | Vale      | lee@example.test        | administrator |
| m4  | Robin      | Lake      | robin@example.test      | traveller     |
| m5  | Alex       | Brook     | alex.brook@example.test | arranger      |
| m6  | Sam        | Vale      | sam.vale@example.test   | administrator |
| m7  | Casey      | River     | casey@example.test      | traveller     |
| m8  | Jordan     | Lake      | jordan@example.test     | arranger      |

Keep these IDs and values stable so frontend and backend tests can rely on predictable data.
