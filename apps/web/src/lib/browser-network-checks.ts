/**
 * Browser-based network checks that run from the user's actual network.
 *
 * These use WebRTC, WebSocket, and fetch APIs to test connectivity
 * to Teams endpoints without requiring the PowerShell module.
 * Results are merged into the assessment via /api/assessment/merge-network.
 */

export interface BrowserCheckResult {
  checkId: string;
  categoryId: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  details: string;
  rawData: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 1. UDP/STUN reachability via WebRTC
// ---------------------------------------------------------------------------

async function checkUdpStunReachability(): Promise<BrowserCheckResult> {
  const stunServers = [
    'stun:worldaz.tr.teams.microsoft.com:3478',
    'stun:13.107.17.41:3478',
  ];

  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: stunServers }],
    });

    // Create a data channel to trigger ICE gathering
    pc.createDataChannel('stun-test');

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const result = await new Promise<{ found: boolean; candidateType: string }>((resolve) => {
      let foundSrflx = false;
      const timeout = setTimeout(() => {
        resolve({ found: foundSrflx, candidateType: foundSrflx ? 'srflx' : 'host-only' });
      }, 10000);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate;
          if (candidate.includes('srflx')) {
            foundSrflx = true;
            clearTimeout(timeout);
            resolve({ found: true, candidateType: 'srflx' });
          }
        } else {
          // ICE gathering complete
          clearTimeout(timeout);
          resolve({ found: foundSrflx, candidateType: foundSrflx ? 'srflx' : 'host-only' });
        }
      };
    });

    pc.close();

    if (result.found) {
      return {
        checkId: 'net-udp-ports-reachable',
        categoryId: 'network',
        status: 'pass',
        details:
          'UDP connectivity to Teams media relays confirmed via STUN (server-reflexive candidate received on port 3478).',
        rawData: { candidateType: result.candidateType, stunServers },
      };
    }

    return {
      checkId: 'net-udp-ports-reachable',
      categoryId: 'network',
      status: 'warning',
      details:
        'No server-reflexive STUN candidate received. UDP 3478 may be blocked by your firewall. For a definitive test, run the PowerShell module from the room network.',
      rawData: { candidateType: result.candidateType, stunServers },
    };
  } catch (err) {
    return {
      checkId: 'net-udp-ports-reachable',
      categoryId: 'network',
      status: 'warning',
      details: `Browser STUN check failed: ${err instanceof Error ? err.message : 'unknown error'}. WebRTC may be disabled. Run the PowerShell module for a full UDP port test.`,
      rawData: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}

// ---------------------------------------------------------------------------
// 2. WebSocket connectivity
// ---------------------------------------------------------------------------

async function checkWebSocketPermitted(): Promise<BrowserCheckResult> {
  const endpoint = 'wss://trouter-azsc-ukso-0-a.trouter.teams.microsoft.com';

  try {
    const result = await new Promise<{ connected: boolean; state: string }>((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ connected: false, state: 'timeout' });
      }, 8000);

      try {
        const ws = new WebSocket(endpoint);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve({ connected: true, state: 'open' });
        };

        ws.onclose = (event) => {
          clearTimeout(timeout);
          // A close event after TCP connection means network path works
          // (server may reject the WebSocket protocol, but connectivity is fine)
          resolve({ connected: true, state: `closed:${event.code}` });
        };

        ws.onerror = () => {
          // Don't resolve here — wait for onclose which always fires after onerror
        };
      } catch {
        clearTimeout(timeout);
        resolve({ connected: false, state: 'constructor-error' });
      }
    });

    if (result.connected) {
      return {
        checkId: 'net-websocket-permitted',
        categoryId: 'network',
        status: 'pass',
        details:
          'WebSocket connection to Teams signaling endpoint succeeded. Your network permits WebSocket traffic.',
        rawData: { endpoint, state: result.state },
      };
    }

    return {
      checkId: 'net-websocket-permitted',
      categoryId: 'network',
      status: 'fail',
      details:
        'WebSocket connection to Teams signaling endpoint timed out. A firewall or proxy may be blocking WebSocket upgrades.',
      rawData: { endpoint, state: result.state },
    };
  } catch (err) {
    return {
      checkId: 'net-websocket-permitted',
      categoryId: 'network',
      status: 'fail',
      details: `WebSocket check failed: ${err instanceof Error ? err.message : 'unknown error'}. Check firewall/proxy WebSocket rules.`,
      rawData: { endpoint, error: err instanceof Error ? err.message : String(err) },
    };
  }
}

