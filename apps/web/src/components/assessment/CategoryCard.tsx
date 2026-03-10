'use client';

import {
  Card,
  CardHeader,
  makeStyles,
  mergeClasses,
  ProgressBar,
  Text,
  tokens,
} from '@fluentui/react-components';
import {
  Certificate20Regular,
  Person20Regular,
  Calendar20Regular,
  Shield20Regular,
  Globe20Regular,
  Desktop20Regular,
  LockClosed20Regular,
  Settings20Regular,
  Call20Regular,
} from '@fluentui/react-icons';
import type { CategoryResult } from '@/checks/types';
import { StatusBadge } from './StatusBadge';

const useStyles = makeStyles({
  card: {
    cursor: 'pointer',
    padding: '16px',
    transition: 'box-shadow 0.15s ease',
    ':hover': {
      boxShadow: tokens.shadow8,
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
  },
  categoryName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  progressRow: {
    marginTop: '12px',
    marginBottom: '8px',
  },
  scoreText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
  countsRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  countItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  passCount: { color: tokens.colorStatusSuccessForeground1 },
  failCount: { color: tokens.colorStatusDangerForeground1 },
  warningCount: { color: tokens.colorStatusWarningForeground1 },
});

const iconMap: Record<string, React.ElementType> = {
  Certificate: Certificate20Regular,
  Person: Person20Regular,
  Calendar: Calendar20Regular,
  Shield: Shield20Regular,
  Globe: Globe20Regular,
  Desktop: Desktop20Regular,
  LockClosed: LockClosed20Regular,
  Settings: Settings20Regular,
  Call: Call20Regular,
};

function getProgressColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
}

interface CategoryCardProps {
  category: CategoryResult;
  onClick?: (categoryId: string) => void;
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  const styles = useStyles();
  const Icon = iconMap[category.icon] ?? Certificate20Regular;

  const passCount = category.checks.filter((c) => c.status === 'pass').length;
  const failCount = category.checks.filter((c) => c.status === 'fail').length;
  const warningCount = category.checks.filter((c) => c.status === 'warning').length;

  return (
    <Card
      className={styles.card}
      onClick={() => onClick?.(category.categoryId)}
    >
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Icon />
        </div>
        <div className={styles.titleGroup}>
          <div className={styles.categoryName}>{category.name}</div>
        </div>
        <StatusBadge status={category.status} />
      </div>

      <div className={styles.progressRow}>
        <ProgressBar
          value={category.score / 100}
          color={getProgressColor(category.score)}
          thickness="large"
        />
        <div className={styles.scoreText}>{Math.round(category.score)}% ready</div>
      </div>

      <div className={styles.countsRow}>
        <span className={mergeClasses(styles.countItem, styles.passCount)}>
          {passCount} pass
        </span>
        <span className={mergeClasses(styles.countItem, styles.failCount)}>
          {failCount} fail
        </span>
        <span className={mergeClasses(styles.countItem, styles.warningCount)}>
          {warningCount} warn
        </span>
      </div>
    </Card>
  );
}
