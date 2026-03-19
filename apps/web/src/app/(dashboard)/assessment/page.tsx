'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  CardHeader,
  Checkbox,
  Title1,
  Title2,
  Title3,
  Text,
  ProgressBar,
  Divider,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
} from '@fluentui/react-components';
import {
  ClipboardTask24Regular,
  Play24Filled,
  Checkmark24Regular,
  ArrowRight24Filled,
  DocumentPdf24Regular,
  Table24Regular,
  ArrowUpload24Regular,
  CheckmarkCircle24Filled,
  DismissCircle24Filled,
  Warning24Filled,
  Desktop24Regular,
  Phone24Regular,
  Tablet24Regular,
  Board24Regular,
  Speaker224Regular,
  Copy24Regular,
  ChevronDown24Regular,
  ChevronRight24Regular,
} from '@fluentui/react-icons';
import { StatusBadge } from '@/components/assessment/StatusBadge';
import { runAllBrowserNetworkChecks, type BrowserCheckResult } from '@/lib/browser-network-checks';
import type { Assessment, DeviceType } from '@/checks/types';

// ---------------------------------------------------------------------------
// Device type definitions
// ---------------------------------------------------------------------------

interface DeviceOption {
  id: DeviceType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const DEVICE_OPTIONS: DeviceOption[] = [
  {
    id: 'teams-rooms-windows',
    label: 'Teams Rooms on Windows',
    description: 'Certified room systems running Windows',
    icon: Desktop24Regular,
  },
  {
    id: 'teams-rooms-android',
    label: 'Teams Rooms on Android',
    description: 'Android-based room systems and collaboration bars',
    icon: Board24Regular,
  },
  {
    id: 'teams-panels',
    label: 'Teams Panels',
    description: 'Room scheduling touch displays mounted outside meeting rooms',
    icon: Tablet24Regular,
  },
  {
    id: 'teams-phones',
    label: 'Teams Phones',
    description: 'Desk phones and common area phones with Teams',
    icon: Phone24Regular,
  },
  {
    id: 'surface-hub',
    label: 'Surface Hub',
    description: 'Microsoft Surface Hub and Surface Hub 2S/3',
    icon: Board24Regular,
  },
  {
    id: 'byod',
    label: 'BYOD',
    description: 'Bring Your Own Device rooms with personal laptops and peripherals',
    icon: Speaker224Regular,
  },
];

// ---------------------------------------------------------------------------
// Network check display definitions
// ---------------------------------------------------------------------------

interface NetworkCheckDisplay {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'pass' | 'fail' | 'warning' | 'info';
  details: string;
}

const NETWORK_CHECK_DISPLAY: Omit<NetworkCheckDisplay, 'status' | 'details'>[] = [
  { id: 'net-udp-ports-reachable', label: 'UDP 3478 reachability (STUN/WebRTC)' },
  { id: 'net-websocket-permitted', label: 'WebSocket (wss://) connectivity' },
  { id: 'net-no-proxy-auth', label: 'Proxy authentication detection' },
  { id: 'management-pmp-connectivity', label: 'Pro Management Portal reachability' },
  { id: 'net-tcp-443-reachable', label: 'TCP 443 to Teams endpoints' },
  { id: 'net-tls-inspection-bypass', label: 'TLS inspection bypass' },
  { id: 'net-bandwidth-adequate', label: 'Bandwidth estimate' },
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles({
  container: {
    maxWidth: '800px',
  },
  subtitle: {
    display: 'block',
    marginTop: '8px',
    color: tokens.colorNeutralForeground3,
  },
  card: {
    marginTop: '24px',
    padding: '32px',
  },
  deviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '12px',
    marginTop: '16px',
  },
  deviceCard: {
    padding: '16px',
    cursor: 'pointer',
  },
  deviceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  progressSection: {
    marginTop: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '24px',
  },
  error: {
    marginTop: '16px',
  },
  stepIndicator: {
    display: 'flex',
    gap: '24px',
    marginTop: '24px',
    marginBottom: '8px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stepNum: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    flexShrink: 0,
  },
  stepActive: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  stepDone: {
    backgroundColor: tokens.colorStatusSuccessBackground1,
    color: tokens.colorStatusSuccessForeground1,
  },
  stepPending: {
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground3,
  },
  resultsSummary: {
    marginTop: '24px',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginTop: '16px',
  },
  scoreBig: {
    fontSize: '48px',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  countsRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  countItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px',
    marginTop: '16px',
  },
  categoryCard: {
    padding: '12px 16px',
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    flexWrap: 'wrap',
  },
  // Step 2 - prominent card
  step2Card: {
    marginTop: '24px',
    padding: '0',
    overflow: 'hidden',
  },
  step2Header: {
    padding: '20px 28px',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  step2Body: {
    padding: '24px 28px',
  },
  step2Steps: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  step2Step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  stepNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    flexShrink: 0,
  },
  codeBlock: {
    marginTop: '6px',
    padding: '10px 14px',
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    overflowX: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

function scoreColor(score: number): string {
  if (score >= 80) return tokens.colorStatusSuccessForeground1;
  if (score >= 60) return tokens.colorStatusWarningForeground1;
  return tokens.colorStatusDangerForeground1;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RunAssessmentPage() {
  const styles = useStyles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoMode = searchParams.get('demo') === 'true';

  // Step 0: automated network checks
  const [networkChecksState, setNetworkChecksState] = useState<'idle' | 'running' | 'done'>('idle');
  const [networkCheckResults, setNetworkCheckResults] = useState<NetworkCheckDisplay[]>([]);

  const [selectedDevices, setSelectedDevices] = useState<Set<DeviceType>>(
    new Set(['teams-rooms-windows']),
  );
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Assessment | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [psModuleAbsPath, setPsModuleAbsPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedFallback, setCopiedFallback] = useState(false);
  const [waitingForPs, setWaitingForPs] = useState(false);
  const [psReceived, setPsReceived] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pollError, setPollError] = useState<string | null>(null);
  const [lastPolledAt, setLastPolledAt] = useState<number | null>(null);
  const [secondsSinceLastPoll, setSecondsSinceLastPoll] = useState(0);
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialPsMerged = useRef(0);

  async function runNetworkPreChecks() {
    setNetworkChecksState('running');
    setNetworkCheckResults(
      NETWORK_CHECK_DISPLAY.map((item) => ({ ...item, status: 'running' as const, details: '' })),
    );

    const applyResults = (results: BrowserCheckResult[]) => {
      setNetworkCheckResults((prev) =>
        prev.map((item) => {
          const found = results.find((r) => r.checkId === item.id);
          if (!found) return item;
          return { ...item, status: found.status, details: found.details };
        }),
      );
    };

    const browserPromise = runAllBrowserNetworkChecks()
      .then((results) => { applyResults(results); return results; })
      .catch(() => []);

    const serverPromise = fetch('/api/network-check', { method: 'POST' })
      .then((r) => (r.ok ? r.json() : { checks: [] }))
      .then((data) => { applyResults(data.checks ?? []); return data.checks ?? []; })
      .catch(() => []);

    await Promise.allSettled([browserPromise, serverPromise]);

    // Mark any still-running items as warning (check couldn't complete)
    setNetworkCheckResults((prev) =>
      prev.map((item) =>
        item.status === 'running'
          ? { ...item, status: 'warning' as const, details: 'Check could not be completed.' }
          : item,
      ),
    );
    setNetworkChecksState('done');
  }

  function toggleDevice(id: DeviceType) {
    setSelectedDevices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function startAssessment() {
    setRunning(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setStatusText('Initializing assessment...');

    const progressSteps = [
      { pct: 0.1, label: 'Registering checks...' },
      { pct: 0.25, label: 'Querying licensing...' },
      { pct: 0.4, label: 'Checking identity & auth...' },
      { pct: 0.55, label: 'Evaluating calendar config...' },
      { pct: 0.65, label: 'Inspecting Conditional Access...' },
      { pct: 0.75, label: 'Analyzing network readiness...' },
      { pct: 0.85, label: 'Reviewing security posture...' },
      { pct: 0.92, label: 'Checking management config...' },
    ];

    let stepIdx = 0;
    const timer = setInterval(() => {
      if (stepIdx < progressSteps.length) {
        setProgress(progressSteps[stepIdx].pct);
        setStatusText(progressSteps[stepIdx].label);
        stepIdx++;
      }
    }, 600);

    try {
      const queryParam = demoMode ? '?demo=true' : '';
      const res = await fetch(`/api/assessment${queryParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceTypes: Array.from(selectedDevices),
        }),
      });

      clearInterval(timer);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed with status ${res.status}`);
      }

      const assessment: Assessment = await res.json();

      // Auto-run server-side network checks
      setProgress(0.92);
      setStatusText('Running server-side network checks...');
      try {
        const netRes = await fetch('/api/network-check', { method: 'POST' });
        if (netRes.ok) {
          const netData = await netRes.json();
          if (netData.checks?.length > 0) {
            await fetch(`/api/assessment/merge-network?id=${assessment.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(netData.checks),
            });
          }
        }
      } catch {
        // Non-fatal - network checks are optional
      }

      // Browser-based network checks (from user's actual network)
      setProgress(0.96);
      setStatusText('Testing network from your browser...');
      try {
        const browserResults = await runAllBrowserNetworkChecks();
        if (browserResults.length > 0) {
          await fetch(`/api/assessment/merge-network?id=${assessment.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(browserResults),
          });
        }
      } catch {
        // Non-fatal - browser checks are best-effort
      }

      // Re-fetch to get results with all network checks merged
      setProgress(1);
      setStatusText('Cloud checks complete');
      setRunning(false);
      let updatedAssessment = assessment;
      try {
        const updated = await fetch(`/api/assessment?id=${assessment.id}`);
        if (updated.ok) {
          updatedAssessment = await updated.json();
        }
      } catch {
        // Use the original if re-fetch fails
      }
      setResult(updatedAssessment);
    } catch (err) {
      clearInterval(timer);
      setRunning(false);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  }

  // Compute summary counts from the result
  const categories = result?.categories ?? [];
  const allChecks = categories.flatMap((c) => c.checks);
  const pendingCount = allChecks.filter((c) => c.status === 'pending').length;

  // Graph-only checks — used for the inline Step 1 summary (excludes powershell/manual pending checks)
  const graphChecks = allChecks.filter((c) => c.source === 'graph');
  const passCount = graphChecks.filter((c) => c.status === 'pass').length;
  const failCount = graphChecks.filter((c) => c.status === 'fail').length;
  const warnCount = graphChecks.filter((c) => c.status === 'warning').length;

  const step1Done = result !== null;

  // Extract discovered room mailbox emails from the identity check rawData
  const discoveredRooms: string[] = (() => {
    if (!result) return [];
    const identityCat = categories.find((c) => c.categoryId === 'identity');
    if (!identityCat) return [];
    const resourceCheck = identityCat.checks.find(
      (c) => c.checkId === 'identity-resource-account-exists',
    );
    if (!resourceCheck?.rawData?.rooms) return [];
    const rooms = resourceCheck.rawData.rooms as { displayName: string; emailAddress: string }[];
    return rooms.map((r) => r.emailAddress).filter(Boolean);
  })();

  const roomMailboxParam =
    discoveredRooms.length > 0
      ? discoveredRooms.map((e) => `'${e}'`).join(',')
      : "'mtr-room@contoso.com'";

  // Generate upload token and start polling when Step 1 completes with pending checks
  useEffect(() => {
    if (!result || pendingCount === 0) return;

    // Generate upload token
    const demoParam = demoMode ? '&demo=true' : '';
    fetch(`/api/upload-token?assessmentId=${result.id}${demoParam}`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.uploadUrl) {
          setUploadUrl(data.uploadUrl);
          if (data.psModulePath) setPsModuleAbsPath(data.psModulePath);
          setWaitingForPs(true);
          initialPsMerged.current = result.metadata?.powershellChecksMerged ?? 0;
        }
      })
      .catch(() => {
        // Token generation failed - fall back to manual upload
      });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [result, pendingCount, demoMode]);

  // Poll for PS upload completion
  useEffect(() => {
    if (!waitingForPs || !result || psReceived) return;

    pollRef.current = setInterval(async () => {
      setPollCount((c) => c + 1);
      try {
        const res = await fetch(`/api/assessment?id=${result.id}`);
        if (!res.ok) {
          setPollError(`Server returned ${res.status} — retrying…`);
          return;
        }
        const updated: Assessment = await res.json();
        setPollError(null);
        setLastPolledAt(Date.now());
        const newMerged = updated.metadata?.powershellChecksMerged ?? 0;
        if (newMerged > initialPsMerged.current) {
          setPsReceived(true);
          setWaitingForPs(false);
          setResult(updated);
          if (pollRef.current) clearInterval(pollRef.current);
          // Auto-navigate to the full results page
          router.push(`/assessment/${updated.id}`);
        }
      } catch {
        setPollError('Connection error — retrying in 5 seconds…');
      }
    }, 5000);

    // Stop polling after 10 minutes
    const maxPoll = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      setWaitingForPs(false);
    }, 10 * 60 * 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearTimeout(maxPoll);
    };
  }, [waitingForPs, result, psReceived]);

  // Elapsed timer while waiting for PS results
  useEffect(() => {
    if (!waitingForPs) {
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [waitingForPs]);

  // Live "X seconds ago" counter for last poll
  useEffect(() => {
    if (!lastPolledAt) return;
    setSecondsSinceLastPoll(0);
    const id = setInterval(() => {
      setSecondsSinceLastPoll(Math.floor((Date.now() - lastPolledAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastPolledAt]);

  function formatElapsed(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  const psModuleLine = psModuleAbsPath
    ? `Import-Module '${psModuleAbsPath}'`
    : (process.env.NEXT_PUBLIC_PS_MODULE_PATH
        ? `Import-Module '${process.env.NEXT_PUBLIC_PS_MODULE_PATH}'`
        : `Import-Module '.\\packages\\powershell\\MTRReadiness\\MTRReadiness.psd1'`);
  const psPrereqLine = `Install-Module ExchangeOnlineManagement -Scope CurrentUser # skip if already installed`;

  const copyCommand = useCallback(() => {
    if (!uploadUrl) return;
    const cmd = `${psPrereqLine}\n${psModuleLine}\nConnect-ExchangeOnline\nInvoke-MTRReadinessCheck -RoomMailboxes ${roomMailboxParam} -AutoUpload '${uploadUrl}'`;
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [uploadUrl, roomMailboxParam, psModuleLine, psPrereqLine]);

  const copyFallbackCommand = useCallback(() => {
    const cmd = `${psPrereqLine}\n${psModuleLine}\nConnect-ExchangeOnline\nInvoke-MTRReadinessCheck -RoomMailboxes ${roomMailboxParam}`;
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedFallback(true);
      setTimeout(() => setCopiedFallback(false), 2000);
    });
  }, [roomMailboxParam]);

  return (
    <div className={styles.container}>
      <Title1 as="h1">Run Assessment</Title1>
      <Text size={300} className={styles.subtitle}>
        Evaluate your Microsoft 365 tenant configuration for Teams Rooms readiness.
      </Text>

      {/* Step indicator */}
      <div className={styles.stepIndicator}>
        <div className={styles.step}>
          <span
            className={`${styles.stepNum} ${networkChecksState === 'done' ? styles.stepDone : !step1Done && !running ? styles.stepActive : styles.stepPending}`}
          >
            {networkChecksState === 'done' ? <Checkmark24Regular style={{ fontSize: '14px' }} /> : '0'}
          </span>
          <Text size={200} weight={networkChecksState !== 'idle' || (!step1Done && !running) ? 'semibold' : 'regular'}>
            Network Pre-checks
          </Text>
        </div>
        <div className={styles.step}>
          <span
            className={`${styles.stepNum} ${step1Done ? styles.stepDone : running ? styles.stepActive : styles.stepPending}`}
          >
            {step1Done ? <Checkmark24Regular style={{ fontSize: '14px' }} /> : '1'}
          </span>
          <Text size={200} weight={running || step1Done ? 'semibold' : 'regular'}>
            Licensing, Identity & Management
          </Text>
        </div>
        <div className={styles.step}>
          <span className={`${styles.stepNum} ${styles.stepPending}`}>2</span>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Platform, Security & Voice
          </Text>
        </div>
      </div>

      {/* Step 0: Automated network pre-checks */}
      {!step1Done && !running && (
        <Card className={styles.card}>
          <Title3 as="h2">Network pre-checks</Title3>
          <Text
            size={200}
            style={{ display: 'block', marginTop: '4px', color: tokens.colorNeutralForeground3 }}
          >
            Run automated checks from your browser to verify Teams network connectivity before
            the assessment.
          </Text>

          {networkChecksState === 'idle' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
              <Button appearance="primary" onClick={runNetworkPreChecks}>
                Run network checks
              </Button>
              <Button
                appearance="subtle"
                onClick={() => setNetworkChecksState('done')}
              >
                Skip
              </Button>
            </div>
          )}

          {networkChecksState !== 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              {networkCheckResults.map((check) => (
                <div key={check.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ flexShrink: 0, marginTop: '2px' }}>
                    {check.status === 'running' && <Spinner size="tiny" />}
                    {check.status === 'pass' && (
                      <CheckmarkCircle24Filled
                        style={{ fontSize: '16px', color: tokens.colorStatusSuccessForeground1 }}
                      />
                    )}
                    {check.status === 'fail' && (
                      <DismissCircle24Filled
                        style={{ fontSize: '16px', color: tokens.colorStatusDangerForeground1 }}
                      />
                    )}
                    {(check.status === 'warning' || check.status === 'info') && (
                      <Warning24Filled
                        style={{ fontSize: '16px', color: tokens.colorStatusWarningForeground1 }}
                      />
                    )}
                  </span>
                  <div>
                    <Text size={200} weight="semibold">
                      {check.label}
                    </Text>
                    {check.details && (
                      <Text
                        size={100}
                        style={{ display: 'block', color: tokens.colorNeutralForeground3, marginTop: '2px' }}
                      >
                        {check.details}
                      </Text>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {networkChecksState === 'done' && networkCheckResults.length > 0 && (() => {
            const hasFailures = networkCheckResults.some((r) => r.status === 'fail' || r.status === 'warning');
            return hasFailures ? (
              <MessageBar intent="warning" style={{ marginTop: '16px' }}>
                <MessageBarBody>
                  Some checks flagged issues. Review the results above before proceeding, or
                  continue and address them based on the assessment report.
                </MessageBarBody>
              </MessageBar>
            ) : (
              <MessageBar intent="success" style={{ marginTop: '16px' }}>
                <MessageBarBody>All network checks passed. Your environment looks ready for Teams.</MessageBarBody>
              </MessageBar>
            );
          })()}
        </Card>
      )}

      {/* Device selection — always visible before starting */}
      {!step1Done && !running && (
        <Card className={styles.card}>
          <Title3 as="h2">What are you deploying?</Title3>
          <Text
            size={200}
            style={{ display: 'block', marginTop: '4px', color: tokens.colorNeutralForeground3 }}
          >
            Select the device types you plan to deploy. This helps us focus the assessment on
            the checks most relevant to your environment.
          </Text>
          <div className={styles.deviceGrid}>
            {DEVICE_OPTIONS.map((device) => {
              const selected = selectedDevices.has(device.id);
              const Icon = device.icon;
              return (
                <div
                  key={device.id}
                  className={styles.deviceCard}
                  style={{
                    border: selected
                      ? `2px solid ${tokens.colorBrandStroke1}`
                      : `1px solid ${tokens.colorNeutralStroke2}`,
                    borderRadius: tokens.borderRadiusMedium,
                    backgroundColor: selected ? tokens.colorBrandBackground2 : undefined,
                  }}
                  onClick={() => toggleDevice(device.id)}
                >
                  <div className={styles.deviceHeader}>
                    <Checkbox checked={selected} onChange={() => {/* handled by parent onClick */}} />
                    <Icon style={{ fontSize: '20px', color: tokens.colorBrandForeground1 }} />
                    <Text size={200} weight="semibold">
                      {device.label}
                    </Text>
                  </div>
                  <Text
                    size={100}
                    style={{
                      display: 'block',
                      marginTop: '6px',
                      paddingLeft: '38px',
                      color: tokens.colorNeutralForeground3,
                    }}
                  >
                    {device.description}
                  </Text>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Step 1 card */}
      <Card className={styles.card}>
        <CardHeader
          image={<ClipboardTask24Regular />}
          header={<Title3>Step 1: Licensing, Identity & Management</Title3>}
          description={
            <Text size={200}>
              Runs automated checks against your tenant: licensing, identity, calendar,
              Conditional Access, network, and management configuration.
            </Text>
          }
        />

        {!step1Done && networkChecksState !== 'idle' && (
          <div className={styles.controls}>
            <Button
              appearance="primary"
              icon={running ? undefined : <Play24Filled />}
              size="large"
              disabled={running || selectedDevices.size === 0}
              onClick={startAssessment}
            >
              {running ? 'Running...' : 'Start Assessment'}
            </Button>
          </div>
        )}

        {selectedDevices.size === 0 && !running && !step1Done && networkChecksState !== 'idle' && (
          <MessageBar intent="warning" style={{ marginTop: '16px' }}>
            <MessageBarBody>
              Select at least one device type above to start the assessment.
            </MessageBarBody>
          </MessageBar>
        )}

        {demoMode && !running && !step1Done && networkChecksState !== 'idle' && selectedDevices.size > 0 && (
          <MessageBar intent="info" style={{ marginTop: '16px' }}>
            <MessageBarBody>
              <MessageBarTitle>Demo Mode</MessageBarTitle>
              Sample results will be generated without connecting to Azure AD. Use the sidebar to
              exit demo mode and run against your real tenant.
            </MessageBarBody>
          </MessageBar>
        )}

        {running && (
          <div className={styles.progressSection}>
            <div className={styles.progressLabel}>
              <Text size={200}>{statusText}</Text>
              <Text size={200} weight="semibold">
                {Math.round(progress * 100)}%
              </Text>
            </div>
            <ProgressBar value={progress} />
          </div>
        )}

        {error && (
          <MessageBar intent="error" className={styles.error}>
            <MessageBarBody>
              <MessageBarTitle>Error</MessageBarTitle>
              {error}
            </MessageBarBody>
          </MessageBar>
        )}

        {/* Inline results summary */}
        {result && (
          <div className={styles.resultsSummary}>
            <Divider />

            {/* Compact summary row — always visible, clickable to expand */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', cursor: 'pointer' }}
              onClick={() => setShowDetails((v) => !v)}
            >
              <Text
                style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: 1, color: scoreColor(result.overallScore) }}
              >
                {result.overallScore}
              </Text>
              <div style={{ flex: 1 }}>
                <Text size={200} style={{ display: 'block', color: tokens.colorNeutralForeground3 }}>
                  / 100 readiness score
                </Text>
                <div className={styles.countsRow} style={{ marginTop: '4px' }}>
                  <div className={styles.countItem}>
                    <CheckmarkCircle24Filled
                      style={{ color: tokens.colorStatusSuccessForeground1, fontSize: '16px' }}
                    />
                    <Text size={200}>{passCount} passed</Text>
                  </div>
                  <div className={styles.countItem}>
                    <DismissCircle24Filled
                      style={{ color: tokens.colorStatusDangerForeground1, fontSize: '16px' }}
                    />
                    <Text size={200}>{failCount} failed</Text>
                  </div>
                  <div className={styles.countItem}>
                    <Warning24Filled
                      style={{ color: tokens.colorStatusWarningForeground1, fontSize: '16px' }}
                    />
                    <Text size={200}>{warnCount} warnings</Text>
                  </div>
                </div>
              </div>
              {showDetails ? (
                <ChevronDown24Regular style={{ color: tokens.colorNeutralForeground3 }} />
              ) : (
                <ChevronRight24Regular style={{ color: tokens.colorNeutralForeground3 }} />
              )}
            </div>

            {/* Expandable details — category breakdown + actions */}
            {showDetails && (
              <>
                <div className={styles.categoryGrid}>
                  {categories
                    .filter((cat) => cat.checks.some((c) => c.source === 'graph'))
                    .map((cat) => {
                    const catGraphChecks = cat.checks.filter((c) => c.source === 'graph');
                    const catPassed = catGraphChecks.filter((c) => c.status === 'pass').length;
                    const catTotal = catGraphChecks.filter(
                      (c) => c.status !== 'not-applicable',
                    ).length;
                    return (
                      <Card key={cat.categoryId} className={styles.categoryCard}>
                        <div className={styles.categoryHeader}>
                          <Text size={200} weight="semibold">
                            {cat.name}
                          </Text>
                          <StatusBadge status={cat.status} />
                        </div>
                        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                          {catPassed}/{catTotal} passed &middot; Score: {cat.score}
                        </Text>
                      </Card>
                    );
                  })}
                </div>

                {psReceived ? (
                  <div className={styles.completionActions}>
                    <Button
                      appearance="primary"
                      icon={<ArrowRight24Filled />}
                      size="large"
                      onClick={() => router.push(`/assessment/${result.id}`)}
                    >
                      View Full Results
                    </Button>
                    <Button
                      appearance="secondary"
                      icon={<DocumentPdf24Regular />}
                      onClick={() => window.open(`/api/export/pdf?id=${result.id}`, '_blank')}
                    >
                      Export PDF
                    </Button>
                    <Button
                      appearance="secondary"
                      icon={<Table24Regular />}
                      onClick={() => window.open(`/api/export/excel?id=${result.id}`, '_blank')}
                    >
                      Export Excel
                    </Button>
                  </div>
                ) : (
                  <Text
                    size={200}
                    style={{ display: 'block', marginTop: '20px', color: tokens.colorNeutralForeground3 }}
                  >
                    Complete Step 2 to view and export the full report.
                  </Text>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {/* Step 2 - prominent card with branded header */}
      {result && pendingCount > 0 && !psReceived && (
        <Card className={styles.step2Card}>
          <div className={styles.step2Header}>
            <ArrowRight24Filled style={{ fontSize: '24px' }} />
            <div>
              <Title3 as="h2" style={{ color: 'inherit', margin: 0 }}>
                Step 2: Platform, Security & Voice
              </Title3>
              <Text size={200} style={{ color: 'rgba(255,255,255,0.85)', display: 'block' }}>
                {pendingCount} check{pendingCount !== 1 ? 's' : ''} need on-premises data from
                PowerShell
              </Text>
            </div>
          </div>
          <div className={styles.step2Body}>
            <Text size={200} style={{ display: 'block', color: tokens.colorNeutralForeground2 }}>
              Open a PowerShell terminal <strong>in the repo root directory</strong>, copy the
              command below, and run it. Results will be uploaded automatically.
            </Text>

            {uploadUrl ? (
              <>
                <div className={styles.codeBlock} style={{ marginTop: '16px', position: 'relative', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  <Button
                    appearance="subtle"
                    icon={copied ? <Checkmark24Regular /> : <Copy24Regular />}
                    size="small"
                    style={{ position: 'absolute', top: '4px', right: '4px' }}
                    onClick={copyCommand}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  {psPrereqLine}<br />
                  {psModuleLine}<br />
                  Connect-ExchangeOnline<br />
                  Invoke-MTRReadinessCheck -RoomMailboxes {roomMailboxParam} `<br />
                  &nbsp;&nbsp;-AutoUpload &apos;{uploadUrl}&apos;
                  {discoveredRooms.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                      {discoveredRooms.length} room{discoveredRooms.length !== 1 ? 's' : ''} auto-discovered from your tenant
                    </div>
                  )}
                </div>

                {waitingForPs && (
                  <div style={{ marginTop: '20px' }}>
                    {/* Status: spinner + elapsed */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Spinner size="tiny" />
                        <Text size={200} weight="semibold">Waiting for PowerShell results…</Text>
                      </div>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontVariantNumeric: 'tabular-nums' }}>
                        {formatElapsed(elapsedSeconds)}
                      </Text>
                    </div>

                    {/* Clear instruction */}
                    <MessageBar intent="info">
                      <MessageBarBody>
                        Run the PowerShell command above, then come back — this page will update automatically when results are received.
                      </MessageBarBody>
                    </MessageBar>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.step2Steps}>
                <div className={styles.step2Step}>
                  <span className={styles.stepNumber}>1</span>
                  <div>
                    <Text size={300} weight="semibold">Import the module and run checks</Text>
                    <div className={styles.codeBlock} style={{ position: 'relative', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      <Button
                        appearance="subtle"
                        icon={copiedFallback ? <Checkmark24Regular /> : <Copy24Regular />}
                        size="small"
                        style={{ position: 'absolute', top: '4px', right: '4px' }}
                        onClick={copyFallbackCommand}
                      >
                        {copiedFallback ? 'Copied!' : 'Copy'}
                      </Button>
                      {psPrereqLine}<br />
                      {psModuleLine}<br />
                      Connect-ExchangeOnline<br />
                      Invoke-MTRReadinessCheck -RoomMailboxes {roomMailboxParam}
                    </div>
                  </div>
                </div>
                <div className={styles.step2Step}>
                  <span className={styles.stepNumber}>2</span>
                  <div>
                    <Text size={300} weight="semibold">Upload the results</Text>
                    <Button
                      appearance="primary"
                      size="medium"
                      icon={<ArrowUpload24Regular />}
                      style={{ marginTop: '8px' }}
                      onClick={() => router.push('/upload')}
                    >
                      Upload PowerShell Results
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* PS results received */}
      {psReceived && (
        <Card className={styles.step2Card}>
          <div className={styles.step2Header} style={{ backgroundColor: tokens.colorStatusSuccessBackground1 }}>
            <CheckmarkCircle24Filled style={{ fontSize: '24px', color: tokens.colorStatusSuccessForeground1 }} />
            <div>
              <Title3 as="h2" style={{ color: tokens.colorStatusSuccessForeground1, margin: 0 }}>
                Assessment complete
              </Title3>
              <Text size={200} style={{ display: 'block', color: tokens.colorNeutralForeground2 }}>
                PowerShell results merged successfully. All checks have been evaluated.
              </Text>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
