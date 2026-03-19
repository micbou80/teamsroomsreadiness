'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Title1,
  Text,
  Button,
  Spinner,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  History24Regular,
  ArrowRight16Regular,
  ClipboardTask24Regular,
} from '@fluentui/react-icons';
import { StatusBadge } from '@/components/assessment/StatusBadge';
import type { CheckStatus } from '@/checks/types';

const useStyles = makeStyles({
  subtitle: {
    display: 'block',
    marginTop: '8px',
    color: tokens.colorNeutralForeground3,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '24px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
  },
  td: {
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase300,
  },
  row: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  scoreCell: {
    fontWeight: tokens.fontWeightSemibold,
  },
  empty: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    marginTop: '32px',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
  },
});

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

export default function HistoryPage() {
  const styles = useStyles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const demoQ = isDemo ? '?demo=true' : '';

  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const url = isDemo ? '/api/assessment?demo=true' : '/api/assessment';
        const res = await fetch(url);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Failed to load assessments.');
        }
        const data = await res.json();
        setAssessments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isDemo]);

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="large" label="Loading history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Title1 as="h1">Assessment History</Title1>
        <MessageBar intent="error" style={{ marginTop: '16px' }}>
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      </div>
    );
  }

  return (
    <div>
      <Title1 as="h1">Assessment History</Title1>
      <Text size={300} className={styles.subtitle}>
        View and compare past readiness assessments for your tenant.
      </Text>

      {assessments.length === 0 ? (
        <div className={styles.empty}>
          <History24Regular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3 }} />
          <Text
            size={400}
            weight="semibold"
            style={{ display: 'block', marginTop: '16px' }}
          >
            No assessments yet
          </Text>
          <Text
            size={200}
            style={{
              display: 'block',
              marginTop: '8px',
              color: tokens.colorNeutralForeground3,
            }}
          >
            Run your first assessment to see results here.
          </Text>
          <Button
            as="a"
            href={`/assessment${demoQ}`}
            appearance="primary"
            icon={<ClipboardTask24Regular />}
            style={{ marginTop: '16px' }}
          >
            Run Assessment
          </Button>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Score</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((a) => (
              <tr
                key={a.id}
                className={styles.row}
                onClick={() => router.push(`/assessment/${a.id}${demoQ}`)}
              >
                <td className={styles.td}>
                  {new Date(a.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className={`${styles.td} ${styles.scoreCell}`}>
                  <span style={{ color: scoreColor(a.score) }}>{a.score}</span>
                  <span style={{ color: tokens.colorNeutralForeground3 }}>/100</span>
                </td>
                <td className={styles.td}>
                  <StatusBadge status={a.status as CheckStatus} />
                </td>
                <td className={styles.td} style={{ textAlign: 'right' }}>
                  <Button
                    appearance="subtle"
                    icon={<ArrowRight16Regular />}
                    size="small"
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
