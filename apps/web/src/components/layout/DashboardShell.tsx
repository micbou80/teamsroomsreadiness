'use client';

import { makeStyles, tokens } from '@fluentui/react-components';
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
    backgroundColor: tokens.colorNeutralBackground2,
    minWidth: 0,
  },
  content: {
    flex: 1,
    padding: '28px 36px',
    overflowY: 'auto',
  },
});

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const styles = useStyles();

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
