'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Title1,
  Text,
  Button,
  Card,
  Divider,
  tokens,
} from '@fluentui/react-components';
import { Shield24Regular, Play24Regular } from '@fluentui/react-icons';
import { signInWithMicrosoft } from './actions';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/assessment';

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
        <form action={signInWithMicrosoft}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button
            type="submit"
            appearance="primary"
            size="large"
          >
            Sign in with Microsoft
          </Button>
        </form>

        <Divider style={{ margin: '24px 0' }}>or</Divider>

        <Button
          appearance="secondary"
          size="large"
          icon={<Play24Regular />}
          onClick={() => router.push('/assessment?demo=true')}
        >
          Try Demo Mode
        </Button>
        <Text
          size={100}
          style={{ display: 'block', marginTop: '8px', color: tokens.colorNeutralForeground4 }}
        >
          Explore the tool with simulated assessment data.
          No sign-in required.
        </Text>

        <Text
          size={100}
          style={{ display: 'block', marginTop: '24px', color: tokens.colorNeutralForeground4 }}
        >
          Microsoft sign-in requires Global Reader or Teams Administrator role.
          Only read-only permissions are requested.
        </Text>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
