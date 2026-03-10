'use client';

import { useCallback, useState } from 'react';
import {
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Copy20Regular,
  Checkmark20Regular,
  Open20Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  codeBlock: {
    position: 'relative',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px',
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowX: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  copyButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
});

interface RemediationPanelProps {
  remediation?: string;
  docUrl?: string;
}

export function RemediationPanel({ remediation, docUrl }: RemediationPanelProps) {
  const styles = useStyles();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!remediation) return;
    try {
      await navigator.clipboard.writeText(remediation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: silently fail if clipboard API is unavailable
    }
  }, [remediation]);

  return (
    <div className={styles.root}>
      {remediation && (
        <div className={styles.codeBlock}>
          <Button
            className={styles.copyButton}
            appearance="subtle"
            size="small"
            icon={copied ? <Checkmark20Regular /> : <Copy20Regular />}
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy to clipboard'}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          {remediation}
        </div>
      )}

      {docUrl && (
        <div className={styles.actions}>
          <Button
            appearance="secondary"
            size="small"
            icon={<Open20Regular />}
            as="a"
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Docs
          </Button>
        </div>
      )}
    </div>
  );
}
