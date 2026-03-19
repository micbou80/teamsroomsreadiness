'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Spinner,
  Tooltip,
} from '@fluentui/react-components';
import {
  Play24Filled,
  ArrowRight16Regular,
  CheckmarkCircle24Filled,
  DismissCircle24Filled,
  Warning24Filled,
  Shield24Regular,
  ClipboardTask24Regular,
  Clock24Regular,
  ChevronDown16Regular,
  ChevronRight16Regular,
  ArrowSortDown16Regular,
  ArrowSortUp16Regular,
  ArrowSort16Regular,
  CheckmarkCircle16Filled,
  DismissCircle16Filled,
  Warning16Filled,
  Info16Regular,
} from '@fluentui/react-icons';
import { StatusBadge } from '@/components/assessment/StatusBadge';
import type { CheckStatus } from '@/checks/types';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles({
  container: {
    maxWidth: '1100px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  greeting: {
    fontSize: '26px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    lineHeight: 1.3,
  },
  subtitle: {
    display: 'block',
    marginTop: '2px',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },

  // Recommendation banner
  recommendation: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 18px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: tokens.fontSizeBase300,
    fontWeight: '500',
  },
  recommendationLabel: {
    fontWeight: '700',
    marginRight: '4px',
  },

  // Stats row
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '28px',
  },
  statCard: {
    padding: '20px 22px',
    borderRadius: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '24px',
  },
  statLabel: {
    display: 'block',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginBottom: '3px',
    fontWeight: '500',
    letterSpacing: '0.01em',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: 1,
    color: tokens.colorNeutralForeground1,
  },
  statSuffix: {
    fontSize: '14px',
    fontWeight: '400',
    color: tokens.colorNeutralForeground3,
    marginLeft: '2px',
  },

  // Check status table
  tableCard: {
    borderRadius: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
  },
  tableTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '11px 24px',
    fontSize: '11px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    backgroundColor: '#f9fafb',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  thSortable: {
    cursor: 'pointer',
    userSelect: 'none' as const,
    '&:hover': {
      backgroundColor: '#f0f1f5',
      color: tokens.colorNeutralForeground2,
    },
  },
  thActive: {
    color: tokens.colorBrandForeground1,
  },
  thInner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  td: {
    padding: '13px 24px',
    fontSize: tokens.fontSizeBase300,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground1,
    verticalAlign: 'middle',
  },
  row: {
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: '100ms',
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
  },
  rowExpanded: {
    backgroundColor: '#f9fafb',
  },
  expandedRow: {
    backgroundColor: '#f9fafb',
  },
  expandedCell: {
    padding: '0 24px 16px 56px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  expandedContent: {
    padding: '14px 16px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  expandedLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    marginBottom: '3px',
    display: 'block',
  },
  expandedText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5',
    display: 'block',
  },
  checkNameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  chevron: {
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },

  // Bottom grid
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  smallCard: {
    padding: '20px 24px',
    borderRadius: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  smallCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  smallCardTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  historyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '11px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },

  // Empty state
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 24px',
  },
  emptyIcon: {
    fontSize: '48px',
    color: tokens.colorNeutralForeground4,
    marginBottom: '16px',
  },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckSummary {
  checkId: string;
  name: string;
  status: string;
  severity: string;
  details?: string;
  remediation?: string;
  docUrl?: string;
  categoryName: string;
}

interface LatestAssessment {
  id: string;
  overallScore: number;
  overallStatus: CheckStatus;
  categories: {
    categoryId: string;
    name: string;
    score: number;
    status: CheckStatus;
    checks?: { checkId: string; name: string; status: string; severity: string; details?: string; remediation?: string; docUrl?: string }[];
  }[];
  createdAt: string;
}

