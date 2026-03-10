function Test-UDPPortReachability {
    <#
    .SYNOPSIS
        Tests UDP port reachability to Teams media relay endpoints.
    .DESCRIPTION
        Verifies that UDP ports 3478-3481 are reachable to Teams transport relays
        (worldaz.tr.teams.microsoft.com). Uses a lightweight UDP send/receive test.
    #>
    [CmdletBinding()]
    param()

    $targetHost = 'worldaz.tr.teams.microsoft.com'
    $ports = @(3478, 3479, 3480, 3481)
    $failedPorts = @()
    $passedPorts = @()

    foreach ($port in $ports) {
        try {
            $udpClient = New-Object System.Net.Sockets.UdpClient
            $udpClient.Client.ReceiveTimeout = 3000
            $udpClient.Client.SendTimeout = 3000

            # Resolve hostname first
            $addresses = [System.Net.Dns]::GetHostAddresses($targetHost)
            if ($addresses.Count -eq 0) {
                $failedPorts += $port
                continue
            }

            $endpoint = New-Object System.Net.IPEndPoint($addresses[0], $port)

            # Send a STUN binding request (simplified — 20-byte header)
            $stunHeader = [byte[]]@(0x00, 0x01, 0x00, 0x00) + # Binding Request, length 0
                          [byte[]]@(0x21, 0x12, 0xA4, 0x42) + # Magic cookie
                          (1..12 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }) # Transaction ID

            [void]$udpClient.Send($stunHeader, $stunHeader.Length, $endpoint)

            try {
                $remoteEP = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Any, 0)
                $response = $udpClient.Receive([ref]$remoteEP)
                $passedPorts += $port
            }
            catch [System.Net.Sockets.SocketException] {
                # Timeout — port may be blocked
                $failedPorts += $port
            }
            finally {
                $udpClient.Close()
            }
        }
        catch {
            $failedPorts += $port
        }
    }

    if ($failedPorts.Count -eq 0) {
        return [PSCustomObject]@{
            CheckId    = 'udp-ports-reachable'
            CategoryId = 'network'
            Status     = 'pass'
            Details    = "All Teams media relay UDP ports (3478-3481) are reachable."
            RawData    = @{ target = $targetHost; passedPorts = $passedPorts; failedPorts = @() }
        }
    }
    else {
        return [PSCustomObject]@{
            CheckId    = 'udp-ports-reachable'
            CategoryId = 'network'
            Status     = 'fail'
            Details    = "UDP port(s) $($failedPorts -join ', ') are not reachable to $targetHost. Media quality will be degraded."
            RawData    = @{ target = $targetHost; passedPorts = $passedPorts; failedPorts = $failedPorts }
        }
    }
}

function Test-TCPConnectivity {
    <#
    .SYNOPSIS
        Tests TCP 443 connectivity to critical Teams service endpoints.
    #>
    [CmdletBinding()]
    param()

    $endpoints = @(
        'teams.microsoft.com'
        'teams.cdn.office.net'
        'statics.teams.cdn.office.net'
        'login.microsoftonline.com'
        'graph.microsoft.com'
        'device.teams.microsoft.com'
    )

    $failed = @()
    $passed = @()

    foreach ($ep in $endpoints) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $result = $tcp.BeginConnect($ep, 443, $null, $null)
            $success = $result.AsyncWaitHandle.WaitOne(5000, $false)

            if ($success -and $tcp.Connected) {
                $passed += $ep
            }
            else {
                $failed += $ep
            }
            $tcp.Close()
        }
        catch {
            $failed += $ep
        }
    }

    if ($failed.Count -eq 0) {
        return [PSCustomObject]@{
            CheckId    = 'tcp-443-reachable'
            CategoryId = 'network'
            Status     = 'pass'
            Details    = "All $($endpoints.Count) Teams service endpoints are reachable on TCP 443."
            RawData    = @{ passed = $passed; failed = @() }
        }
    }
    else {
        return [PSCustomObject]@{
            CheckId    = 'tcp-443-reachable'
            CategoryId = 'network'
            Status     = 'fail'
            Details    = "$($failed.Count) endpoint(s) unreachable on TCP 443: $($failed -join ', ')."
            RawData    = @{ passed = $passed; failed = $failed }
        }
    }
}
