# Teams Rooms Readiness Assessment

An open-source tool that validates your Microsoft 365 tenant configuration before deploying Microsoft Teams Rooms. Runs **40 automated checks across 9 categories**: licensing, identity, calendar, Conditional Access, network, platform, security, management, and voice.

---

## How it works

```
[Browser]  <-->  [Next.js Web App]  <-->  [Microsoft Graph API]
                       |
                 [Upload API]  <--  [PowerShell Module]
                                    (Exchange Online + network checks)
```

The web dashboard signs in with your Microsoft 365 account and runs read-only checks against your tenant via the Graph API. Checks that require local network access or Exchange Online are run separately using the PowerShell companion module, and the results are uploaded to the dashboard for a unified report.

**No data leaves your tenant.** All Graph API calls are made server-side. Access tokens are never exposed to the browser.

---

## Try it first (no sign-in required)

Open the app and click **Try Demo Mode** to explore a simulated assessment without connecting to any tenant. Good for evaluating the tool before setup.

---

## Installation

### Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Git**
- A **Microsoft 365 tenant** where you have Global Administrator or Global Reader + Teams Administrator rights
- An **Azure AD app registration** (see below — takes about 5 minutes)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/micbou80/teamsroomsreadiness.git
cd teamsroomsreadiness
```

---

### Step 2 — Set up the Azure AD App Registration

The tool needs a registered app in your Azure AD tenant to authenticate users and call the Microsoft Graph API. You can do this **automatically** (recommended) or **manually**.

---

#### Option A: Automated setup (recommended)

Requires [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) to be installed.

```powershell
# Run from the repo root
.\scripts\setup-azure.ps1
```

This script will:
- Sign you in to Azure
- Create the app registration with all required permissions
- Generate a client secret
- Grant admin consent
- Write the `.env` file for you automatically

Once complete, skip to [Step 3](#step-3--install-dependencies-and-run).

---

#### Option B: Manual setup

**1. Create the app registration**

1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** → **App registrations** → **New registration**
3. Fill in the form:
   - **Name:** `Teams Rooms Readiness` (or anything you like)
   - **Supported account types:** Accounts in this organizational directory only (Single tenant)
   - **Redirect URI:** Select `Web` and enter `http://localhost:3000/api/auth/callback/microsoft-entra-id`
4. Click **Register**
5. On the app overview page, copy:
   - **Application (client) ID** → this is your `AZURE_AD_CLIENT_ID`
   - **Directory (tenant) ID** → this is your `AZURE_AD_TENANT_ID`

**2. Create a client secret**

1. In your app, go to **Certificates & secrets** → **Client secrets** → **New client secret**
2. Give it a description and choose an expiry
3. Click **Add**
4. **Copy the Value immediately** — it will not be shown again
   - This is your `AZURE_AD_CLIENT_SECRET`

**3. Add API permissions**

1. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**
2. Search for and add each of the following:

   | Permission | Purpose |
   |---|---|
   | `User.Read.All` | Read resource account properties |
   | `Organization.Read.All` | Read tenant license inventory |
   | `Policy.Read.All` | Read Conditional Access policies |
   | `Directory.Read.All` | Read group memberships and directory objects |
   | `MailboxSettings.Read` | Read mailbox settings for room accounts |
   | `DeviceManagementManagedDevices.Read.All` | Read Intune device compliance |
   | `Place.Read.All` | Read Teams Rooms and workplace data |

3. Click **Grant admin consent for [your tenant]** and confirm

   > You must be a **Global Administrator** to grant admin consent. If you don't have this role, ask your tenant admin to grant consent after you've added the permissions.

---

### Step 3 — Configure environment variables

Create two files inside `apps/web/`:

**`apps/web/.env`** — used by Prisma (database):
```
DATABASE_URL="file:./dev.db"
```

**`apps/web/.env.local`** — used by Next.js (app config):
```
# Azure AD app registration
AZURE_AD_CLIENT_ID=paste-your-client-id-here
AZURE_AD_CLIENT_SECRET=paste-your-client-secret-here
AZURE_AD_TENANT_ID=paste-your-tenant-id-here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=paste-a-random-secret-here
```

To generate a value for `AUTH_SECRET`, run:
```bash
openssl rand -base64 32
```

> **Note:** Use `AUTH_SECRET`, not `NEXTAUTH_SECRET`. NextAuth v5 requires the new name.

