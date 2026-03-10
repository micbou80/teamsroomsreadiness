'use client';

import {
  makeStyles,
  tokens,
  Text,
  Button,
} from '@fluentui/react-components';
import {
  Home24Regular,
  ClipboardTask24Regular,
  History24Regular,
  ArrowUpload24Regular,
  Globe24Regular,
  Settings24Regular,
  Shield24Regular,
} from '@fluentui/react-icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const useStyles = makeStyles({
  sidebar: {
    width: '260px',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
  },
  logo: {
    padding: '8px 20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '0 8px',
  },
  navItem: {
    justifyContent: 'flex-start',
    padding: '10px 12px',
    borderRadius: tokens.borderRadiusMedium,
    minHeight: '40px',
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground2,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  navItemActive: {
    backgroundColor: tokens.colorNeutralBackground2Selected,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
});

const navItems = [
  { href: '/', label: 'Dashboard', icon: <Home24Regular /> },
  { href: '/assessment', label: 'Run Assessment', icon: <ClipboardTask24Regular /> },
  { href: '/history', label: 'History', icon: <History24Regular /> },
  { href: '/upload', label: 'Upload PS Results', icon: <ArrowUpload24Regular /> },
  { href: '/sites', label: 'Sites', icon: <Globe24Regular /> },
  { href: '/settings', label: 'Settings', icon: <Settings24Regular /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const styles = useStyles();

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>
        <Shield24Regular />
        <Text weight="semibold" size={400}>
          MTR Readiness
        </Text>
      </div>
      <div className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              as="a"
              href={item.href}
              appearance="subtle"
              icon={item.icon}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              {item.label}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
