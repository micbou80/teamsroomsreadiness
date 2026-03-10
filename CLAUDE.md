# Teams Rooms Readiness Assessment Tool

## Project Overview

Open-source (MIT) tool that assesses Microsoft 365 tenant readiness for Teams Rooms deployment. Web SaaS dashboard (primary) with a PowerShell companion module for checks requiring local execution.

## Architecture

- **Web App**: Next.js 14+ (App Router) + Fluent UI React v9 + Prisma + PostgreSQL/SQLite
- **Auth**: Azure AD multi-tenant OAuth 2.0 via NextAuth v5 (Authorization Code + PKCE)
- **Graph API**: Server-side only — tokens never reach the browser
- **PowerShell Module**: `MTRReadiness` — Exchange Online calendar processing + network probes, outputs JSON for upload to web dashboard

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+, React 18, TypeScript, Fluent UI React v9 |
| Auth | NextAuth v5 (Auth.js), `@azure/msal-node` |
| API | Microsoft Graph Client (`@microsoft/microsoft-graph-client`) |
| Database | Prisma ORM, PostgreSQL (prod) / SQLite (dev) |
| Testing | Vitest (unit), Testing Library (components), Playwright (E2E) |
| PowerShell | `ExchangeOnlineManagement`, Pester v5 |

## Project Structure

```
teamsroomsreadiness/
├── apps/web/src/
│   ├── app/              # Next.js App Router pages and API routes
│   ├── components/       # React components (Fluent UI v9)
│   ├── lib/              # Auth, Graph client, DB, utilities
│   ├── checks/           # Check definitions, engine, scoring
│   │   ├── types.ts      # Core type system (CheckDefinition, CheckResult, etc.)
│   │   ├── registry.ts   # Category -> checks mapping
│   │   ├── engine.ts     # Assessment orchestrator
│   │   ├── scoring.ts    # Weighted scoring algorithm
│   │   └── {category}/   # One folder per category with individual check files
│   └── types/            # Shared TypeScript types
├── packages/powershell/MTRReadiness/
│   ├── Public/           # Exported cmdlets
│   ├── Private/          # Internal check functions
│   ├── Templates/        # HTML report template
│   └── Tests/            # Pester tests
└── docs/
```

## Coding Conventions

### TypeScript / React
- Use TypeScript strict mode
- Prefer named exports over default exports
- Use Fluent UI v9 components (`@fluentui/react-components`) — never v8
- All Graph API calls go through `lib/graph-client.ts` and `lib/graph-queries.ts` (server-side only)
- Check implementations follow the `CheckDefinition` interface in `checks/types.ts`
- Each check is a single file in its category folder, exporting a `CheckDefinition` object
- Use `zod` for runtime validation of external data (API responses, PowerShell uploads)
- Path alias: `@/` maps to `src/`

### Check Framework
- Every check must implement: `id`, `categoryId`, `name`, `description`, `source`, `severity`, `execute(context)`
- `execute()` must never throw — catch errors and return a `CheckResult` with `status: 'warning'` and error details
- Checks are registered in their category's `index.ts` and aggregated in `checks/registry.ts`
- PowerShell-only checks (`source: 'powershell'`) return `status: 'pending'` until PS data is uploaded
- Manual checks (`source: 'manual'`) return `status: 'pending'` until user provides input

### Security
- Never expose access tokens to the client
- All state-changing API routes must validate CSRF
- Validate PowerShell JSON uploads against Zod schema before processing
- Sanitize logs — no UPNs, email addresses, or tenant IDs in log output
- Use parameterized Graph SDK calls — never construct URLs with string interpolation

### PowerShell
- Module name: `MTRReadiness`
- Follow PowerShell approved verbs (Test-, Get-, Export-, Invoke-)
- All check functions in `Private/` return a standardized `[PSCustomObject]` matching the web upload schema
- JSON output must match the `PowerShellUpload` TypeScript type exactly
- Require `ExchangeOnlineManagement` module — validate connection before running checks

### Git
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`
- Branch naming: `feature/`, `fix/`, `docs/`
- PR descriptions must include what checks are affected

## Key Constants

Microsoft license SKU Part Numbers and IDs are defined in `apps/web/src/lib/constants.ts`. These must be kept current with Microsoft's published SKU documentation:
- Teams Rooms Pro: `Microsoft_Teams_Rooms_Pro`
- Teams Rooms Basic: `Microsoft_Teams_Rooms_Basic`
- Teams Shared Devices: `MCOCAP` (must NOT be assigned to rooms)
- Basic license cap: 25 per tenant

## Running the Project

```bash
# Web app
cd apps/web
npm install
cp .env.example .env.local  # Fill in Azure AD app registration values
npx prisma migrate dev
npm run dev

# PowerShell module
Import-Module ./packages/powershell/MTRReadiness/MTRReadiness.psd1
Invoke-MTRReadinessCheck -RoomMailbox "room@contoso.com" -IncludeNetwork -Format Json,Html
```

## Testing

```bash
# Web app tests
cd apps/web
npm test              # Vitest unit tests
npm run test:e2e      # Playwright E2E

# PowerShell tests
Invoke-Pester ./packages/powershell/MTRReadiness/Tests/
```
