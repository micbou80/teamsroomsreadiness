'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Text,
  Button,
  Spinner,
  Checkbox,
  Tooltip,
} from '@fluentui/react-components';
import {
  Play24Filled,
  ChevronDown16Regular,
  ChevronRight16Regular,
  TaskListSquareLtr24Regular,
  ArrowCounterclockwise20Regular,
} from '@fluentui/react-icons';
import { StatusBadge } from '@/components/assessment/StatusBadge';
import type { CheckStatus } from '@/checks/types';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles({
  container: { maxWidth: '900px' },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
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
  progressCard: {
    padding: '20px 24px',
    borderRadius: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  progressBar: {
    flex: 1,
    height: '10px',
    borderRadius: '99px',
    backgroundColor: tokens.colorNeutralBackground4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '99px',
    backgroundColor: tokens.colorBrandBackground,
    transitionProperty: 'width',
    transitionDuration: '300ms',
  },
  progressLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap' as const,
  },
  projectedScore: {
    fontSize: '20px',
    fontWeight: '700',
    color: tokens.colorBrandForeground1,
    whiteSpace: 'nowrap' as const,
  },
  group: {
    marginBottom: '20px',
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    padding: '0 4px',
  },
  groupLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: tokens.colorNeutralForeground3,
  },
  groupCount: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground4,
  },
  card: {
    borderRadius: '10px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: '100ms',
    '&:last-child': {
      borderBottom: 'none',
    },
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
  },
  itemDone: {
    opacity: 0.5,
  },
  itemMeta: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  itemNameDone: {
    textDecoration: 'line-through',
    color: tokens.colorNeutralForeground3,
  },
  itemCategory: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: '1px',
  },
  itemBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  expandedContent: {
    padding: '12px 18px 16px 54px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: '#f9fafb',
  },
  expandedInner: {
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
  empty: {
    textAlign: 'center' as const,
    padding: '60px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '12px',
  },
  allDone: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    backgroundColor: tokens.colorStatusSuccessBackground1,
    border: `1px solid ${tokens.colorStatusSuccessBorderActive}`,
    borderRadius: '12px',
    color: tokens.colorStatusSuccessForeground1,
  },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionItem {
  checkId: string;
  name: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: CheckStatus;
  details?: string;
  remediation?: string;
  docUrl?: string;
}

interface LatestAssessment {
  id: string;
  overallScore: number;
  categories: {
    name: string;
    checks?: ActionItem[];
  }[];
}

const SEVERITY_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
  critical: { label: 'Critical', bg: tokens.colorStatusDangerBackground1, fg: tokens.colorStatusDangerForeground1 },
  high:     { label: 'High',     bg: tokens.colorPalettePeachBackground2,  fg: tokens.colorPalettePeachForeground2  },
  medium:   { label: 'Medium',   bg: tokens.colorStatusWarningBackground1, fg: tokens.colorStatusWarningForeground1 },
  low:      { label: 'Low',      bg: tokens.colorBrandBackground2,          fg: tokens.colorBrandForeground1          },
};

