'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  Title1,
  Title3,
  Text,
  Card,
  CardHeader,
  Button,
  Spinner,
  makeStyles,
  tokens,
  Badge,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  CheckmarkCircle24Filled,
  DismissCircle24Filled,
  Warning24Filled,
  Info24Filled,
  Clock24Filled,
  SubtractCircle24Filled,
} from '@fluentui/react-icons';
import { StatusBadge } from '@/components/assessment/StatusBadge';
import type { Assessment, CategoryResult, CheckResult, CheckStatus } from '@/checks/types';

const useStyles = makeStyles({
  backLink: {
    marginBottom: '16px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  subtitle: {
    display: 'block',
    marginTop: '4px',
    color: tokens.colorNeutralForeground3,
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '16px',
  },
  scoreBig: {
    fontSize: '36px',
    fontWeight: 'bold',
  },
  checkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '24px',
  },
  checkCard: {
    padding: '16px',
  },
  checkHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkMeta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginTop: '4px',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
  },
});

const statusIcons: Record<CheckStatus, React.ElementType> = {
  pass: CheckmarkCircle24Filled,
  fail: DismissCircle24Filled,
  warning: Warning24Filled,
  info: Info24Filled,
  pending: Clock24Filled,
  'not-applicable': SubtractCircle24Filled,
};

function scoreColor(score: number): string {
  if (score >= 80) return tokens.colorStatusSuccessForeground1;
  if (score >= 60) return tokens.colorStatusWarningForeground1;
  return tokens.colorStatusDangerForeground1;
}

export default function CategoryDetailPage() {
  const styles = useStyles();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = params.slug as string;
  const assessmentId = searchParams.get('assessmentId') ?? '';

  const [category, setCategory] = useState<CategoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!assessmentId) {
        setError('No assessment ID provided.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/assessment?id=${assessmentId}&demo=true`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Failed to load assessment.');
        }
        const assessment: Assessment = await res.json();
        const cat = assessment.categories?.find((c) => c.categoryId === slug);
        if (!cat) {
          throw new Error(`Category "${slug}" not found in assessment.`);
        }
        setCategory(cat);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, assessmentId]);

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="large" label="Loading category..." />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={() => router.back()}
          className={styles.backLink}
        >
          Back
        </Button>
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error ?? 'Category not found.'}
          </MessageBarBody>
        </MessageBar>
      </div>
    );
  }

  // Sort checks: fails first, then warnings, then rest
  const STATUS_SORT: Record<string, number> = {
    fail: 0,
    warning: 1,
    info: 2,
    pass: 3,
    pending: 4,
    'not-applicable': 5,
  };
  const sortedChecks = [...category.checks].sort(
    (a, b) => (STATUS_SORT[a.status] ?? 9) - (STATUS_SORT[b.status] ?? 9),
  );

  return (
    <div>
      <Button
        appearance="subtle"
        icon={<ArrowLeft24Regular />}
        onClick={() => router.push(`/assessment/${assessmentId}`)}
        className={styles.backLink}
      >
        Back to Assessment
      </Button>

      <div className={styles.headerRow}>
        <div>
          <Title1 as="h1">{category.name}</Title1>
          <Text size={200} className={styles.subtitle}>
            {category.checks.length} checks in this category
          </Text>
        </div>
        <StatusBadge status={category.status} />
      </div>

      <div className={styles.scoreRow}>
        <Text className={styles.scoreBig} style={{ color: scoreColor(category.score) }}>
          {category.score}
        </Text>
        <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
          / 100
        </Text>
      </div>

      <Divider style={{ margin: '24px 0' }} />

      <Title3 as="h2">Check Results</Title3>

      <div className={styles.checkList}>
        {sortedChecks.map((check) => {
          const Icon = statusIcons[check.status] ?? Clock24Filled;
          return (
            <Card key={check.checkId} className={styles.checkCard}>
              <div className={styles.checkHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon
                    style={{
                      color:
                        check.status === 'pass'
                          ? tokens.colorStatusSuccessForeground1
                          : check.status === 'fail'
                            ? tokens.colorStatusDangerForeground1
                            : check.status === 'warning'
                              ? tokens.colorStatusWarningForeground1
                              : tokens.colorNeutralForeground3,
                    }}
                  />
                  <Text weight="semibold">{check.name}</Text>
                </div>
                <StatusBadge status={check.status} />
              </div>
              <div className={styles.checkMeta}>
                <Badge appearance="outline" size="small">
                  {check.severity}
                </Badge>
                <Badge appearance="outline" size="small" color="informative">
                  {check.source}
                </Badge>
              </div>
              <Text
                size={200}
                style={{
                  display: 'block',
                  marginTop: '8px',
                  color: tokens.colorNeutralForeground2,
                }}
              >
                {check.details}
              </Text>
              {check.remediation && (
                <Text
                  size={200}
                  style={{
                    display: 'block',
                    marginTop: '4px',
                    color: tokens.colorBrandForeground1,
                  }}
                >
                  {check.remediation}
                </Text>
              )}
              {check.docUrl && (
                <a
                  href={check.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px', marginTop: '4px', display: 'inline-block' }}
                >
                  Documentation
                </a>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
