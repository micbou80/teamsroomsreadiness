# Teams Rooms Readiness Assessment Tool

## Project Overview

Open-source (MIT) tool that assesses Microsoft 365 tenant readiness for Teams Rooms deployment. Two-part architecture: a Next.js web dashboard (primary) that runs Graph API checks server-side, and a PowerShell companion module for checks requiring local execution (Exchange Online calendar processing, network probes).

## Architecture

- **Web App**: Next.js 14+ (App Router) + Fluent UI React v9 + Prisma + SQLite (dev) / PostgreSQL (prod)
- **Auth**: Azure AD multi-tenant OAuth 2.0 via Auth.js (NextAuth v5). Delegated permissions only — the signed-in user's token is used for Graph calls. Tokens never reach the browser.
- **Graph API**: Server-side only via `@microsoft/microsoft-graph-client`. Called from API routes and the assessment engine.
- **Exchange Online API**: Optional server-side client credentials flow (`exchange-token.ts` + `exchange-client.ts`). Calls the EXO Admin REST API to auto-resolve calendar processing checks without PowerShell. Enabled via `EXCHANGE_ENABLED=true`.
- **PowerShell Module**: `MTRReadiness` — runs Exchange calendar processing and network connectivity checks locally, exports JSON, uploads via API or file upload.
- **Demo Mode**: URL param `?demo=true` generates sample assessment data without any Azure AD connection. Propagated through sidebar navigation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+, React 19, TypeScript, Fluent UI React v9 (Griffel CSS-in-JS) |
| Auth | Auth.js v5 (NextAuth), Microsoft Entra ID provider |
| API | Microsoft Graph Client SDK, Exchange Online Admin REST API |
| Database | Prisma ORM, SQLite (dev) / PostgreSQL (prod) |
| Validation | Zod (API inputs, PowerShell uploads) |
| Export | jsPDF + jspdf-autotable (PDF), ExcelJS (Excel) |
| PowerShell | ExchangeOnlineManagement, Pester v5 |
| CI/CD | GitHub Actions (TypeScript check, Pester tests) |

## Project Structure

```
teamsroomsreadiness/
├── apps/web/src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/login/       # Sign-in page + server actions
│   │   ├── (dashboard)/        # Dashboard layout with sidebar
│   │   │   ├── assessment/     # Run assessment page + [id] detail page
│   │   │   ├── upload/         # PowerShell JSON file upload
│   │   │   ├── history/        # Past assessments
│   │   │   ├── category/[slug] # Category detail drilldown
│   │   │   └── page.tsx        # Redirects to /assessment
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth route handler
│   │   │   ├── assessment/     # POST (run), GET (list/detail), merge-network
│   │   │   ├── upload/         # POST (PowerShell JSON merge)
│   │   │   ├── upload-token/   # POST (generate auto-upload token)
│   │   │   ├── export/         # PDF and Excel export
│   │   │   └── network-check/  # Server-side network probes
│   │   └── page.tsx            # Landing page
│   ├── checks/                 # Check framework
│   │   ├── types.ts            # CheckDefinition, CheckResult, CheckContext, Assessment
│   │   ├── registry.ts         # Category definitions + check registration
│   │   ├── engine.ts           # Assessment orchestrator (runs all checks)
│   │   ├── scoring.ts          # Weighted scoring (severity-based)
│   │   └── {category}/         # One folder per category
│   │       ├── index.ts        # Registers category's checks
│   │       └── *.ts            # Individual check definitions
│   ├── components/
│   │   ├── layout/             # DashboardShell, Sidebar, TopBar, Providers
│   │   └── assessment/         # StatusBadge, etc.
│   └── lib/
│       ├── auth.ts             # NextAuth config (Entra ID provider, JWT callbacks)
│       ├── db.ts               # Prisma client singleton
│       ├── graph-client.ts     # Creates Graph client from access token
│       ├── graph-queries.ts    # Graph API query functions
│       ├── exchange-token.ts   # Client credentials token for Exchange Online
│       ├── exchange-client.ts  # EXO Admin REST API client (Get-CalendarProcessing)
│       ├── browser-network-checks.ts  # Client-side STUN/WebSocket/fetch probes
│       └── constants.ts        # SKU IDs, thresholds, port numbers
├── packages/powershell/MTRReadiness/
│   ├── MTRReadiness.psd1       # Module manifest
│   ├── MTRReadiness.psm1       # Module loader (dot-sources Public/ and Private/)
│   ├── Public/                 # Exported: Invoke-MTRReadinessCheck, Test-MTRNetworkReadiness, Export-MTRReadinessReport
│   ├── Private/                # Test-CalendarProcessing, Test-NetworkConnectivity, etc.
│   ├── Templates/              # HTML report template
│   └── Tests/                  # Pester v5 tests
├── scripts/
│   └── setup-azure.ps1         # Automated Azure AD app registration
└── .github/workflows/ci.yml
```

