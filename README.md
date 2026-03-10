# Teams Rooms Readiness Assessment

An open-source tool to validate your Microsoft 365 tenant configuration before deploying Microsoft Teams Rooms. Runs **40 checks across 9 categories** covering licensing, identity, calendar, Conditional Access, network, platform, security, management, and voice.

## Architecture

```
[Browser]  <-->  [Next.js Web App]  <-->  [Microsoft Graph API]
                      |
                [Upload API]  <--  [PowerShell Companion Module]
                                   (Exchange Online + Network checks)
```

- **Web Dashboard**: Next.js 14 + Fluent UI React v9 — runs Graph API checks server-side
- **PowerShell Module**: `MTRReadiness` — Exchange Online calendar processing + network connectivity checks that require local execution
- **Upload flow**: PowerShell results exported as JSON and merged with Graph results via the upload API

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- An Azure AD app registration (for Graph API access)

### Web Dashboard

```bash
cd apps/web
cp .env.example .env      # Edit with your Azure AD credentials
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open http://localhost:3000. Use `?demo=true` on API routes to test without Azure AD.

### PowerShell Module

```powershell
# Import the module
Import-Module ./packages/powershell/MTRReadiness/MTRReadiness.psd1

# Network checks only (no Exchange Online needed)
Test-MTRNetworkReadiness -OutputPath './network-results.json'

# Full check including calendar processing
Connect-ExchangeOnline
Invoke-MTRReadinessCheck -RoomMailboxes 'mtr-room1@contoso.com' -OutputPath './results.json'

# Generate HTML report
Export-MTRReadinessReport -RoomMailboxes 'mtr-room1@contoso.com' -OutputPath './report.html'
```

Upload the JSON output at `/upload` in the web dashboard to merge with Graph results.

## Check Categories

| Category | Checks | Source |
|----------|--------|--------|
| Licensing | 5 | Graph API |
| Identity & Auth | 6 | Graph API |
| Calendar | 5 | Graph + PowerShell |
| Conditional Access | 4 | Graph API |
| Network | 6 | PowerShell |
| Platform | 4 | Graph + Intune |
| Security | 4 | Graph + Manual |
| Management | 3 | Graph + PowerShell |
| Voice / PSTN | 3 | Manual |

## Azure AD Permissions

The app requires these **read-only** permissions (admin consent):

- `User.Read.All` — resource account properties
- `Organization.Read.All` — tenant license inventory
- `Policy.Read.All` — Conditional Access policies
- `Directory.Read.All` — group memberships
- `MailboxSettings.Read` — basic mailbox settings
- `DeviceManagementManagedDevices.Read.All` — Intune compliance

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Fluent UI React v9 |
| Auth | NextAuth v5 (Auth.js), Microsoft Entra ID |
| Graph | `@microsoft/microsoft-graph-client` |
| Database | Prisma ORM, SQLite (dev) / PostgreSQL (prod) |
| Export | jsPDF + jspdf-autotable (PDF), ExcelJS (Excel) |
| PowerShell | ExchangeOnlineManagement, Pester v5 |

## Project Structure

```
teamsroomsreadiness/
├── apps/web/                    # Next.js web dashboard
│   ├── src/
│   │   ├── app/                 # App Router pages + API routes
│   │   ├── checks/              # 40 check definitions + engine
│   │   ├── components/          # Fluent UI components
│   │   └── lib/                 # Auth, Graph client, DB, utilities
│   └── prisma/                  # Database schema
├── packages/powershell/
│   └── MTRReadiness/            # PowerShell companion module
│       ├── Public/              # Exported functions
│       ├── Private/             # Internal helpers
│       ├── Templates/           # HTML report template
│       └── Tests/               # Pester tests
└── CLAUDE.md                    # Project conventions
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-check`)
3. Follow the conventions in `CLAUDE.md`
4. Ensure the build passes (`npm run build`)
5. Submit a pull request

## License

[MIT](LICENSE)