> **Note:** Prisma reads from `.env`, not `.env.local`. Both files are needed.

---

### Step 4 — Install dependencies and run

```bash
cd apps/web
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

Click **Sign in with Microsoft** and authenticate with your Microsoft 365 admin account.

---

## PowerShell Module (optional)

The PowerShell companion module runs checks that require local execution — network connectivity probes and Exchange Online calendar processing. These supplement the Graph API checks in the web dashboard.

### Install prerequisites

```powershell
Install-Module ExchangeOnlineManagement -Scope CurrentUser
```

### Run checks

```powershell
# Import the module
Import-Module ./packages/powershell/MTRReadiness/MTRReadiness.psd1

# Network checks only (no Exchange Online connection needed)
Test-MTRNetworkReadiness -OutputPath './network-results.json'

# Full check including calendar processing
Connect-ExchangeOnline
Invoke-MTRReadinessCheck -RoomMailboxes 'room@contoso.com' -OutputPath './results.json'

# Generate a standalone HTML report
Export-MTRReadinessReport -RoomMailboxes 'room@contoso.com' -OutputPath './report.html'
```

### Upload results to the dashboard

1. Go to **http://localhost:3000/upload**
2. Upload the JSON file
3. The results will be merged with your Graph API assessment

---

## What gets checked

| Category | Checks | How |
|---|---|---|
| Licensing | 5 | Graph API |
| Identity & Auth | 6 | Graph API |
| Calendar | 5 | Graph API + PowerShell |
| Conditional Access | 4 | Graph API |
| Network | 6 | PowerShell |
| Platform | 4 | Graph API + Intune |
| Security | 4 | Graph API + Manual |
| Management | 3 | Graph API + PowerShell |
| Voice / PSTN | 3 | Manual |

---

## Troubleshooting

**`AADSTS50194` — multi-tenant error**
The app registration is set to single tenant but the auth config is hitting the `/common` endpoint. Make sure `AZURE_AD_TENANT_ID` is set correctly in `.env.local`.

**`error=Configuration` on the sign-in page**
`AUTH_SECRET` is missing. NextAuth v5 requires `AUTH_SECRET` (not `NEXTAUTH_SECRET`). Check your `.env.local`.

**Redirect loop after sign-in**
The redirect URI in your Azure AD app registration must exactly match `http://localhost:3000/api/auth/callback/microsoft-entra-id`. Check for trailing slashes or http vs https mismatches.

**`DATABASE_URL not found` error from Prisma**
Prisma reads from `.env`, not `.env.local`. Make sure `DATABASE_URL` is set in `apps/web/.env`.

**`Not authenticated` error when running an assessment**
Your session may have expired. Sign out and sign in again. If it persists, check that `AUTH_SECRET` is the same value in both `.env` and `.env.local`.

**Admin consent not granted**
If your account doesn't have Global Administrator rights, the API calls will fail. Ask your tenant admin to go to **Azure Portal → App registrations → [your app] → API permissions → Grant admin consent**.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Fluent UI React v9 |
| Auth | NextAuth v5 (Auth.js), Microsoft Entra ID |
| Graph API | `@microsoft/microsoft-graph-client` |
| Database | Prisma ORM, SQLite (dev) / PostgreSQL (prod) |
| Export | jsPDF, ExcelJS |
| PowerShell | ExchangeOnlineManagement, Pester v5 |

---

## Project structure

```
teamsroomsreadiness/
├── apps/web/                        # Next.js web dashboard
│   ├── src/
│   │   ├── app/                     # Pages and API routes
│   │   ├── checks/                  # 40 check definitions + engine
│   │   ├── components/              # Fluent UI components
│   │   └── lib/                     # Auth, Graph client, DB, utilities
│   └── prisma/                      # Database schema
├── packages/powershell/
│   └── MTRReadiness/                # PowerShell companion module
│       ├── Public/                  # Exported cmdlets
│       ├── Private/                 # Internal check functions
│       ├── Templates/               # HTML report template
│       └── Tests/                   # Pester tests
└── scripts/
    └── setup-azure.ps1              # Automated Azure AD setup script
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-check`
3. Follow the conventions in `CLAUDE.md`
4. Make sure the build passes: `npm run build`
5. Submit a pull request

---

## License

[MIT](LICENSE)
