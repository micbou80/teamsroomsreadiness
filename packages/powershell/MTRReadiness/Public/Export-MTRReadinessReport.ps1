function Export-MTRReadinessReport {
    <#
    .SYNOPSIS
        Generates a standalone HTML report from check results.
    .DESCRIPTION
        Takes check results (from Invoke-MTRReadinessCheck) and produces a
        self-contained HTML file with a visual summary and detailed results.
    .PARAMETER CheckResults
        Array of check result objects. If not provided, runs all checks first.
    .PARAMETER RoomMailboxes
        Room mailboxes to check (passed to Invoke-MTRReadinessCheck if CheckResults not provided).
    .PARAMETER OutputPath
        Path for the HTML report. Defaults to 'MTRReadiness-Report.html' in current directory.
    .EXAMPLE
        Export-MTRReadinessReport -RoomMailboxes 'mtr-room1@contoso.com' -OutputPath './report.html'
    .EXAMPLE
        $results = Invoke-MTRReadinessCheck -RoomMailboxes 'mtr-room1@contoso.com'
        Export-MTRReadinessReport -CheckResults $results
    #>
    [CmdletBinding()]
    param(
        [object[]]$CheckResults,
        [string[]]$RoomMailboxes,
        [string]$OutputPath = 'MTRReadiness-Report.html'
    )

    if (-not $CheckResults) {
        $params = @{}
        if ($RoomMailboxes) { $params.RoomMailboxes = $RoomMailboxes }
        $CheckResults = Invoke-MTRReadinessCheck @params -PassThru
    }

    $hostname = $env:COMPUTERNAME ?? (hostname)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC' -AsUTC

    $passed = ($CheckResults | Where-Object { $_.Status -eq 'pass' }).Count
    $failed = ($CheckResults | Where-Object { $_.Status -eq 'fail' }).Count
    $warnings = ($CheckResults | Where-Object { $_.Status -eq 'warning' }).Count
    $total = $CheckResults.Count

    # Group by category
    $categories = $CheckResults | Group-Object -Property CategoryId

    # Build check rows HTML
    $checkRowsHtml = ""
    foreach ($cat in $categories) {
        $catName = switch ($cat.Name) {
            'calendar' { 'Calendar Processing' }
            'network'  { 'Network Connectivity' }
            default    { $cat.Name }
        }
        $checkRowsHtml += "<tr class='category-header'><td colspan='3'>$catName</td></tr>`n"

        foreach ($check in $cat.Group) {
            $statusClass = switch ($check.Status) {
                'pass'    { 'status-pass' }
                'fail'    { 'status-fail' }
                'warning' { 'status-warning' }
                default   { 'status-info' }
            }
            $statusLabel = switch ($check.Status) {
                'pass'    { '&#x2705; Pass' }
                'fail'    { '&#x274C; Fail' }
                'warning' { '&#x26A0;&#xFE0F; Warning' }
                default   { '&#x2139;&#xFE0F; Info' }
            }
            $escapedDetails = [System.Web.HttpUtility]::HtmlEncode($check.Details)
            $checkRowsHtml += "<tr><td class='check-id'>$($check.CheckId)</td><td class='$statusClass'>$statusLabel</td><td>$escapedDetails</td></tr>`n"
        }
    }

    # Load template or use inline
    $templatePath = Join-Path $PSScriptRoot '..\Templates\report.html'
    if (Test-Path $templatePath) {
        $html = Get-Content -Path $templatePath -Raw
        $html = $html -replace '{{HOSTNAME}}', $hostname
        $html = $html -replace '{{TIMESTAMP}}', $timestamp
        $html = $html -replace '{{TOTAL}}', $total
        $html = $html -replace '{{PASSED}}', $passed
        $html = $html -replace '{{FAILED}}', $failed
        $html = $html -replace '{{WARNINGS}}', $warnings
        $html = $html -replace '{{CHECK_ROWS}}', $checkRowsHtml
    }
    else {
        # Inline fallback template
        $html = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Teams Rooms Readiness Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f5f5f5; color: #242424; padding: 32px; }
  .container { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 24px; font-weight: 600; margin-bottom: 4px; }
  .subtitle { color: #616161; font-size: 14px; margin-bottom: 24px; }
  .summary { display: flex; gap: 16px; margin-bottom: 24px; }
  .summary-card { flex: 1; background: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .summary-card .number { font-size: 32px; font-weight: 700; }
  .summary-card .label { font-size: 12px; color: #616161; margin-top: 4px; }
  .pass .number { color: #107c10; }
  .fail .number { color: #d13438; }
  .warn .number { color: #ca5010; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  th { background: #0078d4; color: white; padding: 12px 16px; text-align: left; font-size: 13px; }
  td { padding: 10px 16px; border-bottom: 1px solid #edebe9; font-size: 13px; }
  .category-header td { background: #f3f2f1; font-weight: 600; font-size: 14px; }
  .check-id { font-family: 'Cascadia Code', Consolas, monospace; font-size: 12px; color: #616161; }
  .status-pass { color: #107c10; font-weight: 600; }
  .status-fail { color: #d13438; font-weight: 600; }
  .status-warning { color: #ca5010; font-weight: 600; }
  .status-info { color: #0078d4; }
  .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #a19f9d; }
</style>
</head>
<body>
<div class="container">
  <h1>Teams Rooms Readiness Report</h1>
  <div class="subtitle">Host: $hostname | Generated: $timestamp</div>
  <div class="summary">
    <div class="summary-card"><div class="number">$total</div><div class="label">Total Checks</div></div>
    <div class="summary-card pass"><div class="number">$passed</div><div class="label">Passed</div></div>
    <div class="summary-card fail"><div class="number">$failed</div><div class="label">Failed</div></div>
    <div class="summary-card warn"><div class="number">$warnings</div><div class="label">Warnings</div></div>
  </div>
  <table>
    <thead><tr><th>Check</th><th>Status</th><th>Details</th></tr></thead>
    <tbody>
      $checkRowsHtml
    </tbody>
  </table>
  <div class="footer">Generated by MTRReadiness PowerShell Module v0.1.0</div>
</div>
</body>
</html>
"@
    }

    $html | Out-File -FilePath $OutputPath -Encoding utf8 -Force
    Write-Host "  HTML report saved to: $OutputPath" -ForegroundColor Green
}
