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

---

## Setup: Web Dashboard

### 1. Prerequisites

- Node.js 18+
- npm 9+
- A Microsoft 365 tenant with admin access
- An Azure AD app registration (see step 2)

---

### 2. Create an Azure AD App Registration

1. Go to [portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**
2. Set a name (e.g. `Teams Rooms Readiness`)
3. Supported account types: **Single tenant**
4. Redirect URI: `Web` → `http://localhost:3000/api/auth/callback/microsoft-entra-id`
5. Click **Register** — copy the **Application (client) ID** and **Directory (tenant) ID**

**Add a client secret:**

6. Go to **Certificates & secrets** → **New client secret**
7. Set an expiry → click **Add** → copy the **Value** immediately (it won't be shown again)

**Grant API permissions** (Microsoft Graph → Delegated):

8. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**, and add:
   - `User.Read.All`
   - `Organization.Read.All`
   - `Policy.Read.All`
   - `Directory.Read.All`
   - `MailboxSettings.Read`
   - `DeviceManagementManagedDevices.Read.All`
9. Click **Grant admin consent for [your tenant]**

---

### 3. Configure Environment Variables

Create two files in `apps/web/`:

**`apps/web/.env`** — read by Prisma:
```
DATABASE_URL="file:./dev.db"
```

**`apps/web/.env.local`** — read by Next.js:
```
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-directory-tenant-id

AUTH_SECRET=your-random-secret        # generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

> **Note:** `AUTH_SECRET` (not `NEXTAUTH_SECRET`) is required by NextAuth v5.

---

### 4. Install and Run

```bash
cd apps/web
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open **http://localhost:3000** and click **Get Started** to sign in with your Microsoft 365 admin account.

> Sign-in requires **Global Reader** or **Teams Administrator** role. All permissions are read-only.

---

## Setup: PowerShell Module

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

Upload the JSON output at `/upload` in the web dashboard to merge Exchange/network results with Graph API results.

---

## Check Categories

| Category | Checks | Source |
|----------|--------|
--------|
| Licensing | 5 | Graph API |
| Identity & Auth | 6 | Graph API |
| Calendar | 5 | Graph + PowerShell |
| Conditional Access | 4 | Graph API |
| Network | 6 | PowerShell |
| Platform | 4 | Graph + Intune |
| Security | 4 | Graph + Manual |
| Management | 3 | Graph + PowerShell |
| Voice / PSTN | 3 | Manual |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Fluent UI React v9 |
| Auth | NextAuth v5 (Auth.js), Microsoft Entra ID |
| Graph | `@microsoft/microsoft-graph-client` |
| Database | Prisma ORM, SQLite (dev) / PostgreSQL (prod) |
| Export | jsPDF + jspdf-autotable (PDF), ExcelJS (Excel) |
| PowerShell | ExchangeOnlineManagement, Pester v5 |

---

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

---

## Troubleshooting

**`AADSTS50194` — multi-tenant error**
Your app registration is single-tenant but the auth config is using the `/common` endpoint. Ensure `AZURE_AD_TENANT_ID` is set correctly in `.env.local`.

**`error=Configuration` on sign-in**
`AUTH_SECRET` is missing or not set. NextAuth v5 requires `AUTH_SECRET` (not `NEXTAUTH_SECRET`).

**Redirect loop after sign-in**
Ensure the redirect URI in your Azure AD app registration exactly matches `http://localhost:3000/api/auth/callback/microsoft-entra-id`.

**`DATABASE_URL` not found (Prisma)**
Prisma reads from `.env`, not `.env.local`. Make sure `DATABASE_URL` is in `apps/web/.env`.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-check`)
3. Follow the conventions in `CLAUDE.md`
4. Ensure the build passes (`npm run build`)
5. Submit a pull request

## License

[MIT](LICENSE)
