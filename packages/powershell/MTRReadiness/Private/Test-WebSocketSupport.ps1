function Test-WebSocketSupport {
    <#
    .SYNOPSIS
        Tests whether WebSocket connections to Teams endpoints are permitted.
    .DESCRIPTION
        Teams Rooms uses WebSocket for real-time signaling. Some proxies or
        firewalls block the Upgrade: websocket header, breaking connectivity.
    #>
    [CmdletBinding()]
    param()

    $wsEndpoint = 'wss://trouter-azsc-ukso-0-a.trouter.teams.microsoft.com'

    try {
        $ws = New-Object System.Net.WebSockets.ClientWebSocket
        $cts = New-Object System.Threading.CancellationTokenSource(10000)

        $connectTask = $ws.ConnectAsync([Uri]$wsEndpoint, $cts.Token)
        $connectTask.Wait()

        if ($ws.State -eq 'Open' -or $ws.State -eq 'CloseSent') {
            $ws.CloseAsync(
                [System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure,
                'test',
                [System.Threading.CancellationToken]::None
            ).Wait(5000)

            return [PSCustomObject]@{
                CheckId    = 'websocket-permitted'
                CategoryId = 'network'
                Status     = 'pass'
                Details    = "WebSocket connections to Teams signaling endpoints are permitted."
                RawData    = @{ endpoint = $wsEndpoint; state = $ws.State.ToString() }
            }
        }
        else {
            return [PSCustomObject]@{
                CheckId    = 'websocket-permitted'
                CategoryId = 'network'
                Status     = 'fail'
                Details    = "WebSocket connection to Teams endpoint returned state: $($ws.State)."
                RawData    = @{ endpoint = $wsEndpoint; state = $ws.State.ToString() }
            }
        }
    }
    catch {
        return [PSCustomObject]@{
            CheckId    = 'websocket-permitted'
            CategoryId = 'network'
            Status     = 'fail'
            Details    = "WebSocket connection failed: $($_.Exception.InnerException.Message ?? $_.Exception.Message). Check proxy/firewall WebSocket rules."
            RawData    = @{ endpoint = $wsEndpoint; error = $_.Exception.Message }
        }
    }
    finally {
        if ($ws) { $ws.Dispose() }
        if ($cts) { $cts.Dispose() }
    }
}
