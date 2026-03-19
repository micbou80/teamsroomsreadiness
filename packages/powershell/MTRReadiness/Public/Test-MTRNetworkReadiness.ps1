function Test-MTRNetworkReadiness {
    <#
    .SYNOPSIS
        Runs only the network connectivity checks for Teams Rooms.
    .DESCRIPTION
        Convenience wrapper that runs UDP, TCP, proxy, TLS inspection,
        WebSocket, and bandwidth checks without requiring Exchange Online.
        Results are saved as JSON for upload to the web dashboard.
    .PARAMETER OutputPath
        Path to save JSON results. Defaults to ./mtr-network-results.json
        in the current directory.
    .EXAMPLE
        Test-MTRNetworkReadiness
    .EXAMPLE
        Test-MTRNetworkReadiness -OutputPath './my-network-results.json'
    #>
    [CmdletBinding()]
    param(
        [string]$OutputPath
    )

    if (-not $OutputPath) {
        $OutputPath = Join-Path (Get-Location) "mtr-network-results.json"
    }

    Write-Host ""
    Write-Host "  Teams Rooms Network Readiness Check" -ForegroundColor Cyan
    Write-Host "  ====================================" -ForegroundColor Cyan
    Write-Host ""

    Invoke-MTRReadinessCheck -SkipCalendar -OutputPath $OutputPath
}
