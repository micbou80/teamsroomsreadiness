'use client';

import {
  makeStyles,
  tokens,
  Text,
  Avatar,
  Button,
} from '@fluentui/react-components';
import { SignOut24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  topbar: {
    height: '56px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
});

interface TopBarProps {
  tenantName?: string;
  userName?: string;
}

export function TopBar({ tenantName, userName }: TopBarProps) {
  const styles = useStyles();

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {tenantName && (
          <Text size={300} weight="semibold">
            {tenantName}
          </Text>
        )}
      </div>
      <div className={styles.right}>
        {userName && (
          <>
            <Avatar name={userName} size={32} />
            <Text size={200}>{userName}</Text>
          </>
        )}
        <Button
          as="a"
          href="/api/auth/signout"
          appearance="subtle"
          icon={<SignOut24Regular />}
          size="small"
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
