'use client';

import { makeStyles } from '@fluentui/react-components';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const useStyles = makeStyles({
  shell: {
    display: 'flex',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
});

interface DashboardShellProps {
  children: React.ReactNode;
  tenantName?: string;
  userName?: string;
}

export function DashboardShell({ children, tenantName, userName }: DashboardShellProps) {
  const styles = useStyles();

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar tenantName={tenantName} userName={userName} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
