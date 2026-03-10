import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { CategoryResult } from '@/checks/types';
import ExcelJS from 'exceljs';

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
  const meta = JSON.parse(assessment.metadata);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Teams Rooms Readiness';
  workbook.created = new Date();

  // --- Summary sheet ---
  const summarySheet = workbook.addWorksheet('Summary');

  // Header styling
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0078D4' },
  };
  const headerFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };

  // Assessment info
  summarySheet.mergeCells('A1:F1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'Teams Rooms Readiness Assessment';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF0078D4' } };

  summarySheet.getCell('A3').value = 'Assessment ID:';
  summarySheet.getCell('B3').value = assessment.id;
  summarySheet.getCell('A4').value = 'Date:';
  summarySheet.getCell('B4').value = assessment.createdAt.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  summarySheet.getCell('A5').value = 'Overall Score:';
  summarySheet.getCell('B5').value = `${assessment.overallScore}/100`;
  summarySheet.getCell('B5').font = { bold: true, size: 12 };
  summarySheet.getCell('A6').value = 'Status:';
  summarySheet.getCell('B6').value = assessment.overallStatus.toUpperCase();
  summarySheet.getCell('B6').font = { bold: true, color: { argb: getStatusArgb(assessment.overallStatus) } };

  if (meta.tenantDisplayName) {
    summarySheet.getCell('A7').value = 'Tenant:';
    summarySheet.getCell('B7').value = meta.tenantDisplayName;
  }

  // Category summary table
  const catHeaderRow = summarySheet.addRow([]);
  summarySheet.addRow([]);
  const catHeader = summarySheet.addRow(['Category', 'Score', 'Status', 'Passed', 'Failed', 'Warnings', 'Total']);
  catHeader.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center' };
  });

  for (const cat of categories) {
    const passed = cat.checks.filter((c) => c.status === 'pass').length;
    const failed = cat.checks.filter((c) => c.status === 'fail').length;
    const warnings = cat.checks.filter((c) => c.status === 'warning').length;
    const row = summarySheet.addRow([cat.name, cat.score, cat.status, passed, failed, warnings, cat.checks.length]);
    row.getCell(3).font = { color: { argb: getStatusArgb(cat.status) } };
  }

  summarySheet.columns = [
    { width: 30 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
    { width: 10 },
  ];

  // --- Detail sheets per category ---
  for (const cat of categories) {
    const sheet = workbook.addWorksheet(cat.name.slice(0, 31)); // Excel 31-char limit

    const header = sheet.addRow(['Check', 'Status', 'Severity', 'Source', 'Details', 'Remediation']);
    header.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
    });

    for (const check of cat.checks) {
      const row = sheet.addRow([
        check.name,
        check.status,
        check.severity,
        check.source,
        check.details,
        check.remediation ?? '',
      ]);
      row.getCell(2).font = { color: { argb: getStatusArgb(check.status) } };
    }

    sheet.columns = [
      { width: 30 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 60 },
      { width: 50 },
    ];
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="mtr-readiness-${assessmentId.slice(0, 8)}.xlsx"`,
    },
  });
}

function getStatusArgb(status: string): string {
  switch (status) {
    case 'pass':
      return 'FF107C10';
    case 'fail':
      return 'FFD13438';
    case 'warning':
      return 'FFCA5010';
    default:
      return 'FF242424';
  }
}
