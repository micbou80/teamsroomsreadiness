import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { CategoryResult } from '@/checks/types';

// Dynamic import to keep jsPDF server-only
async function generatePDF(
  assessment: { id: string; overallScore: number; overallStatus: string; createdAt: Date; metadata: string },
  categories: CategoryResult[],
) {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF();
  const meta = JSON.parse(assessment.metadata);

  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 120, 212); // Fluent blue
  doc.text('Teams Rooms Readiness Report', 14, 22);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(97, 97, 97);
  doc.text(`Assessment ID: ${assessment.id}`, 14, 30);
  doc.text(`Generated: ${assessment.createdAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`, 14, 36);
  if (meta.tenantDisplayName) {
    doc.text(`Tenant: ${meta.tenantDisplayName}`, 14, 42);
  }

  // Overall score
  doc.setFontSize(14);
  doc.setTextColor(36, 36, 36);
  doc.text(`Overall Score: ${assessment.overallScore}/100`, 14, 54);

  const statusColor = getStatusColor(assessment.overallStatus);
  doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
  doc.text(`Status: ${assessment.overallStatus.toUpperCase()}`, 100, 54);

  // Category summary table
  let yPos = 64;
  doc.setFontSize(12);
  doc.setTextColor(36, 36, 36);
  doc.text('Category Summary', 14, yPos);
  yPos += 4;

  const summaryData = categories.map((cat) => {
    const passed = cat.checks.filter((c) => c.status === 'pass').length;
    const failed = cat.checks.filter((c) => c.status === 'fail').length;
    const warnings = cat.checks.filter((c) => c.status === 'warning').length;
    return [cat.name, `${cat.score}/100`, String(passed), String(failed), String(warnings), cat.status];
  });

  (doc as any).autoTable({
    startY: yPos,
    head: [['Category', 'Score', 'Passed', 'Failed', 'Warnings', 'Status']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [0, 120, 212], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: 14 },
  });

  // Detailed results per category
  for (const cat of categories) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0, 120, 212);
    doc.text(`${cat.name} (${cat.score}/100)`, 14, 20);

    const checkData = cat.checks.map((check) => [
      check.name,
      check.status,
      check.severity,
      check.details.slice(0, 120) + (check.details.length > 120 ? '...' : ''),
      check.source,
    ]);

    (doc as any).autoTable({
      startY: 28,
      head: [['Check', 'Status', 'Severity', 'Details', 'Source']],
      body: checkData,
      theme: 'grid',
      headStyles: { fillColor: [0, 120, 212], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 85 },
        4: { cellWidth: 20, halign: 'center' },
      },
      margin: { left: 14 },
      didParseCell: (data: any) => {
        if (data.column.index === 1 && data.section === 'body') {
          const status = data.cell.raw as string;
          if (status === 'pass') data.cell.styles.textColor = [16, 124, 16];
          else if (status === 'fail') data.cell.styles.textColor = [209, 52, 56];
          else if (status === 'warning') data.cell.styles.textColor = [202, 80, 16];
        }
      },
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(161, 159, 157);
    doc.text(
      `Teams Rooms Readiness Assessment — Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10,
    );
  }

  return Buffer.from(doc.output('arraybuffer'));
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pass':
      return { r: 16, g: 124, b: 16 };
    case 'fail':
      return { r: 209, g: 52, b: 56 };
    case 'warning':
      return { r: 202, g: 80, b: 16 };
    default:
      return { r: 36, g: 36, b: 36 };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assessmentId = searchParams.get('id');
  const isDemo = searchParams.get('demo') === 'true';

  if (!assessmentId) {
    return NextResponse.json({ error: 'Assessment ID required.' }, { status: 400 });
  }

  let tenantId: string;
  if (isDemo) {
    tenantId = 'demo-tenant-00000000';
  } else {
    const session = await auth();
    if (!session?.tenantId) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    tenantId = session.tenantId;
  }

  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, tenantId },
  });

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
  }

  const categories: CategoryResult[] = JSON.parse(assessment.results);
  const pdfBuffer = await generatePDF(assessment, categories);

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="mtr-readiness-${assessmentId.slice(0, 8)}.pdf"`,
    },
  });
}
