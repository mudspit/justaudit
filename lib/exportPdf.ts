import { AuditResult } from '@/types/audit';

export function generatePdfData(audit: AuditResult): object {
  // We return structured data that the client will use with jsPDF
  return audit;
}

// This runs client-side
export async function downloadPDF(audit: AuditResult) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  const colors = {
    primary: [37, 99, 235] as [number, number, number],
    dark: [15, 23, 42] as [number, number, number],
    gray: [100, 116, 139] as [number, number, number],
    lightGray: [241, 245, 249] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    green: [22, 163, 74] as [number, number, number],
    yellow: [202, 138, 4] as [number, number, number],
    red: [220, 38, 38] as [number, number, number],
    blue: [37, 99, 235] as [number, number, number],
  };

  function gradeColor(grade: string): [number, number, number] {
    if (grade === 'A') return colors.green;
    if (grade === 'B') return [101, 163, 13];
    if (grade === 'C') return colors.yellow;
    if (grade === 'D') return [234, 88, 12];
    return colors.red;
  }

  function scoreColor(score: number): [number, number, number] {
    if (score >= 90) return colors.green;
    if (score >= 75) return [101, 163, 13];
    if (score >= 60) return colors.yellow;
    if (score >= 45) return [234, 88, 12];
    return colors.red;
  }

  function addPage() {
    doc.addPage();
    y = 20;
  }

  function checkY(needed: number) {
    if (y + needed > 275) addPage();
  }

  // ── Header ──
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageW, 45, 'F');
  doc.setTextColor(...colors.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Website Audit Report', margin, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(audit.url, margin, 30);
  doc.text(`Audited: ${new Date(audit.auditDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 38);
  y = 60;

  // ── Overall Score ──
  doc.setTextColor(...colors.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Performance', margin, y);
  y += 8;

  const scoreBoxW = (pageW - margin * 2 - 9) / 4;
  const categories = [
    { label: 'Overall', score: audit.overallScore.score, grade: audit.overallScore.grade },
    { label: 'SEO', score: audit.seo.score.score, grade: audit.seo.score.grade },
    { label: 'AEO', score: audit.aeo.score.score, grade: audit.aeo.score.grade },
    { label: 'GEO', score: audit.geo.score.score, grade: audit.geo.score.grade },
  ];

  categories.forEach((cat, i) => {
    const x = margin + i * (scoreBoxW + 3);
    doc.setFillColor(...colors.lightGray);
    doc.roundedRect(x, y, scoreBoxW, 28, 3, 3, 'F');
    doc.setTextColor(...gradeColor(cat.grade));
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`${cat.score}`, x + scoreBoxW / 2, y + 14, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(...colors.gray);
    doc.setFont('helvetica', 'normal');
    doc.text(cat.label, x + scoreBoxW / 2, y + 22, { align: 'center' });
    doc.setTextColor(...gradeColor(cat.grade));
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grade: ${cat.grade}`, x + scoreBoxW / 2, y + 27, { align: 'center' });
  });
  y += 40;

  // ── Section builder ──
  function addSection(title: string, issues: AuditResult['seo']['issues']) {
    checkY(20);
    doc.setFillColor(...colors.primary);
    doc.rect(margin, y, pageW - margin * 2, 8, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, y + 5.5);
    y += 14;

    const tableData = issues.map(issue => [
      issue.type.toUpperCase(),
      issue.title,
      issue.impact.toUpperCase(),
      issue.recommendation || '—',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Status', 'Finding', 'Impact', 'Recommendation']],
      body: tableData,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: colors.dark, textColor: colors.white, fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: colors.dark },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 80 },
      },
      didParseCell: (data) => {
        if (data.column.index === 0 && data.section === 'body') {
          const val = String(data.cell.raw);
          if (val === 'ERROR') data.cell.styles.textColor = colors.red;
          else if (val === 'WARNING') data.cell.styles.textColor = colors.yellow;
          else if (val === 'PASS') data.cell.styles.textColor = colors.green;
          else data.cell.styles.textColor = colors.blue;
        }
        if (data.column.index === 2 && data.section === 'body') {
          const val = String(data.cell.raw);
          if (val === 'HIGH') data.cell.styles.textColor = colors.red;
          else if (val === 'MEDIUM') data.cell.styles.textColor = colors.yellow;
          else data.cell.styles.textColor = colors.green;
        }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  addSection('SEO Analysis', audit.seo.issues);
  checkY(10);
  addSection('AEO — Answer Engine Optimization', audit.aeo.issues);
  checkY(10);
  addSection('GEO — Generative Engine Optimization', audit.geo.issues);

  // ── Page Speed ──
  if (audit.pageSpeed) {
    checkY(50);
    doc.setFillColor(...colors.primary);
    doc.rect(margin, y, pageW - margin * 2, 8, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Core Web Vitals & Performance', margin + 3, y + 5.5);
    y += 14;

    const ps = audit.pageSpeed;
    const vitals = [
      ['Performance Score', `${ps.performanceScore}/100`],
      ['Accessibility Score', `${ps.accessibilityScore}/100`],
      ['Best Practices', `${ps.bestPracticesScore}/100`],
      ['SEO Score (Lighthouse)', `${ps.seoScore}/100`],
      ['LCP (Largest Contentful Paint)', ps.lcp ? `${(ps.lcp / 1000).toFixed(2)}s` : 'N/A'],
      ['FCP (First Contentful Paint)', ps.fcp ? `${(ps.fcp / 1000).toFixed(2)}s` : 'N/A'],
      ['CLS (Cumulative Layout Shift)', ps.cls !== null ? `${ps.cls.toFixed(3)}` : 'N/A'],
      ['TTFB (Time to First Byte)', ps.ttfb ? `${Math.round(ps.ttfb)}ms` : 'N/A'],
    ];

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: vitals,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: colors.dark, textColor: colors.white, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 60, halign: 'center' } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...colors.gray);
    doc.text(`Page ${i} of ${pageCount}  •  Generated by WebAudit Pro  •  ${audit.url}`, pageW / 2, 290, { align: 'center' });
  }

  doc.save(`audit-${new URL(audit.url).hostname}-${Date.now()}.pdf`);
}
