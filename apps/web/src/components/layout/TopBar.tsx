'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  makeStyles,
  tokens,
  Avatar,
  Button,
} from '@fluentui/react-components';
import { Person24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  topbar: {
    height: '60px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 32px',
    backgroundColor: '#ffffff',
    flexShrink: 0,
    gap: '16px',
  },
  profileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: '8px',
    transition: 'background-color 120ms',
    '&:hover': {
      backgroundColor: '#f5f6fa',
    },
  },
  textStack: {
    textAlign: 'right' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  helloText: {
    fontSize: '11px',
    color: '#9b9bab',
    lineHeight: '1.2',
    fontWeight: '400',
  },
  nameText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
    lineHeight: '1.2',
  },
  signInBtn: {
    fontSize: '13px',
  },
});

interface SessionData {
  name: string | null;
  email: string | null;
}

export function TopBar() {
  const styles = useStyles();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const [session, setSession] = useState<SessionData>({ name: null, email: null });

  useEffect(() => {
    if (isDemo) {
      setSession({ name: 'Demo User', email: 'demo@contoso.com' });
      return;
    }
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setSession({ name: data.user.name ?? null, email: data.user.email ?? null });
        }
      })
      .catch(() => {});
  }, [isDemo]);

  const profileHref = isDemo ? '/profile?demo=true' : '/profile';

  return (
    <header className={styles.topbar}>
      {session.name ? (
        <a href={profileHref} className={styles.profileLink}>
          <div className={styles.textStack}>
            <span className={styles.helloText}>Hello</span>
            <span className={styles.nameText}>{session.name}</span>
          </div>
          <Avatar name={session.name} size={32} color="brand" />
        </a>
      ) : (
        <Button
          as="a"
          href="/login"
          appearance="subtle"
          icon={<Person24Regular />}
          size="small"
          className={styles.signInBtn}
        >
          Sign in
        </Button>
      )}
    </header>
  );
}
