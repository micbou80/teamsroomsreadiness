'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  makeStyles,
  tokens,
  Text,
  Button,
} from '@fluentui/react-components';
import {
  Play24Filled,
  ArrowRight16Regular,
  Shield24Regular,
  ClipboardTask24Regular,
  Desktop24Regular,
  ArrowUpload24Regular,
  DocumentPdf24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    maxWidth: '800px',
  },
  title: {
    fontSize: '26px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    lineHeight: 1.3,
  },
  subtitle: {
    display: 'block',
    marginTop: '4px',
    marginBottom: '28px',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  card: {
    padding: '24px',
    borderRadius: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: '16px',
  },
  stepRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    padding: '16px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  stepNumber: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontWeight: '700',
    fontSize: tokens.fontSizeBase400,
  },
  stepIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
  },
  faqQuestion: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '4px',
  },
  faqAnswer: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    lineHeight: '1.5',
  },
  faqItem: {
    padding: '14px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
});

export default function HelpPage() {
  const styles = useStyles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const demoQ = isDemo ? '?demo=true' : '';

  const steps = [
    {
      icon: <Shield24Regular />,
      title: 'Sign in with Microsoft',
      description: 'Use your Microsoft 365 admin account (Global Reader or Teams Administrator role). Only read-only permissions are requested.',
    },
    {
      icon: <Desktop24Regular />,
      title: 'Select your device types',
      description: 'Choose which Teams Rooms devices you plan to deploy — Windows, Android, Panels, Phones, Surface Hub, or BYOD. This focuses the assessment on relevant checks.',
    },
    {
      icon: <ClipboardTask24Regular />,
      title: 'Run the assessment',
      description: 'The tool checks your tenant configuration automatically: licensing, identity, calendar, Conditional Access, network, and management settings.',
    },
    {
      icon: <ArrowUpload24Regular />,
      title: 'Complete on-premises checks (optional)',
      description: 'Some checks require Exchange Online PowerShell data. Copy the generated command, run it in PowerShell, and results upload automatically.',
    },
    {
      icon: <DocumentPdf24Regular />,
      title: 'Review & export results',
      description: 'View your readiness score, drill into each category, and export the report as PDF or Excel to share with your team.',
    },
  ];

  const faqs = [
    {
      q: 'What permissions does this tool need?',
      a: 'Only read-only delegated permissions via Microsoft Graph: User.Read.All, Organization.Read.All, Policy.Read.All, Directory.Read.All, MailboxSettings.Read, DeviceManagementManagedDevices.Read.All, and Place.Read.All. No data is modified.',
    },
    {
      q: 'What admin role do I need?',
      a: 'Global Reader or Teams Administrator. These provide read access to the tenant configuration the tool needs to check.',
    },
    {
      q: 'Is my data stored?',
      a: 'Assessment results are stored locally in the app database so you can view history and track improvements. No data is sent to third parties.',
    },
    {
      q: 'Why are some checks marked "pending"?',
      a: 'Pending checks require data from Exchange Online PowerShell (e.g., calendar processing settings). Run the PowerShell command shown in Step 2 to complete them.',
    },
    {
      q: 'Can I try the tool without signing in?',
      a: 'Yes! Use Demo Mode to explore the tool with simulated assessment data. No Microsoft sign-in required.',
    },
  ];

  return (
    <div className={styles.container}>
      <Text className={styles.title}>Help & First Steps</Text>
      <Text className={styles.subtitle}>
        Get started with the Teams Rooms Deployment Assessment Tool.
      </Text>

      {/* Getting Started */}
      <div className={styles.card}>
        <Text className={styles.sectionTitle}>Getting Started</Text>
        {steps.map((step, i) => (
          <div key={i} className={styles.stepRow}>
            <div className={styles.stepNumber}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <Text style={{ fontSize: tokens.fontSizeBase300, fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                {step.title}
              </Text>
              <Text style={{ fontSize: tokens.fontSizeBase300, color: tokens.colorNeutralForeground3, lineHeight: '1.5' }}>
                {step.description}
              </Text>
            </div>
          </div>
        ))}
        <div style={{ marginTop: '20px' }}>
          <Button
            appearance="primary"
            icon={<Play24Filled />}
            size="large"
            onClick={() => router.push(`/assessment${demoQ}`)}
          >
            Run Your First Assessment
          </Button>
        </div>
      </div>

      {/* FAQ */}
      <div className={styles.card}>
        <Text className={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, i) => (
          <div key={i} className={styles.faqItem}>
            <Text className={styles.faqQuestion}>{faq.q}</Text>
            <Text className={styles.faqAnswer}>{faq.a}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}
