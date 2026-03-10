function Invoke-MTRReadinessCheck {
    <#
    .SYNOPSIS
        Runs all Teams Rooms readiness checks (calendar + network) and outputs results.
    .DESCRIPTION
        Orchestrates Exchange Online calendar-processing checks and local network
        connectivity checks. Results can be exported as JSON for upload to the
        web dashboard or as a standalone HTML report.
    .PARAMETER RoomMailboxes
        One or more UPNs or email addresses of room mailboxes to check.
        If omitted, only network checks are run.
    .PARAMETER SkipNetwork
        Skip network connectivity checks.
    .PARAMETER SkipCalendar
        Skip Exchange Online calendar processing checks.
    .PARAMETER OutputPath
        Path to save JSON results. If omitted, results are returned as objects.
    .PARAMETER PassThru
        Return results as objects even when OutputPath is specified.
    .EXAMPLE
        Invoke-MTRReadinessCheck -RoomMailboxes 'mtr-room1@contoso.com','mtr-room2@contoso.com'
    .EXAMPLE
        Invoke-MTRReadinessCheck -RoomMailboxes 'mtr-room1@contoso.com' -OutputPath './results.json'
    .EXAMPLE
        Invoke-MTRReadinessCheck -SkipCalendar
    #>
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline, ValueFromPipelineByPropertyName)]
        [string[]]$RoomMailboxes,

        [switch]$SkipNetwork,
        [switch]$SkipCalendar,

        [string]$OutputPath,
        [switch]$PassThru
    )

    begin {
        $allResults = [System.Collections.Generic.List[object]]::new()
        $hostname = $env:COMPUTERNAME ?? (hostname)
    }

    process {
        # ---------------------------------------------------------------
        # Calendar checks (require Exchange Online connection)
        # ---------------------------------------------------------------
        if (-not $SkipCalendar -and $RoomMailboxes) {
            # Verify Exchange Online connection
            $exoConnected = $false
            try {
                $null = Get-Command Get-CalendarProcessing -ErrorAction Stop
                $exoConnected = $true
            }
            catch {
                Write-Warning "Exchange Online module not connected. Run Connect-ExchangeOnline first. Skipping calendar checks."
            }

            if ($exoConnected) {
                foreach ($mailbox in $RoomMailboxes) {
                    Write-Host "  Checking calendar processing: $mailbox" -ForegroundColor Cyan

                    $calResults = Test-CalendarProcessing -Identity $mailbox
                    foreach ($r in $calResults) { $allResults.Add($r) }

                    $extResult = Test-ExternalMeetingProcessing -Identity $mailbox
                    $allResults.Add($extResult)
                }
            }
        }
    }

    end {
        # ---------------------------------------------------------------
        # Network checks (local execution)
        # ---------------------------------------------------------------
        if (-not $SkipNetwork) {
            Write-Host "  Checking UDP port reachability (3478-3481)..." -ForegroundColor Cyan
            $allResults.Add((Test-UDPPortReachability))

            Write-Host "  Checking TCP 443 connectivity..." -ForegroundColor Cyan
            $allResults.Add((Test-TCPConnectivity))

            Write-Host "  Checking proxy authentication..." -ForegroundColor Cyan
            $allResults.Add((Test-ProxyAuthentication))

            Write-Host "  Checking TLS inspection..." -ForegroundColor Cyan
            $allResults.Add((Test-TLSInspection))

            Write-Host "  Checking WebSocket support..." -ForegroundColor Cyan
            $allResults.Add((Test-WebSocketSupport))

            Write-Host "  Estimating bandwidth..." -ForegroundColor Cyan
            $allResults.Add((Test-BandwidthAdequacy))
        }

        # ---------------------------------------------------------------
        # Summary
        # ---------------------------------------------------------------
        $passed = ($allResults | Where-Object { $_.Status -eq 'pass' }).Count
        $failed = ($allResults | Where-Object { $_.Status -eq 'fail' }).Count
        $warnings = ($allResults | Where-Object { $_.Status -eq 'warning' }).Count
        $total = $allResults.Count

        Write-Host ""
        Write-Host "  Results: $total checks — " -NoNewline
        Write-Host "$passed passed" -ForegroundColor Green -NoNewline
        Write-Host ", $failed failed" -ForegroundColor Red -NoNewline
        Write-Host ", $warnings warnings" -ForegroundColor Yellow
        Write-Host ""

        # ---------------------------------------------------------------
        # Output
        # ---------------------------------------------------------------
        if ($OutputPath) {
            $uploadJson = ConvertTo-UploadJson -CheckResults $allResults.ToArray() -Hostname $hostname
            $json = $uploadJson | ConvertTo-Json -Depth 10
            $json | Out-File -FilePath $OutputPath -Encoding utf8 -Force
            Write-Host "  Results saved to: $OutputPath" -ForegroundColor Green
            Write-Host "  Upload this file to the web dashboard at /upload" -ForegroundColor Gray
        }

        if (-not $OutputPath -or $PassThru) {
            return $allResults.ToArray()
        }
    }
}
