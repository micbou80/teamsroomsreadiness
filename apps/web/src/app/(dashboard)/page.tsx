'use client';

import {
  Title1,
  Text,
  Card,
  CardHeader,
  makeStyles,
  tokens,
  Button,
} from '@fluentui/react-components';
import { ClipboardTask24Regular } from '@fluentui/react-icons';

export default function DashboardHome() {
  return (
    <div>
      <Title1 as="h1">Teams Rooms Readiness</Title1>
      <Text
        size={300}
        style={{ display: 'block', marginTop: '8px', color: tokens.colorNeutralForeground3 }}
      >
        Assess your Microsoft 365 tenant configuration for Teams Rooms deployment
      </Text>

      <Card
        style={{ marginTop: '32px', maxWidth: '600px', padding: '32px', textAlign: 'center' }}
      >
        <CardHeader
          header={<Text weight="semibold" size={400}>No assessments yet</Text>}
          description={
            <Text size={200}>
              Run your first assessment to check licensing, identity, Conditional Access,
              network readiness, and more.
            </Text>
          }
        />
        <Button
          as="a"
          href="/assessment"
          appearance="primary"
          icon={<ClipboardTask24Regular />}
          size="large"
          style={{ marginTop: '16px' }}
        >
          Run Assessment
        </Button>
      </Card>
    </div>
  );
}