## Coding Conventions

### TypeScript / React
- TypeScript strict mode, path alias `@/` → `src/`
- Prefer named exports; use Fluent UI v9 only (`@fluentui/react-components`)
- All Graph API calls go through `lib/graph-queries.ts` (server-side only)
- Use `zod` for runtime validation of external data (API inputs, PS uploads)
- Inline styles acceptable when Griffel `makeStyles` would add unnecessary complexity

### Check Framework
- Every check implements `CheckDefinition`: `id`, `categoryId`, `name`, `description`, `source`, `severity`, `execute(context)`
- `execute()` must never throw — catch errors and return `CheckResult` with `status: 'warning'`
- Check IDs follow the pattern: `{category-prefix}-{check-name}` (e.g., `cal-calendar-processing`, `net-tcp-443-reachable`)
- PowerShell checks (`source: 'powershell'`) return `pending` if they can't resolve; Exchange API may resolve them automatically
- Manual checks (`source: 'manual'`) always return `pending` until user provides input
- Checks are registered via category `index.ts` files, imported in `api/assessment/route.ts`

### PowerShell Module
- Module name: `MTRReadiness`
- Approved verbs: Test-, Get-, Export-, Invoke-
- Check functions return `[PSCustomObject]` with `CheckId`, `CategoryId`, `Status`, `Details`, `RawData`
- **Critical:** CheckId values must match the web app's check IDs exactly (e.g., `net-tcp-443-reachable`, not `tcp-443-reachable`)
- `ConvertTo-UploadJson` serializes results into the upload schema

### Check ID Alignment (Web ↔ PowerShell)
The upload merge matches by `checkId`. If IDs don't match, results won't merge. Current mappings:

| Web App Check ID | PS Function |
|------------------|-------------|
| `cal-calendar-processing` | `Test-CalendarProcessing` |
| `cal-external-meeting-processing` | `Test-ExternalMeetingProcessing` |
| `net-tcp-443-reachable` | `Test-TCPConnectivity` |
| `net-udp-ports-reachable` | `Test-UDPPortReachability` |
| `net-websocket-permitted` | `Test-WebSocketSupport` |
| `net-bandwidth-adequate` | `Test-BandwidthAdequacy` |
| `net-no-proxy-auth` | `Test-ProxyAuthentication` |
| `net-tls-inspection-bypass` | `Test-TLSInspection` |

### Security
- Never expose access tokens to the client
- Validate all API inputs with Zod before processing
- Sanitize logs — no UPNs, emails, or tenant IDs in console output
- Use parameterized Graph SDK calls — never string-interpolate URLs
- Upload tokens are single-use, time-limited, and tied to a specific assessment

### Git
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`
- Branch naming: `feature/`, `fix/`, `docs/`

## Key Constants

Defined in `apps/web/src/lib/constants.ts`:

- Teams Rooms Pro SKU: `Microsoft_Teams_Rooms_Pro`
- Teams Rooms Basic SKU: `Microsoft_Teams_Rooms_Basic`
- Teams Shared Devices: `MCOCAP` (must NOT be assigned to rooms)
- Basic license cap: 25 per tenant
- Min bandwidth: 10 Mbps
- Teams media UDP ports: 3478-3481
- Windows 11 min build: 22000
- EWS full shutdown: 2027-04-01

## Assessment Flow

1. User signs in via Microsoft Entra ID (or uses demo mode)
2. Selects device types to deploy
3. **Step 1** — clicks "Start Assessment":
   - API route creates Graph client from user's access token
   - Optionally acquires Exchange Online token (client credentials)
   - Engine runs all Graph checks concurrently
   - Engine executes PowerShell checks (Exchange API may auto-resolve calendar checks)
   - Browser runs network probes (STUN, WebSocket, fetch)
   - Server runs network probes
   - Results persisted to database
4. If pending checks remain → **Step 2** shows PowerShell commands with auto-discovered room mailboxes
5. PowerShell results upload via auto-upload URL (polling) or manual file upload at `/upload`
6. After upload → auto-redirect to full results page (`/assessment/[id]`)
7. Results page shows: readiness score donut, deployment verdict, category breakdown, attention items, export buttons

## Running the Project

```bash
# Web app
cd apps/web
npm install
npx prisma generate && npx prisma db push
npm run dev

# PowerShell module (network only)
Import-Module .\packages\powershell\MTRReadiness\MTRReadiness.psd1
Invoke-MTRReadinessCheck -SkipCalendar -OutputPath .\results.json

# PowerShell module (full)
Connect-ExchangeOnline
Invoke-MTRReadinessCheck -RoomMailboxes 'room@contoso.com' -OutputPath .\results.json
```

## Testing

```bash
# TypeScript type check
cd apps/web && npx tsc --noEmit

# PowerShell tests
Invoke-Pester ./packages/powershell/MTRReadiness/Tests/ -Output Detailed
```
