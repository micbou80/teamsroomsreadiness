'use client';

import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  makeStyles,
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
import type { CheckResult, CheckStatus } from '@/checks/types';
import { RemediationPanel } from './RemediationPanel';

const useStyles = makeStyles({
  item: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
  },
  statusIcon: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  passIcon: { color: tokens.colorStatusSuccessForeground1 },
  failIcon: { color: tokens.colorStatusDangerForeground1 },
  warningIcon: { color: tokens.colorStatusWarningForeground1 },
  infoIcon: { color: tokens.colorBrandForeground1 },
  naIcon: { color: tokens.colorNeutralForeground3 },
  pendingIcon: { color: tokens.colorNeutralForeground2 },
  checkName: {
    flex: 1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  severityBadge: {
    flexShrink: 0,
  },
  panel: {
    padding: '12px 16px 16px 46px',
  },
  details: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: '12px',
    lineHeight: tokens.lineHeightBase300,
  },
});

const statusIconMap: Record<CheckStatus, { icon: React.ElementType; className: string }> = {
  pass: { icon: CheckmarkCircle20Filled, className: 'passIcon' },
  fail: { icon: DismissCircle20Filled, className: 'failIcon' },
  warning: { icon: Warning20Filled, className: 'warningIcon' },
  info: { icon: Info20Filled, className: 'infoIcon' },
  'not-applicable': { icon: SubtractCircle20Filled, className: 'naIcon' },
  pending: { icon: Clock20Filled, className: 'pendingIcon' },
};

const severityAppearance: Record<string, 'danger' | 'important' | 'warning' | 'informative'> = {
  critical: 'danger',
  high: 'important',
  medium: 'warning',
  low: 'informative',
};

interface CheckResultRowProps {
  check: CheckResult;
}

export function CheckResultRow({ check }: CheckResultRowProps) {
  const styles = useStyles();
  const { icon: StatusIcon, className: iconClass } = statusIconMap[check.status];

  return (
    <AccordionItem value={check.checkId} className={styles.item}>
      <AccordionHeader>
        <div className={styles.headerContent}>
          <span className={`${styles.statusIcon} ${styles[iconClass as keyof typeof styles]}`}>
            <StatusIcon />
          </span>
          <span className={styles.checkName}>{check.name}</span>
          <Badge
            className={styles.severityBadge}
            appearance="filled"
            color={severityAppearance[check.severity] ?? 'informative'}
          >
            {check.severity}
          </Badge>
        </div>
      </AccordionHeader>
      <AccordionPanel className={styles.panel}>
        <div className={styles.details}>{check.details}</div>
        {(check.remediation || check.docUrl) && (
          <RemediationPanel
            remediation={check.remediation}
            docUrl={check.docUrl}
          />
        )}
      </AccordionPanel>
    </AccordionItem>
  );
}