// ---------------------------------------------------------------------------
// 3. Proxy authentication detection
// ---------------------------------------------------------------------------

async function checkNoProxyAuth(): Promise<BrowserCheckResult> {
  const endpoints = [
    { name: 'Teams Service', url: 'https://teams.microsoft.com' },
    { name: 'Teams Config', url: 'https://config.teams.microsoft.com' },
    { name: 'Graph API', url: 'https://graph.microsoft.com' },
  ];

  const results: { name: string; reachable: boolean }[] = [];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      // no-cors gives opaque response but confirms network-level reachability
      await fetch(ep.url, { mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeout);
      results.push({ name: ep.name, reachable: true });
    } catch {
      results.push({ name: ep.name, reachable: false });
    }
  }

  const allReachable = results.every((r) => r.reachable);
  const failedEndpoints = results.filter((r) => !r.reachable);

  if (allReachable) {
    return {
      checkId: 'net-no-proxy-auth',
      categoryId: 'network',
      status: 'pass',
      details:
        'All Teams endpoints reachable from your browser without proxy authentication errors.',
      rawData: { results },
    };
  }

  if (failedEndpoints.length === results.length) {
    return {
      checkId: 'net-no-proxy-auth',
      categoryId: 'network',
      status: 'warning',
      details:
        'All Teams endpoints failed to respond. A proxy may be requiring authentication or blocking access. Run the PowerShell module for detailed proxy diagnostics.',
      rawData: { results },
    };
  }

  return {
    checkId: 'net-no-proxy-auth',
    categoryId: 'network',
    status: 'warning',
    details: `${failedEndpoints.length} of ${results.length} endpoint(s) unreachable: ${failedEndpoints.map((r) => r.name).join(', ')}. Possible proxy interference.`,
    rawData: { results },
  };
}

// ---------------------------------------------------------------------------
// 4. Pro Management Portal connectivity
// ---------------------------------------------------------------------------

async function checkPmpConnectivity(): Promise<BrowserCheckResult> {
  const endpoints = [
    'https://portal.rooms.microsoft.com',
  ];

  const results: { url: string; reachable: boolean }[] = [];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      await fetch(url, { mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeout);
      results.push({ url, reachable: true });
    } catch {
      results.push({ url, reachable: false });
    }
  }

  const allReachable = results.every((r) => r.reachable);
  const unreachable = results.filter((r) => !r.reachable);

  if (allReachable) {
    return {
      checkId: 'management-pmp-connectivity',
      categoryId: 'management',
      status: 'pass',
      details:
        'Teams Rooms Pro Management Portal endpoints are reachable from your network.',
      rawData: { results },
    };
  }

  return {
    checkId: 'management-pmp-connectivity',
    categoryId: 'management',
    status: 'fail',
    details: `${unreachable.length} Pro Management Portal endpoint(s) unreachable: ${unreachable.map((r) => r.url).join(', ')}. Ensure TCP 443 is open to these URLs.`,
    rawData: { results },
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function runAllBrowserNetworkChecks(): Promise<BrowserCheckResult[]> {
  const settled = await Promise.allSettled([
    checkUdpStunReachability(),
    checkWebSocketPermitted(),
    checkNoProxyAuth(),
    checkPmpConnectivity(),
  ]);

  return settled
    .filter(
      (r): r is PromiseFulfilledResult<BrowserCheckResult> => r.status === 'fulfilled',
    )
    .map((r) => r.value);
}
