'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardHeader,
  Title1,
  Title3,
  Text,
  ProgressBar,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Switch,
} from '@fluentui/react-components';
import {
  ClipboardTask24Regular,
  Play24Filled,
  Checkmark24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    maxWidth: '720px',
  },
  subtitle: {
    display: 'block',
    marginTop: '8px',
    color: tokens.colorNeutralForeground3,
  },
  card: {
    marginTop: '32px',
    padding: '32px',
  },
  progressSection: {
    marginTop: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '24px',
  },
  error: {
    marginTop: '16px',
  },
});

export default function RunAssessmentPage() {
  const styles = useStyles();
  const router = useRouter();

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(true);

  async function startAssessment() {
    setRunning(true);
    setError(null);
    setProgress(0);
    setStatusText('Initializing assessment...');

    // Simulate progress steps while the API call is in-flight
    const progressSteps = [
      { pct: 0.1, label: 'Registering checks...' },
      { pct: 0.25, label: 'Querying licensing...' },
      { pct: 0.4, label: 'Checking identity & auth...' },
      { pct: 0.55, label: 'Evaluating calendar config...' },
      { pct: 0.65, label: 'Inspecting Conditional Access...' },
      { pct: 0.75, label: 'Analyzing network readiness...' },
      { pct: 0.85, label: 'Reviewing security posture...' },
      { pct: 0.92, label: 'Checking management config...' },
    ];

    let stepIdx = 0;
    const timer = setInterval(() => {
      if (stepIdx < progressSteps.length) {
        setProgress(progressSteps[stepIdx].pct);
        setStatusText(progressSteps[stepIdx].label);
        stepIdx++;
      }
    }, 600);

    try {
      const queryParam = demoMode ? '?demo=true' : '';
      const res = await fetch(`/api/assessment${queryParam}`, { method: 'POST' });

      clearInterval(timer);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed with status ${res.status}`);
      }

      const assessment = await res.json();

      setProgress(1);
      setStatusText('Assessment complete!');

      // Short delay to show 100% before redirecting
      setTimeout(() => {
        router.push(`/assessment/${assessment.id}`);
      }, 800);
    } catch (err) {
      clearInterval(timer);
      setRunning(false);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  }

  return (
    <div className={styles.container}>
      <Title1 as="h1">Run Assessment</Title1>
      <Text size={300} className={styles.subtitle}>
        Evaluate your Microsoft 365 tenant configuration for Teams Rooms readiness.
      </Text>

      <Card className={styles.card}>
        <CardHeader
          image={<ClipboardTask24Regular />}
          header={<Title3>New Assessment</Title3>}
          description={
            <Text size={200}>
              This will run all registered checks against your tenant via Microsoft Graph
              and combine results with any uploaded PowerShell data.
            </Text>
          }
        />

        <div className={styles.controls}>
          <Button
            appearance="primary"
            icon={running ? undefined : <Play24Filled />}
            size="large"
            disabled={running}
            onClick={startAssessment}
          >
            {running ? 'Running...' : 'Start Assessment'}
          </Button>

          <Switch
            label="Demo mode"
            checked={demoMode}
            onChange={(_, data) => setDemoMode(data.checked)}
            disabled={running}
          />
        </div>

        {demoMode && !running && (
          <MessageBar intent="info" style={{ marginTop: '16px' }}>
            <MessageBarBody>
              <MessageBarTitle>Demo Mode</MessageBarTitle>
              Sample results will be generated without connecting to Azure AD. Toggle off to
              run against your real tenant.
            </MessageBarBody>
          </MessageBar>
        )}

        {running && (
          <div className={styles.progressSection}>
            <div className={styles.progressLabel}>
              <Text size={200}>{statusText}</Text>
              <Text size={200} weight="semibold">
                {Math.round(progress * 100)}%
              </Text>
            </div>
            <ProgressBar value={progress} />
          </div>
        )}

        {progress === 1 && (
          <MessageBar intent="success" style={{ marginTop: '16px' }}>
            <MessageBarBody>
              <MessageBarTitle>Complete</MessageBarTitle>
              Redirecting to results...
            </MessageBarBody>
          </MessageBar>
        )}

        {error && (
          <MessageBar intent="error" className={styles.error}>
            <MessageBarBody>
              <MessageBarTitle>Error</MessageBarTitle>
              {error}
            </MessageBarBody>
          </MessageBar>
        )}
      </Card>
    </div>
  );
}
