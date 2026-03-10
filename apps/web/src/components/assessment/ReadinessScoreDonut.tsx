'use client';

import { makeStyles, Text, tokens } from '@fluentui/react-components';
import type { CheckResult } from '@/checks/types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  chartWrapper: {
    position: 'relative',
    width: '160px',
    height: '160px',
  },
  svg: {
    transform: 'rotate(-90deg)',
  },
  scoreLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    lineHeight: '1',
  },
  scoreUnit: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  countsRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  countItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  green: { backgroundColor: tokens.colorStatusSuccessForeground1 },
  red: { backgroundColor: tokens.colorStatusDangerForeground1 },
  yellow: { backgroundColor: tokens.colorStatusWarningForeground1 },
  gray: { backgroundColor: tokens.colorNeutralForeground3 },
});

interface ReadinessScoreDonutProps {
  score: number;
  checks: CheckResult[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return tokens.colorStatusSuccessForeground1;
  if (score >= 60) return tokens.colorStatusWarningForeground1;
  return tokens.colorStatusDangerForeground1;
}

export function ReadinessScoreDonut({ score, checks }: ReadinessScoreDonutProps) {
  const styles = useStyles();

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const pendingCount = checks.filter((c) => c.status === 'pending').length;

  const radius = 62;
  const stroke = 12;
  const center = 80;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const gap = circumference - filled;

  const color = getScoreColor(score);

  return (
    <div className={styles.root}>
      <div className={styles.chartWrapper}>
        <svg
          className={styles.svg}
          width="160"
          height="160"
          viewBox="0 0 160 160"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={tokens.colorNeutralBackground3}
            strokeWidth={stroke}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${filled} ${gap}`}
            strokeLinecap="round"
          />
        </svg>
        <div className={styles.scoreLabel}>
          <span className={styles.scoreValue} style={{ color }}>
            {Math.round(score)}
          </span>
          <span className={styles.scoreUnit}>%</span>
        </div>
      </div>

      <div className={styles.countsRow}>
        <span className={styles.countItem}>
          <span className={`${styles.dot} ${styles.green}`} />
          {passCount} passed
        </span>
        <span className={styles.countItem}>
          <span className={`${styles.dot} ${styles.red}`} />
          {failCount} failed
        </span>
        <span className={styles.countItem}>
          <span className={`${styles.dot} ${styles.yellow}`} />
          {warningCount} warnings
        </span>
        <span className={styles.countItem}>
          <span className={`${styles.dot} ${styles.gray}`} />
          {pendingCount} pending
        </span>
      </div>
    </div>
  );
}
