import { Suspense } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <DashboardShell>
        {children}
      </DashboardShell>
    </Suspense>
  );
}