interface AssessmentSummary {
  id: string;
  score: number;
  status: string;
  createdAt: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return tokens.colorStatusSuccessForeground1;
  if (score >= 60) return tokens.colorStatusWarningForeground1;
  return tokens.colorStatusDangerForeground1;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getRecommendation(score: number, failCount: number, criticalFails: number): {
  label: string;
  detail: string;
  bg: string;
  fg: string;
  icon: React.ReactElement;
} {
  if (criticalFails > 0) {
    return {
      label: 'Not ready to deploy.',
      detail: `${criticalFails} critical issue${criticalFails > 1 ? 's' : ''} must be resolved before deployment.`,
      bg: tokens.colorStatusDangerBackground1,
      fg: tokens.colorStatusDangerForeground1,
      icon: <DismissCircle16Filled />,
    };
  }
  if (score >= 80 && failCount === 0) {
    return {
      label: 'Ready to deploy.',
      detail: 'Your tenant meets all critical requirements for Teams Rooms deployment.',
      bg: tokens.colorStatusSuccessBackground1,
      fg: tokens.colorStatusSuccessForeground1,
      icon: <CheckmarkCircle16Filled />,
    };
  }
  if (score >= 60) {
    return {
      label: 'Deploy with caution.',
      detail: `${failCount} check${failCount !== 1 ? 's' : ''} failed. Review and remediate before going to production.`,
      bg: tokens.colorStatusWarningBackground1,
      fg: tokens.colorStatusWarningForeground1,
      icon: <Warning16Filled />,
    };
  }
  return {
    label: 'Address issues before deploying.',
    detail: `${failCount} check${failCount !== 1 ? 's' : ''} failed. Significant configuration gaps detected.`,
    bg: tokens.colorStatusDangerBackground1,
    fg: tokens.colorStatusDangerForeground1,
    icon: <DismissCircle16Filled />,
  };
}

function severityBadgeColor(severity: string): { bg: string; fg: string } {
  switch (severity) {
    case 'critical':
      return { bg: tokens.colorStatusDangerBackground1, fg: tokens.colorStatusDangerForeground1 };
    case 'high':
      return { bg: tokens.colorPalettePeachBackground2, fg: tokens.colorPalettePeachForeground2 };
    case 'medium':
      return { bg: tokens.colorStatusWarningBackground1, fg: tokens.colorStatusWarningForeground1 };
    case 'low':
      return { bg: tokens.colorBrandBackground2, fg: tokens.colorBrandForeground1 };
    default:
      return { bg: tokens.colorNeutralBackground4, fg: tokens.colorNeutralForeground3 };
  }
}

const statusTooltip: Record<string, string> = {
  pass: 'This check passed — your configuration meets the requirement.',
  fail: 'This check failed — action is required to meet the requirement.',
  warning: 'This check raised a warning — review recommended but not blocking.',
  info: 'Informational — no action required, but worth noting.',
  pending: 'Awaiting data from PowerShell upload to complete this check.',
  'not-applicable': 'Not applicable for your selected device types.',
};

const STATUS_ORDER: Record<string, number> = { fail: 0, warning: 1, info: 2, pass: 3 };
const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function SortIcon({ col, sortCol, sortDir }: {
  col: 'status' | 'severity' | 'category';
  sortCol: 'status' | 'severity' | 'category' | null;
  sortDir: 'asc' | 'desc';
}) {
  if (sortCol !== col) return <ArrowSort16Regular style={{ opacity: 0.4 }} />;
  return sortDir === 'asc' ? <ArrowSortUp16Regular /> : <ArrowSortDown16Regular />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardHome() {
  const styles = useStyles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';

  const [userName, setUserName] = useState<string | null>(null);
  const [latest, setLatest] = useState<LatestAssessment | null>(null);
  const [history, setHistory] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<'status' | 'severity' | 'category' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const demoParam = isDemo ? 'demo=true&' : '';

    if (isDemo) {
      setUserName('Demo User');
    } else {
      fetch('/api/auth/session')
        .then((r) => r.json())
        .then((s) => {
          if (s?.user?.name) setUserName(s.user.name);
        })
        .catch(() => {});
    }

    Promise.all([
      fetch(`/api/assessment?${demoParam}latest=true`).then((r) => r.json()).catch(() => null),
      fetch(`/api/assessment?${demoParam}`).then((r) => r.json()).catch(() => []),
    ]).then(([latestData, historyData]) => {
      if (latestData?.id) setLatest(latestData);
      if (Array.isArray(historyData)) setHistory(historyData.slice(0, 5));
      setLoading(false);
    });
  }, [isDemo]);