function storageKey(assessmentId: string) {
  return `action-plan-done-${assessmentId}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActionPlanPage() {
  const styles = useStyles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const demoQ = isDemo ? '?demo=true' : '';

  const [assessment, setAssessment] = useState<LatestAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const url = isDemo ? '/api/assessment?demo=true&latest=true' : '/api/assessment?latest=true';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setAssessment(data);
          try {
            const saved = localStorage.getItem(storageKey(data.id));
            if (saved) setDoneIds(new Set(JSON.parse(saved)));
          } catch { /* ignore */ }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isDemo]);

  function persistDone(next: Set<string>, id: string) {
    if (!assessment) return;
    try {
      localStorage.setItem(storageKey(assessment.id), JSON.stringify([...next]));
    } catch { /* ignore */ }
    setDoneIds(next);
    if (expandedId === id) setExpandedId(null);
  }

  function toggleDone(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = new Set(doneIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    persistDone(next, id);
  }

  function resetAll() {
    if (!assessment) return;
    try { localStorage.removeItem(storageKey(assessment.id)); } catch { /* ignore */ }
    setDoneIds(new Set());
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner size="large" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className={styles.container}>
        <Text className={styles.title}>Action Plan</Text>
        <div className={styles.empty} style={{ marginTop: '24px' }}>
          <TaskListSquareLtr24Regular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3 }} />
          <Text style={{ display: 'block', fontSize: tokens.fontSizeBase400, fontWeight: 600, marginTop: '16px', color: tokens.colorNeutralForeground1 }}>
            No assessment found
          </Text>
          <Text style={{ display: 'block', marginTop: '4px', color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase300 }}>
            Run an assessment first to generate your action plan.
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
    );
  }

  // Flatten all failing/warning checks into action items
  const actionItems: ActionItem[] = assessment.categories.flatMap((c) =>
    (c.checks ?? [])
      .filter((ch) => ch.status === 'fail' || ch.status === 'warning')
      .map((ch) => ({ ...ch, category: c.name }))
  );

  // Group by severity
  const grouped = ['critical', 'high', 'medium', 'low'].reduce<Record<string, ActionItem[]>>((acc, sev) => {
    acc[sev] = actionItems.filter((i) => i.severity === sev);
    return acc;
  }, {});

  const totalCount = actionItems.length;
  const doneCount = actionItems.filter((i) => doneIds.has(i.checkId)).length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 100;

  // Rough projected score: each resolved item adds proportional weight
  const projectedScore = totalCount > 0
    ? Math.min(100, Math.round(assessment.overallScore + (100 - assessment.overallScore) * (doneCount / totalCount)))
    : assessment.overallScore;

  if (totalCount === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div>
            <Text className={styles.title}>Action Plan</Text>
            <Text className={styles.subtitle}>Based on your latest assessment.</Text>
          </div>
        </div>
        <div className={styles.allDone}>
          <Text style={{ display: 'block', fontSize: tokens.fontSizeBase500, fontWeight: 700 }}>
            All checks passed!
          </Text>
          <Text style={{ display: 'block', marginTop: '6px', fontSize: tokens.fontSizeBase300 }}>
            There are no failed or warning checks. Your tenant is in great shape.
          </Text>
          <Button
            appearance="primary"
            icon={<Play24Filled />}
            style={{ marginTop: '20px' }}
            onClick={() => router.push(`/assessment${demoQ}`)}
          >
            Run New Assessment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <Text className={styles.title}>Action Plan</Text>
          <Text className={styles.subtitle}>
            {doneCount === totalCount
              ? 'All items resolved — run a new assessment to confirm.'
              : `${totalCount - doneCount} item${totalCount - doneCount !== 1 ? 's' : ''} remaining. Check off each item as you resolve it.`}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {doneCount > 0 && (
            <Tooltip content="Reset all checkboxes" relationship="label">
              <Button
                appearance="subtle"
                icon={<ArrowCounterclockwise20Regular />}
                size="small"
                onClick={resetAll}
              >
                Reset
              </Button>
            </Tooltip>
          )}
          <Button
            appearance="primary"
            icon={<Play24Filled />}
            size="small"
            onClick={() => router.push(`/assessment${demoQ}`)}
          >
            Re-run Assessment
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressCard}>
        <div style={{ flexShrink: 0 }}>
          <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, display: 'block' }}>Progress</Text>
          <Text style={{ fontSize: '22px', fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
            {doneCount}<span style={{ fontSize: '14px', fontWeight: 400, color: tokens.colorNeutralForeground3 }}>/{totalCount}</span>
          </Text>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <Text className={styles.progressLabel}>{pct}% resolved</Text>
        <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
          <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, display: 'block' }}>Projected score</Text>
          <Text className={styles.projectedScore}>{projectedScore}/100</Text>
        </div>
      </div>

      {/* Grouped action items */}
      {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
        const items = grouped[sev];
        if (!items.length) return null;
        const sevConfig = SEVERITY_LABELS[sev];
        return (
          <div key={sev} className={styles.group}>
            <div className={styles.groupHeader}>
              <span style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: '6px',
                backgroundColor: sevConfig.bg,
                color: sevConfig.fg,
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {sevConfig.label}
              </span>
              <Text className={styles.groupCount}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
            </div>
            <div className={styles.card}>
              {items.map((item) => {
                const isDone = doneIds.has(item.checkId);
                const isExpanded = expandedId === item.checkId;
                const hasDetails = !!(item.details || item.remediation || item.docUrl);
                return (
                  <div key={item.checkId}>
                    <div
                      className={`${styles.item} ${isDone ? styles.itemDone : ''}`}
                      onClick={() => hasDetails && setExpandedId(isExpanded ? null : item.checkId)}
                    >
                      <div onClick={(e) => toggleDone(item.checkId, e)} style={{ flexShrink: 0 }}>
                        <Checkbox checked={isDone} />
                      </div>
                      <div className={styles.itemMeta}>
                        <Text className={mergeClasses(styles.itemName, isDone && styles.itemNameDone)}>
                          {item.name}
                        </Text>
                        <Text className={styles.itemCategory}>{item.category}</Text>
                      </div>
                      <div className={styles.itemBadges}>
                        <StatusBadge status={item.status} />
                        {hasDetails && (
                          isExpanded
                            ? <ChevronDown16Regular style={{ color: tokens.colorNeutralForeground3 }} />
                            : <ChevronRight16Regular style={{ color: tokens.colorNeutralForeground3 }} />
                        )}
                      </div>
                    </div>
                    {isExpanded && hasDetails && (
                      <div className={styles.expandedContent}>
                        <div className={styles.expandedInner}>
                          {item.details && (
                            <div style={{ marginBottom: (item.remediation || item.docUrl) ? '12px' : 0 }}>
                              <Text className={styles.expandedLabel}>Details</Text>
                              <Text className={styles.expandedText}>{item.details}</Text>
                            </div>
                          )}
                          {item.remediation && (
                            <div style={{ marginBottom: item.docUrl ? '12px' : 0 }}>
                              <Text className={styles.expandedLabel}>Remediation</Text>
                              <Text className={styles.expandedText}>{item.remediation}</Text>
                            </div>
                          )}
                          {item.docUrl && (
                            <div>
                              <Text className={styles.expandedLabel}>Documentation</Text>
                              <a
                                href={item.docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: tokens.fontSizeBase300, color: tokens.colorBrandForeground1, textDecoration: 'none' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {item.docUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
