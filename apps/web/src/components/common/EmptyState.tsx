'use client';

import {
  Button,
  makeStyles,
  Text,
  tokens,
} from '@fluentui/react-components';
import { DocumentDismiss24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
    gap: '12px',
  },
  icon: {
    color: tokens.colorNeutralForeground3,
    marginBottom: '4px',
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
  },
  description: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    maxWidth: '400px',
  },
  action: {
    marginTop: '8px',
  },
});

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.icon}>
        {icon ?? <DocumentDismiss24Regular />}
      </div>
      <Text className={styles.title}>{title}</Text>
      {description && (
        <Text className={styles.description}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button
          className={styles.action}
          appearance="primary"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
