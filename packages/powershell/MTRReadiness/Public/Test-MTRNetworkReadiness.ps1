function Test-MTRNetworkReadiness {
    <#
    .SYNOPSIS
        Runs only the network connectivity checks for Teams Rooms.
    .DESCRIPTION
        Convenience wrapper that runs UDP, TCP, proxy, TLS inspection,
        WebSocket, and bandwidth checks without requiring Exchange Online.
    .PARAMETER OutputPath
        Optional path to save JSON results.
    .EXAMPLE
        Test-MTRNetworkReadiness
    .EXAMPLE
        Test-MTRNetworkReadiness -OutputPath './network-results.json'
    #>
    [CmdletBinding()]
    param(
        [string]$OutputPath
    )

    Write-Host ""
    Write-Host "  Teams Rooms Network Readiness Check" -ForegroundColor Cyan
    Write-Host "  ====================================" -ForegroundColor Cyan
    Write-Host ""

    Invoke-MTRReadinessCheck -SkipCalendar -OutputPath $OutputPath -PassThru
}
