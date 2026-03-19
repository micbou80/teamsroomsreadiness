'use client';

import {
  Title1,
  Text,
  Button,
  Card,
  tokens,
} from '@fluentui/react-components';
import { Shield24Regular } from '@fluentui/react-icons';

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.colorNeutralBackground2,
      }}
    >
      <Card style={{ maxWidth: '440px', padding: '48px', textAlign: 'center' }}>
        <Shield24Regular style={{ fontSize: '48px', marginBottom: '16px' }} />
        <Title1>Teams Rooms Readiness</Title1>
        <Text
          size={300}
          style={{ display: 'block', margin: '12px 0 32px', color: tokens.colorNeutralForeground3 }}
        >
          Sign in with your Microsoft 365 admin account to assess your tenant&apos;s
          readiness for Teams Rooms deployment.
        </Text>
        <Button
          appearance="primary"
          size="large"
          onClick={() => import('next-auth/react').then(({ signIn }) => signIn('microsoft-entra-id', { callbackUrl: '/assessment' }))}
        >
          Sign in with Microsoft
        </Button>
        <Text
          size={100}
          style={{ display: 'block', marginTop: '24px', color: tokens.colorNeutralForeground4 }}
        >
          Requires Global Reader or Teams Administrator role.
          Only read-only permissions are requested.
        </Text>
      </Card>
    </div>
  );
}
