function Test-ProxyAuthentication {
    <#
    .SYNOPSIS
        Checks if proxy authentication is required for Microsoft 365 endpoints.
    .DESCRIPTION
        Teams Rooms devices do not support proxy authentication. This check
        verifies that Optimize/Allow endpoints are accessible without auth.
    #>
    [CmdletBinding()]
    param()

    $testUrls = @(
        'https://teams.microsoft.com'
        'https://login.microsoftonline.com'
        'https://graph.microsoft.com'
    )

    $proxyDetected = @()
    $directAccess = @()

    foreach ($url in $testUrls) {
        try {
            $request = [System.Net.WebRequest]::Create($url)
            $request.Timeout = 10000
            $request.Method = 'HEAD'

            # Use default proxy settings (system proxy)
            $proxy = [System.Net.WebRequest]::GetSystemWebProxy()
            $proxyUri = $proxy.GetProxy([Uri]$url)

            if ($proxyUri.AbsoluteUri -ne $url) {
                # Traffic goes through a proxy - check if it requires auth
                $request.Proxy = $proxy
                $request.Proxy.Credentials = $null  # No credentials

                try {
                    $response = $request.GetResponse()
                    $response.Close()
                    $directAccess += $url
                }
                catch [System.Net.WebException] {
                    if ($_.Exception.Response.StatusCode -eq 407) {
                        $proxyDetected += $url
                    }
                    else {
                        $directAccess += $url
                    }
                }
            }
            else {
                $directAccess += $url
            }
        }
        catch {
            # Connection errors are handled by TCP check; skip here
            $directAccess += $url
        }
    }

    if ($proxyDetected.Count -eq 0) {
        return [PSCustomObject]@{
            CheckId    = 'net-no-proxy-auth'
            CategoryId = 'network'
            Status     = 'pass'
            Details    = "No proxy authentication required for Microsoft 365 endpoints."
            RawData    = @{ directAccess = $directAccess; proxyAuthRequired = @() }
        }
    }
    else {
        return [PSCustomObject]@{
            CheckId    = 'net-no-proxy-auth'
            CategoryId = 'network'
            Status     = 'fail'
            Details    = "Proxy authentication (HTTP 407) detected for: $($proxyDetected -join ', '). Teams Rooms does not support proxy auth."
            RawData    = @{ directAccess = $directAccess; proxyAuthRequired = $proxyDetected }
        }
    }
}
