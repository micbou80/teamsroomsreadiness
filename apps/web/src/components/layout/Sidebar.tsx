'use client';

import { useEffect, useState } from 'react';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Text,
  Button,
} from '@fluentui/react-components';
import {
  Home24Regular,
  Home24Filled,
  ClipboardTask24Regular,
  ClipboardTask24Filled,
  History24Regular,
  History24Filled,
  QuestionCircle24Regular,
  QuestionCircle24Filled,
  Shield24Regular,
  Play24Filled,
  TaskListSquareLtr24Regular,
  TaskListSquareLtr24Filled,
} from '@fluentui/react-icons';
import { usePathname, useSearchParams } from 'next/navigation';

const useStyles = makeStyles({
  sidebar: {
    width: '252px',
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  logoSection: {
    padding: '22px 20px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    borderBottom: '1px solid #f5f5f5',
    marginBottom: '8px',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: tokens.colorBrandBackground,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '18px',
  },
  logoTexts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  logoName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a1a2e',
    lineHeight: '1.2',
    letterSpacing: '-0.01em',
  },
  logoSub: {
    fontSize: '11px',
    color: '#9b9bab',
    lineHeight: '1.2',
    letterSpacing: '0',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '4px 12px',
    flex: 1,
  },
  navItem: {
    justifyContent: 'flex-start',
    padding: '9px 12px',
    borderRadius: '8px',
    minHeight: '38px',
    fontWeight: '400',
    color: '#6b7280',
    fontSize: '14px',
    '&:hover': {
      backgroundColor: '#f5f6fa',
      color: '#1a1a2e',
    },
  },
  navItemActive: {
    backgroundColor: tokens.colorBrandBackground,
    color: '#ffffff',
    fontWeight: '600',
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      color: '#ffffff',
    },
  },
  bottomSection: {
    padding: '12px 12px 16px',
    borderTop: '1px solid #f5f5f5',
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  demoBadge: {
    display: 'inline-block',
    padding: '1px 7px',
    borderRadius: '4px',
    backgroundColor: '#fef3c7',
    color: '#d97706',
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '0.03em',
    textTransform: 'uppercase' as const,
    marginLeft: '8px',
    verticalAlign: 'middle',
  },
  demoBtn: {
    justifyContent: 'flex-start',
    padding: '9px 12px',
    borderRadius: '8px',
    minHeight: '38px',
    fontWeight: '400',
    color: '#9b9bab',
    fontSize: '13px',
    '&:hover': {
      backgroundColor: '#f5f6fa',
      color: '#6b7280',
    },
  },
});

interface NavItemDef {
  href: string;
  label: string;
  icon: React.ReactElement;
  iconActive: React.ReactElement;
}

const NAV_ITEMS: NavItemDef[] = [
  { href: '/', label: 'Dashboard', icon: <Home24Regular />, iconActive: <Home24Filled /> },
  { href: '/assessment', label: 'Run Assessment', icon: <ClipboardTask24Regular />, iconActive: <ClipboardTask24Filled /> },
  { href: '/action-plan', label: 'Action Plan', icon: <TaskListSquareLtr24Regular />, iconActive: <TaskListSquareLtr24Filled /> },
  { href: '/history', label: 'History', icon: <History24Regular />, iconActive: <History24Filled /> },
  { href: '/help', label: 'Help & First Steps', icon: <QuestionCircle24Regular />, iconActive: <QuestionCircle24Filled /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const styles = useStyles();
  const isDemo = searchParams.get('demo') === 'true';

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logoSection}>
        <div className={styles.logoIcon}>
          <Shield24Regular />
        </div>
        <div className={styles.logoTexts}>
          <span className={styles.logoName}>
            Teams Rooms
            {isDemo && <span className={styles.demoBadge}>Demo</span>}
          </span>
          <span className={styles.logoSub}>Deployment Assessment</span>
        </div>
      </div>

      <div className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isExact = item.href === '/';
          const isActive = isExact
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(item.href + '/');
          const href = isDemo ? `${item.href}?demo=true` : item.href;

          return (
            <Button
              key={item.href}
              as="a"
              href={href}
              appearance="subtle"
              icon={isActive ? item.iconActive : item.icon}
              className={mergeClasses(styles.navItem, isActive && styles.navItemActive)}
            >
              {item.label}
            </Button>
          );
        })}
      </div>

      <div className={styles.bottomSection}>
        {isDemo ? (
          <Button
            as="a"
            href="/assessment"
            appearance="subtle"
            size="small"
            className={styles.demoBtn}
          >
            Exit demo mode
          </Button>
        ) : (
          <Button
            as="a"
            href="/assessment?demo=true"
            appearance="subtle"
            icon={<Play24Filled />}
            size="small"
            className={styles.demoBtn}
          >
            Try demo mode
          </Button>
        )}
      </div>
    </nav>
  );
}
