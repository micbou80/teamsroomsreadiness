'use client';

import { Accordion, makeStyles } from '@fluentui/react-components';
import type { CheckResult, CheckStatus } from '@/checks/types';
import { CheckResultRow } from './CheckResultRow';
import { EmptyState } from '../common/EmptyState';

const useStyles = makeStyles({
  list: {
    display: 'flex',
    flexDirection: 'column',
  },
});

const statusSortOrder: Record<CheckStatus, number> = {
  fail: 0,
  warning: 1,
  pass: 2,
  info: 3,
  pending: 4,
  'not-applicable': 5,
};

function sortChecks(checks: CheckResult[]): CheckResult[] {
  return [...checks].sort((a, b) => statusSortOrder[a.status] - statusSortOrder[b.status]);
}

interface CheckResultListProps {
  checks: CheckResult[];
}

export function CheckResultList({ checks }: CheckResultListProps) {
  const styles = useStyles();

  if (checks.length === 0) {
    return (
      <EmptyState
        title="No checks found"
        description="There are no check results to display for this category."
      />
    );
  }

  const sorted = sortChecks(checks);

  return (
    <Accordion multiple collapsible className={styles.list}>
      {sorted.map((check) => (
        <CheckResultRow key={check.checkId} check={check} />
      ))}
    </Accordion>
  );
}
