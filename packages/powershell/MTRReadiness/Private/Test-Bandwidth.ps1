function Test-BandwidthAdequacy {
    <#
    .SYNOPSIS
        Estimates available bandwidth to Microsoft 365 endpoints.
    .DESCRIPTION
        Downloads a known file from a Microsoft CDN and measures throughput.
        Teams Rooms requires >= 10 Mbps per room for reliable media.
    .PARAMETER MinimumMbps
        Minimum acceptable bandwidth in Mbps. Default: 10.
    #>
    [CmdletBinding()]
    param(
        [int]$MinimumMbps = 10
    )

    # Use a known Microsoft endpoint for download test (~1 MB)
    $testUrl = 'https://www.microsoft.com/favicon.ico'
    $iterations = 3
    $speeds = @()

    for ($i = 0; $i -lt $iterations; $i++) {
        try {
            $webClient = New-Object System.Net.WebClient
            $sw = [System.Diagnostics.Stopwatch]::StartNew()
            $data = $webClient.DownloadData($testUrl)
            $sw.Stop()
            $webClient.Dispose()

            $bytes = $data.Length
            $seconds = $sw.Elapsed.TotalSeconds
            if ($seconds -gt 0) {
                $mbps = ($bytes * 8) / ($seconds * 1000000)
                $speeds += $mbps
            }
        }
        catch {
            # Skip failed iterations
        }
    }

    if ($speeds.Count -eq 0) {
        return [PSCustomObject]@{
            CheckId    = 'bandwidth-adequate'
            CategoryId = 'network'
            Status     = 'warning'
            Details    = "Could not measure bandwidth — download test failed. Verify internet connectivity."
            RawData    = @{ error = 'All download attempts failed'; minimumMbps = $MinimumMbps }
        }
    }

    $avgMbps = [math]::Round(($speeds | Measure-Object -Average).Average, 2)

    # Note: this is a rough estimate using a small file. Real bandwidth may differ.
    if ($avgMbps -ge $MinimumMbps) {
        return [PSCustomObject]@{
            CheckId    = 'bandwidth-adequate'
            CategoryId = 'network'
            Status     = 'pass'
            Details    = "Estimated bandwidth: ${avgMbps} Mbps (minimum: ${MinimumMbps} Mbps). Note: this is an estimate using a small download; consider a dedicated speed test for production validation."
            RawData    = @{ estimatedMbps = $avgMbps; minimumMbps = $MinimumMbps; samples = $speeds.Count }
        }
    }
    else {
        return [PSCustomObject]@{
            CheckId    = 'bandwidth-adequate'
            CategoryId = 'network'
            Status     = 'warning'
            Details    = "Estimated bandwidth: ${avgMbps} Mbps — below the recommended ${MinimumMbps} Mbps per room. Consider a dedicated speed test for accurate measurement."
            RawData    = @{ estimatedMbps = $avgMbps; minimumMbps = $MinimumMbps; samples = $speeds.Count }
        }
    }
}
