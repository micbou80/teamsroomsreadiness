'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Title1,
  Title3,
  Text,
  Card,
  Button,
  Divider,
  makeStyles,
  tokens,
  Spinner,
} from '@fluentui/react-components';
import {
  Person24Regular,
  Building24Regular,
  SignOut24Regular,
  Shield24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    maxWidth: '600px',
  },
  subtitle: {
    display: 'block',
    marginTop: '8px',
    color: tokens.colorNeutralForeground3,
  },
  card: {
    marginTop: '24px',
    padding: '32px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
  },
  label: {
    color: tokens.colorNeutralForeground3,
    minWidth: '120px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
});

interface ProfileData {
  name?: string;
  email?: string;
  tenantId?: string;
  isDemo: boolean;
}

export default function ProfilePage() {
  const styles = useStyles();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setProfile({
        name: 'Demo User',
        email: 'demo@contoso.com',
        tenantId: 'demo-tenant-00000000',
        isDemo: true,
      });
      setLoading(false);
      return;
    }

    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((session) => {
        if (session?.user) {
          setProfile({
            name: session.user.name ?? 'Unknown',
            email: session.user.email ?? 'Unknown',
            tenantId: session.tenantId ?? 'Unknown',
            isDemo: false,
          });
        } else {
          setProfile(null);
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [isDemo]);

  return (
    <div className={styles.container}>
      <Title1 as="h1">Profile</Title1>
      <Text size={300} className={styles.subtitle}>
        Your account and tenant information.
      </Text>

      <Card className={styles.card}>
        {loading ? (
          <Spinner label="Loading profile..." />
        ) : profile ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Person24Regular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
              <Title3>{profile.name}</Title3>
            </div>
            <Divider />
            <div className={styles.row}>
              <Text size={200} className={styles.label}>Email</Text>
              <Text size={200}>{profile.email}</Text>
            </div>
            <div className={styles.row}>
              <Text size={200} className={styles.label}>Tenant ID</Text>
              <Text size={200} style={{ fontFamily: 'monospace' }}>{profile.tenantId}</Text>
            </div>
            <div className={styles.row}>
              <Text size={200} className={styles.label}>Permissions</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield24Regular style={{ fontSize: '16px', color: tokens.colorStatusSuccessForeground1 }} />
                <Text size={200}>Read-only (delegated)</Text>
              </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div className={styles.actions}>
              {!profile.isDemo && (
                <form action="/api/auth/signout" method="POST">
                  <Button
                    type="submit"
                    appearance="secondary"
                    icon={<SignOut24Regular />}
                  >
                    Sign Out
                  </Button>
                </form>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Person24Regular style={{ fontSize: '24px', color: tokens.colorNeutralForeground3 }} />
              <Text size={300}>Not signed in</Text>
            </div>
            <div className={styles.actions}>
              <Button
                as="a"
                href="/login"
                appearance="primary"
              >
                Sign in with Microsoft
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
