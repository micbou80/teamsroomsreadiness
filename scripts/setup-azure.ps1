<#
.SYNOPSIS
    Automated Azure AD App Registration setup for Teams Rooms Readiness Assessment.

.DESCRIPTION
    Creates an Azure AD (Entra ID) app registration with all required Microsoft Graph
    permissions, generates a client secret, grants admin consent, and writes the
    .env file for the web dashboard.

    Requires: Azure CLI (az) — https://learn.microsoft.com/cli/azure/install-azure-cli

.PARAMETER AppName
    Display name for the app registration. Default: "Teams Rooms Readiness Assessment"

.PARAMETER WebAppUrl
    The URL where the web dashboard will run. Default: http://localhost:3000

.EXAMPLE
    # Interactive setup (prompts for login)
    .\scripts\setup-azure.ps1

    # Custom app name and URL
    .\scripts\setup-azure.ps1 -AppName "MTR Readiness - Prod" -WebAppUrl "https://mtr.contoso.com"
#>

[CmdletBinding()]
param(
    [string]$AppName = 'Teams Rooms Readiness Assessment',
    [string]$WebAppUrl = 'http://localhost:3000'
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# 1. Pre-flight checks
# ---------------------------------------------------------------------------

Write-Host "`n=== Teams Rooms Readiness — Azure Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check Azure CLI
try {
    $null = az version 2>&1
}
catch {
    Write-Error @"
Azure CLI (az) is not installed or not in PATH.
Install it from: https://learn.microsoft.com/cli/azure/install-azure-cli
"@
    exit 1
}

# Login
Write-Host "[1/6] Signing in to Azure..." -ForegroundColor Yellow
az login --output none 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Azure login failed. Please try again."
    exit 1
}

# Get tenant info
$account = az account show --output json | ConvertFrom-Json
$tenantId = $account.tenantId
$tenantName = $account.tenantDisplayName ?? $account.name ?? $tenantId

Write-Host "  Tenant: $tenantName ($tenantId)" -ForegroundColor Green

# ---------------------------------------------------------------------------
# 2. Create the App Registration
# ---------------------------------------------------------------------------

Write-Host "[2/6] Creating app registration: $AppName" -ForegroundColor Yellow

# Microsoft Graph API ID
$graphApiId = '00000003-0000-0000-c000-000000000000'

# Required delegated permissions (scope IDs for Microsoft Graph)
# These are well-known GUIDs from Microsoft Graph
$delegatedPermissions = @(
    @{ id = 'e1fe6dd8-ba31-4d61-89e7-88639da4683d'; type = 'Scope' }  # User.Read
    @{ id = 'a154be20-db9c-4678-8ab7-66f6cc099a59'; type = 'Scope' }  # User.Read.All
    @{ id = '498476ce-e0fe-48b0-b801-37ba7e2685c6'; type = 'Scope' }  # Organization.Read.All
    @{ id = '572fea84-0151-49b2-9301-11cb16974376'; type = 'Scope' }  # Policy.Read.All
    @{ id = '06da0dbc-49e2-44d2-8312-53f166ab848a'; type = 'Scope' }  # Directory.Read.All
    @{ id = '570282fd-fa5c-430d-a7fd-fc8dc98a9dca'; type = 'Scope' }  # MailboxSettings.Read
    @{ id = 'f51be20a-ofd5-4aa6-9960-75868919e129'; type = 'Scope' }  # DeviceManagementManagedDevices.Read.All
    @{ id = '40f97065-369a-49f4-947c-6a90f8a4c707'; type = 'Scope' }  # Place.Read.All
)

# Build the required resource access JSON
$resourceAccess = $delegatedPermissions | ForEach-Object {
    @{ id = $_.id; type = $_.type }
}

$requiredResourceAccess = @(
    @{
        resourceAppId  = $graphApiId
        resourceAccess = $resourceAccess
    }
) | ConvertTo-Json -Depth 5 -Compress

# Create the app
$redirectUri = "$WebAppUrl/api/auth/callback/microsoft-entra-id"

$appJson = az ad app create `
    --display-name $AppName `
    --sign-in-audience 'AzureADMultipleOrgs' `
    --web-redirect-uris $redirectUri `
    --required-resource-accesses $requiredResourceAccess `
    --output json 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create app registration: $appJson"
    exit 1
}

$app = $appJson | ConvertFrom-Json
$clientId = $app.appId
$objectId = $app.id

Write-Host "  App ID (Client ID): $clientId" -ForegroundColor Green

# ---------------------------------------------------------------------------
# 3. Create a client secret
# ---------------------------------------------------------------------------

Write-Host "[3/6] Creating client secret (valid 2 years)..." -ForegroundColor Yellow

$secretJson = az ad app credential reset `
    --id $objectId `
    --display-name 'MTR Readiness Secret' `
    --years 2 `
    --output json 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create client secret: $secretJson"
    exit 1
}

$secret = ($secretJson | ConvertFrom-Json).password
Write-Host "  Client secret created." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 4. Create service principal (required for consent)
# ---------------------------------------------------------------------------

Write-Host "[4/6] Creating service principal..." -ForegroundColor Yellow

$null = az ad sp create --id $clientId --output none 2>&1
# May already exist — ignore errors
Write-Host "  Service principal ready." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 5. Grant admin consent
# ---------------------------------------------------------------------------

Write-Host "[5/6] Granting admin consent for Graph permissions..." -ForegroundColor Yellow

# Wait a moment for propagation
Start-Sleep -Seconds 3

$consentResult = az ad app permission admin-consent --id $clientId 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Admin consent could not be granted automatically."
    Write-Warning "You may need to grant consent manually in the Azure portal:"
    Write-Warning "  Azure Portal > App registrations > $AppName > API permissions > Grant admin consent"
}
else {
    Write-Host "  Admin consent granted." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# 6. Generate .env file
# ---------------------------------------------------------------------------

Write-Host "[6/6] Writing .env file..." -ForegroundColor Yellow

$nextAuthSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })

$envPath = Join-Path $PSScriptRoot '..' 'apps' 'web' '.env'
$envContent = @"
# Generated by setup-azure.ps1 on $(Get-Date -Format 'yyyy-MM-dd HH:mm')
# Azure AD App Registration
AZURE_AD_CLIENT_ID=$clientId
AZURE_AD_CLIENT_SECRET=$secret
AZURE_AD_TENANT_ID=common

# NextAuth
NEXTAUTH_URL=$WebAppUrl
NEXTAUTH_SECRET=$nextAuthSecret
AUTH_SECRET=$nextAuthSecret

# Exchange Online (optional — enables automatic calendar processing checks)
# Requires: Exchange.ManageAsApp application permission + Exchange Administrator role on app
EXCHANGE_ENABLED=false

# Database
DATABASE_URL=file:./dev.db
"@

$envContent | Set-Content -Path $envPath -Encoding UTF8
Write-Host "  Written to: apps/web/.env" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

Write-Host ""
Write-Host "=== Setup complete! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "App Registration:" -ForegroundColor White
Write-Host "  Name:      $AppName"
Write-Host "  Client ID: $clientId"
Write-Host "  Tenant:    $tenantId (multi-tenant enabled)"
Write-Host "  Redirect:  $redirectUri"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  cd apps/web"
Write-Host "  npm install"
Write-Host "  npx prisma generate"
Write-Host "  npx prisma db push"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then open $WebAppUrl and sign in with your Microsoft 365 account." -ForegroundColor Green
Write-Host ""
