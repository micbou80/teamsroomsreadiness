'use client';

import {
  Badge,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';
import {
  CheckmarkCircle20Filled,
  DismissCircle20Filled,
  Warning20Filled,
  Info20Filled,
  SubtractCircle20Filled,
  Clock20Filled,
} from '@fluentui/react-icons';
import type { CheckStatus } from '@/checks/types';

const useStyles = makeStyles({
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    paddingLeft: '8px',
    paddingRight: '10px',
    paddingTop: '2px',
    paddingBottom: '2px',
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase200,
  },
  pass: {
    backgroundColor: tokens.colorStatusSuccessBackground1,
    color: tokens.colorStatusSuccessForeground1,
  },
  fail: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: tokens.colorStatusDangerForeground1,
  },
  warning: {
    backgroundColor: tokens.colorStatusWarningBackground1,
    color: tokens.colorStatusWarningForeground1,
  },
  info: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  'not-applicable': {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
  },
  pending: {
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground2,
  },
});

const statusConfig: Record<CheckStatus, { label: string; icon: React.ElementType }> = {
  pass: { label: 'Pass', icon: CheckmarkCircle20Filled },
  fail: { label: 'Fail', icon: DismissCircle20Filled },
  warning: { label: 'Warning', icon: Warning20Filled },
  info: { label: 'Info', icon: Info20Filled },
  'not-applicable': { label: 'N/A', icon: SubtractCircle20Filled },
  pending: { label: 'Pending', icon: Clock20Filled },
};

interface StatusBadgeProps {
  status: CheckStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = useStyles();
  const { label, icon: Icon } = statusConfig[status];

  return (
    <span className={mergeClasses(styles.badge, styles[status], className)}>
      <Icon />
      {label}
    </span>
  );
}
