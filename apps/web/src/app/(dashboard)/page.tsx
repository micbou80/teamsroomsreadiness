'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Title1,
  Text,
  Card,
  CardHeader,
  makeStyles,
  tokens,
  Button,
  Spinner,
} from '@fluentui/react-components';
import {
  ClipboardTask24Regular,
  ArrowUpload24Regular,
  History24Regular,
} from '@fluentui/react-icons';
import { StatusBadge } from '@/components/assessment/StatusBadge';
import type { Assessment, CategoryResult, CheckStatus } from '@/checks/types';

const useStyles = makeStyles({
  subtitle: {
    display: 'block',
    marginTop: '8px',
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    flexWrap: 'wrap',
  },
  latestCard: {
    marginTop: '32px',
    maxWidth: '720px',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginTop: '16px',
  },
  scoreBig: {
    fontSize: '48px',
    fontWeight: 'bold' as const,
    lineHeight: 1,
  },
  categoryList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '8px',
    marginTop: '16px',
  },
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  emptyCard: {
    marginTop: '32px',
    maxWidth: '600px',
    padding: '32px',
    textAlign: 'center' as const,
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },
});

function scoreColor(score: number): string {
  if (score >= 80) return tokens.colorStatusSuccessForeground1;
  if (score >= 60) return tokens.colorStatusWarningForeground1;
  return tokens.colorStatusDangerForeground1;
}

export default function DashboardHome() {
  const styles = useStyles();
  const router = useRouter();
  const [latest, setLatest] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/assessment?demo=true&latest=true');
        if (res.ok) {
          const data = await res.json();
          if (data?.id) setLatest(data);
        }
      } catch {
        // Ignore — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories: CategoryResult[] = latest?.categories ?? [];

  return (
    <div>
      <Title1 as="h1">Teams Rooms Readiness</Title1>
      <Text size={300} className={styles.subtitle}>
        Assess your Microsoft 365 tenant configuration for Teams Rooms deployment
      </Text>

      <div className={styles.actions}>
        <Button
          as="a"
          href="/assessment"
          appearance="primary"
          icon={<ClipboardTask24Regular />}
          size="large"
        >
          Run Assessment
        </Button>
        <Button
          as="a"
          href="/upload"
          appearance="secondary"
          icon={<ArrowUpload24Regular />}
          size="large"
        >
          Upload PowerShell Results
        </Button>
        <Button
          as="a"
          href="/history"
          appearance="subtle"
          icon={<History24Regular />}
          size="large"
        >
          History
        </Button>
      </div>

      {loading && (
        <div className={styles.center}>
          <Spinner size="medium" />
        </div>
      )}

      {!loading && latest && (
        <Card className={styles.latestCard}>
          <CardHeader
            header={<Text weight="semibold" size={400}>Latest Assessment</Text>}
            description={
              <Text size={200}>
                {new Date(latest.createdAt).toLocaleString()}
              </Text>
            }
          />
          <div className={styles.scoreRow}>
            <span className={styles.scoreBig} style={{ color: scoreColor(latest.overallScore) }}>
              {latest.overallScore}
            </span>
            <div>
              <Text size={200} style={{ display: 'block' }}>Overall Score (out of 100)</Text>
              <StatusBadge status={latest.overallStatus as CheckStatus} />
            </div>
          </div>

          {categories.length > 0 && (
            <div className={styles.categoryList}>
              {categories.map((cat) => (
                <div key={cat.categoryId} className={styles.categoryItem}>
                  <Text size={200}>{cat.name}</Text>
                  <Text size={200} weight="semibold" style={{ color: scoreColor(cat.score) }}>
                    {cat.score}
                  </Text>
                </div>
              ))}
            </div>
          )}

          <Button
            appearance="subtle"
            size="small"
            style={{ marginTop: '16px' }}
            onClick={() => router.push(`/assessment/${latest.id}`)}
          >
            View full results
          </Button>
        </Card>
      )}

      {!loading && !latest && (
        <Card className={styles.emptyCard}>
          <CardHeader
            header={<Text weight="semibold" size={400}>No assessments yet</Text>}
            description={
              <Text size={200}>
                Run your first assessment to check licensing, identity, Conditional Access,
                network readiness, and more.
              </Text>
            }
          />
        </Card>
      )}
    </div>
  );
}
