'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Title1,
  Title2,
  Title3,
  Text,
  Card,
  CardHeader,
  Button,
  Spinner,
  makeStyles,
  tokens,
  Divider,
  Badge,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  ArrowDownload24Regular,
  Warning24Filled,
  DismissCircle24Filled,
} from '@fluentui/react-icons';
import { StatusBadge } from '@/components/assessment/StatusBadge';
import type { Assessment, CategoryResult, CheckResult, CheckStatus } from '@/checks/types';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
  },
  backLink: {
    marginBottom: '16px',
  },
  scoreSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    marginTop: '24px',
    flexWrap: 'wrap',
  },
  donut: {
    position: 'relative' as const,
    width: '140px',
    height: '140px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutLabel: {
    position: 'absolute' as const,
    textAlign: 'center' as const,
  },
  metaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginTop: '24px',
  },
  categoryCard: {
    cursor: 'pointer',
    '&:hover': {
      boxShadow: tokens.shadow8,
    },
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attentionSection: {
    marginTop: '32px',
  },
  attentionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  attentionIcon: {
    marginTop: '2px',
    flexShrink: 0,
  },
  attentionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  attentionMeta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
  },
});

function scoreColor(score: number): string {
  if (score >= 80) return tokens.colorStatusSuccessForeground1;
  if (score >= 60) return tokens.colorStatusWarningForeground1;
  return tokens.colorStatusDangerForeground1;
}

function ReadinessScoreDonut({ score }: { score: number }) {
  const styles = useStyles();
  const color = scoreColor(score);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={styles.donut}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={tokens.colorNeutralStroke2}
          strokeWidth="12"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className={styles.donutLabel}>
        <Text size={800} weight="bold" style={{ color }}>
          {score}
        </Text>
        <br />
        <Text size={200}>/ 100</Text>
      </div>
    </div>
  );
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function AssessmentResultsPage() {
  const styles = useStyles();
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/assessment?id=${assessmentId}&demo=true`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Failed to load assessment.');
        }
        const data = await res.json();
        setAssessment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [assessmentId]);

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="large" label="Loading assessment..." />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={() => router.push('/history')}
          className={styles.backLink}
        >
          Back to History
        </Button>
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error ?? 'Assessment not found.'}
          </MessageBarBody>
        </MessageBar>
      </div>
    );
  }

  const categoryResults: CategoryResult[] = assessment.categories ?? [];

  // Collect all failing/warning checks sorted by severity
  const attentionChecks: (CheckResult & { categoryName: string })[] = [];
  for (const cat of categoryResults) {
    for (const check of cat.checks) {
      if (check.status === 'fail' || check.status === 'warning') {
        attentionChecks.push({ ...check, categoryName: cat.name });
      }
    }
  }
  attentionChecks.sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
  );

  const meta = assessment.metadata;

  return (
    <div>
      <Button
        appearance="subtle"
        icon={<ArrowLeft24Regular />}
        onClick={() => router.push('/history')}
        className={styles.backLink}
      >
        Back to History
      </Button>

      <div className={styles.header}>
        <div>
          <Title1 as="h1">Assessment Results</Title1>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {new Date(assessment.createdAt).toLocaleString()}
          </Text>
        </div>
        <Button
          appearance="secondary"
          icon={<ArrowDownload24Regular />}
          onClick={() => {
            /* export placeholder */
            alert('Export functionality coming soon.');
          }}
        >
          Export
        </Button>
      </div>

      {/* Score + Meta */}
      <div className={styles.scoreSection}>
        <ReadinessScoreDonut score={assessment.overallScore} />
        <div className={styles.metaList}>
          <Text size={300}>
            <strong>Status:</strong>{' '}
            <StatusBadge status={assessment.overallStatus as CheckStatus} />
          </Text>
          <Text size={200}>Graph checks run: {meta?.webChecksRun ?? 0}</Text>
          <Text size={200}>PowerShell checks merged: {meta?.powershellChecksMerged ?? 0}</Text>
          <Text size={200}>Manual checks completed: {meta?.manualChecksCompleted ?? 0}</Text>
          {meta?.duration != null && (
            <Text size={200}>Duration: {(meta.duration / 1000).toFixed(1)}s</Text>
          )}
        </div>
      </div>

      <Divider style={{ margin: '32px 0' }} />

      {/* Category Grid */}
      <Title2 as="h2">Categories</Title2>
      <div className={styles.categoryGrid}>
        {categoryResults.map((cat) => (
          <Card
            key={cat.categoryId}
            className={styles.categoryCard}
            onClick={() =>
              router.push(`/category/${cat.categoryId}?assessmentId=${assessmentId}`)
            }
          >
            <CardHeader
              header={
                <div className={styles.categoryHeader}>
                  <Text weight="semibold">{cat.name}</Text>
                  <StatusBadge status={cat.status} />
                </div>
              }
              description={
                <Text size={200}>
                  Score: {cat.score}/100 &middot; {cat.checks.length} checks
                </Text>
              }
            />
          </Card>
        ))}
      </div>

      {/* Attention Required */}
      {attentionChecks.length > 0 && (
        <div className={styles.attentionSection}>
          <Divider style={{ marginBottom: '24px' }} />
          <Title2 as="h2">Attention Required</Title2>
          <Text
            size={200}
            style={{ display: 'block', marginTop: '4px', color: tokens.colorNeutralForeground3 }}
          >
            {attentionChecks.length} check{attentionChecks.length !== 1 ? 's' : ''} need
            attention, sorted by severity.
          </Text>

          <div style={{ marginTop: '16px' }}>
            {attentionChecks.map((check) => (
              <div key={check.checkId} className={styles.attentionItem}>
                <div className={styles.attentionIcon}>
                  {check.status === 'fail' ? (
                    <DismissCircle24Filled
                      style={{ color: tokens.colorStatusDangerForeground1 }}
                    />
                  ) : (
                    <Warning24Filled
                      style={{ color: tokens.colorStatusWarningForeground1 }}
                    />
                  )}
                </div>
                <div className={styles.attentionDetails}>
                  <Text weight="semibold">{check.name}</Text>
                  <div className={styles.attentionMeta}>
                    <StatusBadge status={check.status} />
                    <Badge appearance="outline" size="small">
                      {check.severity}
                    </Badge>
                    <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                      {check.categoryName}
                    </Text>
                  </div>
                  <Text size={200}>{check.details}</Text>
                  {check.remediation && (
                    <Text size={200} style={{ color: tokens.colorBrandForeground1 }}>
                      {check.remediation}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
