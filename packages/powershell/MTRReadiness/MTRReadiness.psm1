#Requires -Version 5.1

<#
.SYNOPSIS
    Teams Rooms Readiness — PowerShell companion module.
.DESCRIPTION
    Runs Exchange Online calendar-processing and network-connectivity checks
    that cannot be performed via Microsoft Graph API alone.
    Results are exported as JSON for upload to the web dashboard.
#>

$ErrorActionPreference = 'Stop'

# Dot-source private helpers
$privatePath = Join-Path $PSScriptRoot 'Private'
if (Test-Path $privatePath) {
    Get-ChildItem -Path $privatePath -Filter '*.ps1' -Recurse | ForEach-Object {
        . $_.FullName
    }
}

# Dot-source public functions
$publicPath = Join-Path $PSScriptRoot 'Public'
if (Test-Path $publicPath) {
    Get-ChildItem -Path $publicPath -Filter '*.ps1' -Recurse | ForEach-Object {
        . $_.FullName
    }
}
