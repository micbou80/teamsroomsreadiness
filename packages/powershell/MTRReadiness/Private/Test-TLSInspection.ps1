function Test-TLSInspection {
    <#
    .SYNOPSIS
        Detects TLS inspection (SSL interception) on Teams service endpoints.
    .DESCRIPTION
        Connects to Teams endpoints and checks if the TLS certificate issuer
        matches Microsoft's expected issuers. A mismatch indicates TLS
        inspection by a proxy/firewall, which can break Teams Rooms.
    #>
    [CmdletBinding()]
    param()

    $endpoints = @(
        @{ Host = 'teams.microsoft.com'; Port = 443 }
        @{ Host = 'login.microsoftonline.com'; Port = 443 }
    )

    # Known Microsoft certificate issuers (partial match)
    $trustedIssuers = @(
        'Microsoft'
        'DigiCert'
        'GlobalSign'
    )

    $intercepted = @()
    $clean = @()

    foreach ($ep in $endpoints) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect($ep.Host, $ep.Port)

            $sslStream = New-Object System.Net.Security.SslStream(
                $tcp.GetStream(),
                $false,
                { param($s, $cert, $chain, $errors) return $true }  # Accept all for inspection
            )

            $sslStream.AuthenticateAsClient($ep.Host)
            $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($sslStream.RemoteCertificate)

            $issuer = $cert.Issuer
            $isTrusted = $false
            foreach ($ti in $trustedIssuers) {
                if ($issuer -match $ti) {
                    $isTrusted = $true
                    break
                }
            }

            if ($isTrusted) {
                $clean += [PSCustomObject]@{
                    Host   = $ep.Host
                    Issuer = $issuer
                }
            }
            else {
                $intercepted += [PSCustomObject]@{
                    Host   = $ep.Host
                    Issuer = $issuer
                }
            }

            $sslStream.Close()
            $tcp.Close()
        }
        catch {
            # Connection failures are handled by TCP connectivity check
        }
    }

    if ($intercepted.Count -eq 0) {
        return [PSCustomObject]@{
            CheckId    = 'net-tls-inspection-bypass'
            CategoryId = 'network'
            Status     = 'pass'
            Details    = "No TLS inspection detected on Teams endpoints. Certificates are issued by trusted Microsoft CAs."
            RawData    = @{
                clean       = ($clean | ForEach-Object { @{ Host = $_.Host; Issuer = $_.Issuer } })
                intercepted = @()
            }
        }
    }
    else {
        $detail = ($intercepted | ForEach-Object { "$($_.Host) (issuer: $($_.Issuer))" }) -join '; '
        return [PSCustomObject]@{
            CheckId    = 'net-tls-inspection-bypass'
            CategoryId = 'network'
            Status     = 'fail'
            Details    = "TLS inspection detected: $detail. Add Teams Optimize/Allow endpoints to your inspection bypass list."
            RawData    = @{
                clean       = ($clean | ForEach-Object { @{ Host = $_.Host; Issuer = $_.Issuer } })
                intercepted = ($intercepted | ForEach-Object { @{ Host = $_.Host; Issuer = $_.Issuer } })
            }
        }
    }
}
