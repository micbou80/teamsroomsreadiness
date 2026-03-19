import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * POST /api/network-check
 *
 * Runs browser-feasible network checks from the server side.
 * These test connectivity from the server's network to Teams endpoints.
 * For checks that must run from the user's actual room network,
 * the PowerShell module is still needed.
 */
export async function POST(request: NextRequest) {
  const results: BrowserNetworkResult[] = [];

  // TCP 443 - Test HTTPS reachability to key Teams endpoints
  const teamsEndpoints = [
    { name: 'Teams Service', url: 'https://teams.microsoft.com' },
    { name: 'Teams Auth', url: 'https://login.microsoftonline.com' },
    { name: 'Teams Media', url: 'https://teams.events.data.microsoft.com' },
    { name: 'Teams Config', url: 'https://config.teams.microsoft.com' },
  ];

  const tcpResults: { endpoint: string; reachable: boolean; latencyMs: number }[] = [];
  for (const ep of teamsEndpoints) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      await fetch(ep.url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);
      tcpResults.push({ endpoint: ep.name, reachable: true, latencyMs: Date.now() - start });
    } catch {
      tcpResults.push({ endpoint: ep.name, reachable: false, latencyMs: Date.now() - start });
    }
  }

  const allReachable = tcpResults.every((r) => r.reachable);
  const unreachable = tcpResults.filter((r) => !r.reachable);
  results.push({
    checkId: 'net-tcp-443-reachable',
    categoryId: 'network',
    status: allReachable ? 'pass' : 'fail',
    details: allReachable
      ? `All ${tcpResults.length} Teams endpoints are reachable via HTTPS. Average latency: ${Math.round(tcpResults.reduce((s, r) => s + r.latencyMs, 0) / tcpResults.length)}ms.`
      : `${unreachable.length} endpoint(s) unreachable: ${unreachable.map((r) => r.endpoint).join(', ')}. Check firewall rules for TCP 443.`,
    rawData: tcpResults,
  });

  // TLS inspection - Check if certificates are issued by expected CAs
  // (If a proxy does TLS inspection, the issuer will be a corporate CA, not Microsoft/DigiCert)
  try {
    // We can't inspect certs from Node fetch, but we can check if the connection succeeds
    // without cert errors. A proper TLS inspection check requires the PS module.
    results.push({
      checkId: 'net-tls-inspection-bypass',
      categoryId: 'network',
      status: allReachable ? 'pass' : 'warning',
      details: allReachable
        ? 'HTTPS connections to Teams endpoints succeeded without TLS errors. Note: full TLS inspection detection requires the PowerShell module.'
        : 'Could not verify TLS inspection status - some endpoints were unreachable.',
      rawData: {},
    });
  } catch {
    results.push({
      checkId: 'net-tls-inspection-bypass',
      categoryId: 'network',
      status: 'warning',
      details: 'Unable to verify TLS inspection status from the server. Run the PowerShell module for a complete check.',
      rawData: {},
    });
  }

  // Bandwidth estimate - Download a small resource and estimate speed
  try {
    const testUrl = 'https://teams.microsoft.com/favicon.ico';
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(testUrl, { signal: controller.signal });
    const data = await res.arrayBuffer();
    clearTimeout(timeout);
    const elapsed = (Date.now() - start) / 1000;
    const bytes = data.byteLength;
    const mbps = (bytes * 8) / (elapsed * 1000000);

    results.push({
      checkId: 'net-bandwidth-adequate',
      categoryId: 'network',
      status: 'info',
      details: `Rough estimate: ${mbps.toFixed(1)} Mbps (based on small file download). For accurate bandwidth testing, use the PowerShell module or a dedicated tool. Teams Rooms requires minimum 10 Mbps per room.`,
      rawData: { bytes, elapsedSec: elapsed, estimatedMbps: mbps },
    });
  } catch {
    results.push({
      checkId: 'net-bandwidth-adequate',
      categoryId: 'network',
      status: 'warning',
      details: 'Unable to estimate bandwidth. Run the PowerShell module for bandwidth testing.',
      rawData: {},
    });
  }

  return NextResponse.json({
    checks: results,
    timestamp: new Date().toISOString(),
    note: 'UDP port checks (3478-3481), proxy auth detection, and WebSocket checks require the PowerShell module running from the actual room network.',
  });
}

interface BrowserNetworkResult {
  checkId: string;
  categoryId: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  details: string;
  rawData: any;
}
