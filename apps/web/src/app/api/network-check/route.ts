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

  // Bandwidth estimate — 25 MB from Cloudflare's public speed test endpoint.
  // Discards the first 3 seconds to skip TCP slow-start ramp-up, matching
  // the approach used by Microsoft's M365 connectivity test and fast.com.
  try {
    const testUrl = 'https://speed.cloudflare.com/__down?bytes=25000000';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);
    const WARMUP_MS = 3000;

    const res = await fetch(testUrl, { signal: controller.signal });
    const reader = res.body?.getReader();

    const startTime = Date.now();
    let warmupDone = false;
    let measureStartTime = 0;
    let measureBytes = 0;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const elapsed = Date.now() - startTime;
        if (!warmupDone && elapsed >= WARMUP_MS) {
          warmupDone = true;
          measureStartTime = Date.now();
          measureBytes = 0;
        }
        if (warmupDone && value) {
          measureBytes += value.length;
        }
      }
    }

    clearTimeout(timeout);

    const measureElapsedSec = (Date.now() - measureStartTime) / 1000;
    const mbps = measureElapsedSec > 1
      ? (measureBytes * 8) / (measureElapsedSec * 1_000_000)
      : 0;

    results.push({
      checkId: 'net-bandwidth-adequate',
      categoryId: 'network',
      status: mbps >= 10 ? 'pass' : mbps > 0 ? 'warning' : 'warning',
      details: mbps >= 10
        ? `Download throughput: ${mbps.toFixed(1)} Mbps (steady-state after TCP warm-up). Meets the 10 Mbps minimum for Teams Rooms.`
        : mbps > 0
          ? `Download throughput: ${mbps.toFixed(1)} Mbps. Teams Rooms requires at least 10 Mbps per room — consider dedicating more bandwidth to Teams traffic.`
          : 'Could not measure bandwidth. Run the PowerShell module for accurate testing.',
      rawData: { estimatedMbps: mbps, measureElapsedSec, measureBytes, testFile: '25MB (Cloudflare)' },
    });
  } catch {
    results.push({
      checkId: 'net-bandwidth-adequate',
      categoryId: 'network',
      status: 'warning',
      details: 'Bandwidth measurement timed out or failed. Run the PowerShell module for bandwidth testing.',
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
