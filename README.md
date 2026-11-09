# Serko Member Management

A small member-management application for searching colleagues, viewing their details, and changing their travel roles. The application has a Next.js frontend and an ASP.NET Core Minimal API backend. Member data is stored in memory and resets when the API process restarts.

## Purpose and scope

The application supports:

- Case-insensitive partial search by first name, last name, or email.
- Exact travel-role filtering; search and role filters are combined using AND logic.
- Viewing a member list and member details.
- Updating a member's role to `traveller`, `arranger`, or `administrator`.
- A Development-only, one-shot simulated HTTP 503 for demonstrating save recovery.

This is a local take-home exercise, not a production identity or authorization system. It has no database, persistence, authentication, or authorization.

## Architecture and repository structure

The frontend and backend are separate applications that run as separate processes. [openapi.yaml](./openapi.yaml) is the source of truth for API routes and request and response schemas.

```text
.
├── AGENTS.md
├── APPROACH.md
├── README.md
├── openapi.yaml
├── docs/
│   └── evidence/          # Screenshots of key UI states and save recovery
├── .github/
│   └── copilot-instructions.md
├── backend/
│   ├── Serko.MemberManagement.Api/
│   │   ├── Data/InMemoryMemberStore.cs
│   │   ├── Models/
│   │   └── Program.cs
│   └── Serko.MemberManagement.Api.Tests/
│       └── MemberApiIntegrationTests.cs
└── frontend/
    ├── package.json
    ├── vitest.config.ts
    └── src/
        ├── app/               # Next.js route and page-level tests
        ├── components/
        │   └── members/
        │       ├── MemberSearch.tsx
        │       ├── MemberList.tsx
        │       └── MemberDetails.tsx
        ├── hooks/             # Member data, filtering, selection, and save state
        ├── lib/               # Typed API client and API-client tests
        ├── test/              # Vitest setup
        └── types/             # Member and role types
```

## Prerequisites and versions

The following versions were reported for the development environment:

- Node.js `v24.19.0`
- npm `11.17.0`
- .NET SDK `10.0.403`
- Git `2.54.0`

The backend targets .NET `10.0`. The frontend dependencies are declared in `frontend/package.json`; this project uses Next.js `16.4.5` and React `19.3.0`.

## Run locally

Run the API and frontend in separate terminals.

### Terminal 1: API

From the repository root:

```bash
dotnet run --project backend/Serko.MemberManagement.Api --launch-profile http
```

The `http` launch profile runs the API at `http://localhost:5080` in the Development environment.

### Terminal 2: frontend

From the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API's CORS configuration allows requests from that origin using GET, PATCH, and POST, with the Content-Type request header.

## Configuration

The frontend API client uses `NEXT_PUBLIC_API_BASE_URL`, defaulting to `http://localhost:5080` when the variable is unset.

Create or update `frontend/.env.local` for local development:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:5080
```

This file is local-only configuration and must not be committed.

Restart the frontend development server after changing the environment file.

## API endpoints

The full API contract is defined in [openapi.yaml](./openapi.yaml). The local API base URL is `http://localhost:5080`.

| Method | Path                      | Purpose                                                             |
| ------ | ------------------------- | ------------------------------------------------------------------- |
| GET    | `/api/members`            | List members; accepts optional `search` and `role` query parameters |
| GET    | `/api/members/{id}`       | Return one member by ID                                             |
| PATCH  | `/api/members/{id}`       | Update the member's role                                            |
| POST   | `/api/dev/fail-next-save` | Development-only control to arm the next save failure               |

`GET /api/members` returns an object with an `items` array. The PATCH request body contains only a role, for example:

```json
{
  "role": "arranger"
}
```

The API error response uses this shape:

```json
{
  "error": {
    "code": "INVALID_ROLE",
    "message": "The supplied role is not supported."
  }
}
```

Invalid roles or role-update request bodies return HTTP 400. Unknown member IDs return HTTP 404.

### Demonstrate the simulated save failure

1. Run the API using the `http` launch profile above and run the frontend with `npm run dev`. The API launch profile sets `ASPNETCORE_ENVIRONMENT=Development`.
2. In the member-management page, select a member and click **Simulate next save failure**.
3. Change the selected member's role and click **Save role**. The next valid PATCH returns HTTP 503 before changing the role; the page displays the error and retains the unsaved role choice.
4. Click **Retry save**. The one-shot failure has been consumed, so the retry can succeed and the page displays success feedback.

The endpoint is unavailable outside Development and returns HTTP 404. The failure flag belongs to the running API process.

## Tests and checks

### Backend integration tests

From the repository root:

```bash
dotnet test backend/Serko.MemberManagement.Api.Tests
```

### Frontend tests, lint, and production build

From the repository root:

```bash
cd frontend
npm test
npm run lint
npm run build
```

Frontend API-client tests mock `fetch` and do not require a running backend.

## Known limitations

- Member data is in memory only. Updates are lost when the API process restarts.
- There is no authentication or authorization; role changes are not tied to an administrator identity.
- The simulated failure flag is process-local and intended for development demonstration.
- CORS allows the configured local frontend origin only. Other deployment origins require an intentional CORS configuration change.
- The layout uses responsive Tailwind styles and has been manually checked at a narrow viewport. Further mobile-specific UX refinements were outside the scope of this exercise.