  const demoQ = isDemo ? '?demo=true' : '';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner size="large" />
      </div>
    );
  }

  // Flatten all checks from latest assessment
  const allChecks: CheckSummary[] = latest?.categories?.flatMap((c) =>
    (c.checks ?? []).map((ch) => ({ ...ch, categoryName: c.name }))
  ) ?? [];
  const { passCount, failCount, warnCount, pendingCount, criticalFails } = allChecks.reduce(
    (acc, c) => {
      if (c.status === 'pass') acc.passCount++;
      else if (c.status === 'fail') { acc.failCount++; if (c.severity === 'critical') acc.criticalFails++; }
      else if (c.status === 'warning') acc.warnCount++;
      else if (c.status === 'pending') acc.pendingCount++;
      return acc;
    },
    { passCount: 0, failCount: 0, warnCount: 0, pendingCount: 0, criticalFails: 0 },
  );

  function handleSort(col: 'status' | 'severity' | 'category') {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setExpandedCheckId(null);
  }

  const visibleChecks = allChecks
    .filter((c) => c.status !== 'pending' && c.status !== 'not-applicable')
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'status') {
        return ((STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4)) * dir;
      }
      if (sortCol === 'severity') {
        return ((SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4)) * dir;
      }
      if (sortCol === 'category') {
        return a.categoryName.localeCompare(b.categoryName) * dir;
      }
      // default: fail first
      return (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4);
    })
    .slice(0, 12);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <Text className={styles.greeting}>
            {getGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}
          </Text>
          <Text className={styles.subtitle}>
            {latest
              ? 'Overview of your latest tenant readiness assessment.'
              : 'Run your first assessment to evaluate your Teams Rooms readiness.'}
          </Text>
        </div>
        <Button
          appearance="primary"
          icon={<Play24Filled />}
          size="large"
          onClick={() => router.push(`/assessment${demoQ}`)}
        >
          New Assessment
        </Button>
      </div>

      {/* Recommendation banner */}
      {latest && (() => {
        const rec = getRecommendation(latest.overallScore, failCount, criticalFails);
        return (
          <div className={styles.recommendation} style={{ backgroundColor: rec.bg, color: rec.fg }}>
            {rec.icon}
            <span style={{ flex: 1 }}>
              <span className={styles.recommendationLabel}>{rec.label}</span>
              {rec.detail}
            </span>
            {(failCount > 0 || warnCount > 0) && (
              <Button
                as="a"
                href={`/action-plan${demoQ}`}
                size="small"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  color: rec.fg,
                  border: `1px solid ${rec.fg}`,
                  borderRadius: '6px',
                  flexShrink: 0,
                  fontWeight: 600,
                }}
              >
                Create Action Plan
              </Button>
            )}
          </div>
        );
      })()}

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: tokens.colorBrandBackground2, color: tokens.colorBrandForeground1 }}>
            <Shield24Regular />
          </div>
          <div>
            <Text className={styles.statLabel}>Assessment Score</Text>
            <Text className={styles.statValue} style={{ color: latest ? scoreColor(latest.overallScore) : undefined }}>
              {latest?.overallScore ?? '—'}
              {latest && <span className={styles.statSuffix}>/100</span>}
            </Text>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: tokens.colorStatusSuccessBackground1, color: tokens.colorStatusSuccessForeground1 }}>
            <CheckmarkCircle24Filled />
          </div>
          <div>
            <Text className={styles.statLabel}>Passed</Text>
            <Text className={styles.statValue}>{latest ? passCount : '—'}</Text>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: tokens.colorStatusDangerBackground1, color: tokens.colorStatusDangerForeground1 }}>
            <DismissCircle24Filled />
          </div>
          <div>
            <Text className={styles.statLabel}>Failed</Text>
            <Text className={styles.statValue}>{latest ? failCount : '—'}</Text>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: tokens.colorStatusWarningBackground1, color: tokens.colorStatusWarningForeground1 }}>
            <Warning24Filled />
          </div>
          <div>
            <Text className={styles.statLabel}>Warnings</Text>
            <Text className={styles.statValue}>{latest ? warnCount : '—'}</Text>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: tokens.colorNeutralBackground4, color: tokens.colorNeutralForeground3 }}>
            <Clock24Regular />
          </div>
          <div>
            <Text className={styles.statLabel}>Pending</Text>
            <Text className={styles.statValue}>{latest ? pendingCount : '—'}</Text>
          </div>
        </div>
      </div>

      {/* Check Status Table */}
      {latest ? (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <Text className={styles.tableTitle}>Check Status</Text>
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowRight16Regular />}
              iconPosition="after"
              onClick={() => router.push(`/assessment/${latest.id}${demoQ}`)}
            >
              View Full Report
            </Button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Check Name</th>
                <th
                  className={`${styles.th} ${styles.thSortable} ${sortCol === 'category' ? styles.thActive : ''}`}
                  onClick={() => handleSort('category')}
                >
                  <span className={styles.thInner}>Category <SortIcon col="category" sortCol={sortCol} sortDir={sortDir} /></span>
                </th>
                <th
                  className={`${styles.th} ${styles.thSortable} ${sortCol === 'severity' ? styles.thActive : ''}`}
                  onClick={() => handleSort('severity')}
                >
                  <span className={styles.thInner}>Severity <SortIcon col="severity" sortCol={sortCol} sortDir={sortDir} /></span>
                </th>
                <th
                  className={`${styles.th} ${styles.thSortable} ${sortCol === 'status' ? styles.thActive : ''}`}
                  onClick={() => handleSort('status')}
                >
                  <span className={styles.thInner}>Status <SortIcon col="status" sortCol={sortCol} sortDir={sortDir} /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleChecks.map((check) => {
                const sev = severityBadgeColor(check.severity);
                const isExpanded = expandedCheckId === check.checkId;
                const hasDetails = !!(check.details || check.remediation || check.docUrl);
                return (
                  <React.Fragment key={check.checkId}>
                    <tr
                      className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}
                      onClick={() => hasDetails && setExpandedCheckId(isExpanded ? null : check.checkId)}
                    >
                      <td className={styles.td}>
                        <div className={styles.checkNameCell}>
                          {hasDetails ? (
                            isExpanded
                              ? <ChevronDown16Regular className={styles.chevron} />
                              : <ChevronRight16Regular className={styles.chevron} />
                          ) : (
                            <span style={{ width: '16px', flexShrink: 0 }} />
                          )}
                          <Text weight="semibold" style={{ fontSize: tokens.fontSizeBase300 }}>{check.name}</Text>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <Text style={{ color: tokens.colorNeutralForeground3 }}>{check.categoryName}</Text>
                      </td>
                      <td className={styles.td}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '6px',
                          backgroundColor: sev.bg,
                          color: sev.fg,
                          fontSize: tokens.fontSizeBase200,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}>
                          {check.severity}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <Tooltip
                          content={statusTooltip[check.status] ?? check.status}
                          relationship="label"
                          positioning="above-start"
                        >
                          <span>
                            <StatusBadge status={check.status as CheckStatus} />
                          </span>
                        </Tooltip>
                      </td>
                    </tr>
                    {isExpanded && hasDetails && (
                      <tr key={`${check.checkId}-expanded`} className={styles.expandedRow}>
                        <td colSpan={4} className={styles.expandedCell}>
                          <div className={styles.expandedContent}>
                            {check.details && (
                              <div style={{ marginBottom: (check.remediation || check.docUrl) ? '12px' : 0 }}>
                                <Text className={styles.expandedLabel}>Details</Text>
                                <Text className={styles.expandedText}>{check.details}</Text>
                              </div>
                            )}
                            {check.remediation && (
                              <div style={{ marginBottom: check.docUrl ? '12px' : 0 }}>
                                <Text className={styles.expandedLabel}>Remediation</Text>
                                <Text className={styles.expandedText}>{check.remediation}</Text>
                              </div>
                            )}
                            {check.docUrl && (
                              <div>
                                <Text className={styles.expandedLabel}>Documentation</Text>
                                <a
                                  href={check.docUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: tokens.fontSizeBase300, color: tokens.colorBrandForeground1, textDecoration: 'none' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {check.docUrl}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.emptyState}>
            <ClipboardTask24Regular className={styles.emptyIcon} />
            <Text style={{ display: 'block', fontSize: tokens.fontSizeBase400, fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
              No assessments yet
            </Text>
            <Text style={{ display: 'block', marginTop: '4px', color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase300 }}>
              Run your first assessment to see check results here.
            </Text>
            <Button
              appearance="primary"
              icon={<Play24Filled />}
              size="large"
              style={{ marginTop: '20px' }}
              onClick={() => router.push(`/assessment${demoQ}`)}
            >
              Run Assessment
            </Button>
          </div>
        </div>
      )}

      {/* Bottom row: Category Scores + Recent History */}
      {latest && (
        <div className={styles.bottomGrid}>
          <div className={styles.smallCard}>
            <div className={styles.smallCardHeader}>
              <Text className={styles.smallCardTitle}>Category Scores</Text>
            </div>
            {latest.categories
              .filter((c) => c.checks && c.checks.length > 0)
              .map((cat) => (
                <div key={cat.categoryId} className={styles.historyRow}>
                  <Text style={{ fontSize: tokens.fontSizeBase300 }}>{cat.name}</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Text style={{ fontSize: tokens.fontSizeBase300, fontWeight: 700, color: scoreColor(cat.score) }}>
                      {cat.score}/100
                    </Text>
                    <StatusBadge status={cat.status} />
                  </div>
                </div>
              ))}
          </div>

          <div className={styles.smallCard}>
            <div className={styles.smallCardHeader}>
              <Text className={styles.smallCardTitle}>Recent Assessments</Text>
              <Button
                appearance="subtle"
                size="small"
                icon={<ArrowRight16Regular />}
                iconPosition="after"
                onClick={() => router.push(`/history${demoQ}`)}
              >
                See All
              </Button>
            </div>
            {history.length > 0 ? (
              history.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className={styles.historyRow}
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/assessment/${a.id}${demoQ}`)}
                >
                  <div>
                    <Text style={{ fontSize: tokens.fontSizeBase300, fontWeight: 600 }}>
                      Score: <span style={{ color: scoreColor(a.score) }}>{a.score}</span>/100
                    </Text>
                    <Text style={{ display: 'block', fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground4 }}>
                      {new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </div>
                  <StatusBadge status={a.status as CheckStatus} />
                </div>
              ))
            ) : (
              <Text style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
                No previous assessments.
              </Text>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
