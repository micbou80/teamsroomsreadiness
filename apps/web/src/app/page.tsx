'use client';

import {
  Title1,
  Subtitle1,
  Text,
  Button,
  Card,
  CardHeader,
  tokens,
} from '@fluentui/react-components';
import {
  Shield24Regular,
  Certificate24Regular,
  Person24Regular,
  Calendar24Regular,
  ShieldLock24Regular,
  Globe24Regular,
  Desktop24Regular,
  LockClosed24Regular,
  Settings24Regular,
  Call24Regular,
} from '@fluentui/react-icons';

const categories = [
  { icon: <Certificate24Regular />, name: 'Licensing', desc: '5 checks' },
  { icon: <Person24Regular />, name: 'Identity & Auth', desc: '6 checks' },
  { icon: <Calendar24Regular />, name: 'Calendar', desc: '5 checks' },
  { icon: <ShieldLock24Regular />, name: 'Conditional Access', desc: '4 checks' },
  { icon: <Globe24Regular />, name: 'Network', desc: '6 checks' },
  { icon: <Desktop24Regular />, name: 'Platform', desc: '4 checks' },
  { icon: <LockClosed24Regular />, name: 'Security', desc: '4 checks' },
  { icon: <Settings24Regular />, name: 'Management', desc: '3 checks' },
  { icon: <Call24Regular />, name: 'Voice / PSTN', desc: '3 checks' },
];

export default function LandingPage() {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '64px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <Shield24Regular style={{ fontSize: '56px', color: tokens.colorBrandForeground1 }} />
        <Title1 as="h1" style={{ display: 'block', marginTop: '16px' }}>
          Teams Rooms Readiness Assessment
        </Title1>
        <Subtitle1 style={{ display: 'block', marginTop: '8px', color: tokens.colorNeutralForeground3 }}>
          Validate your Microsoft 365 tenant configuration before deploying Teams Rooms
        </Subtitle1>
        <Button
          as="a"
          href="/login"
          appearance="primary"
          size="large"
          style={{ marginTop: '24px' }}
        >
          Get Started
        </Button>
      </div>

      <Text weight="semibold" size={500} style={{ display: 'block', marginBottom: '16px' }}>
        40 checks across 9 categories
      </Text>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {categories.map((cat) => (
          <Card key={cat.name} size="small">
            <CardHeader
              image={cat.icon}
              header={<Text weight="semibold">{cat.name}</Text>}
              description={<Text size={200}>{cat.desc}</Text>}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
