import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SchoolProfile } from '../types';

export interface ExportColumn {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
}

export interface SummaryMetricPair {
  label: string;
  value: string;
}

export interface CsvExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  school: SchoolProfile;
  generatedBy: string;
  summaryMetrics?: SummaryMetricPair[];
  columns: ExportColumn[];
  rows: Record<string, string | number>[];
  includeMetadataHeader?: boolean;
}

export interface PdfExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  school: SchoolProfile;
  generatedBy: string;
  orientation?: 'portrait' | 'landscape';
  summaryMetrics?: SummaryMetricPair[];
  columns: ExportColumn[];
  rows: Record<string, string | number>[];
}

export interface ExecutivePdfSection {
  sectionTitle: string;
  sectionSubtitle?: string;
  columns: ExportColumn[];
  rows: Record<string, string | number>[];
}

export interface ExecutiveMasterPdfOptions {
  filename: string;
  school: SchoolProfile;
  generatedBy: string;
  summaryMetrics: SummaryMetricPair[];
  sections: ExecutivePdfSection[];
}

/**
 * Sanitizes text for standard jsPDF Helvetica (WinAnsi) encoding so currency symbols
 * like GH₵ and extended characters render cleanly without garbled glyphs.
 */
export function sanitizePdfText(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/GH₵/g, 'GHS ')
    .replace(/₵/g, 'GHS ')
    .replace(/[•·]/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/ɛ/g, 'e')
    .replace(/Ɛ/g, 'E')
    .replace(/ɔ/g, 'o')
    .replace(/Ɔ/g, 'O')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Escapes CSV cell values safely, preventing CSV formula injection and handling commas/quotes.
 */
function escapeCsvCell(rawValue: string | number | null | undefined): string {
  if (rawValue === null || rawValue === undefined) return '';
  if (typeof rawValue === 'number') {
    return Number.isFinite(rawValue) ? String(rawValue) : '0';
  }
  let str = String(rawValue).replace(/\r?\n/g, ' ').trim();
  if (/^[=+\-@]/.test(str) && !/^-[0-9]/.test(str) && !/^\+[0-9\s()-]+$/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function buildSafeFilename(schoolCode: string, slug: string, ext: 'csv' | 'pdf' | 'json'): string {
  const cleanCode = (schoolCode || 'school').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const datePart = new Date().toISOString().split('T')[0];
  return `${cleanCode}_${cleanSlug}_${datePart}.${ext}`;
}

export function downloadCsvReport(options: CsvExportOptions): void {
  const {
    filename,
    title,
    subtitle,
    school,
    generatedBy,
    summaryMetrics = [],
    columns,
    rows,
    includeMetadataHeader = true,
  } = options;

  const lines: string[] = [];

  if (includeMetadataHeader) {
    lines.push([escapeCsvCell(school.name), escapeCsvCell(`Code: ${school.code}`), escapeCsvCell(`Region: ${school.region}`)].join(','));
    lines.push([escapeCsvCell(title), escapeCsvCell(subtitle || `${school.currentAcademicYear} - ${school.currentTerm}`)].join(','));
    lines.push([
      escapeCsvCell(`Exported On: ${new Date().toLocaleString()}`),
      escapeCsvCell(`Exported By: ${generatedBy}`),
      escapeCsvCell(`Total Records: ${rows.length}`),
    ].join(','));
    if (summaryMetrics.length > 0) {
      lines.push(summaryMetrics.map((m) => escapeCsvCell(`${m.label}: ${m.value}`)).join(','));
    }
    lines.push('');
  }

  lines.push(columns.map((c) => escapeCsvCell(c.header)).join(','));

  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsvCell(row[c.key])).join(','));
  }

  // Prepend UTF-8 BOM so Microsoft Excel & Google Sheets preserve symbols and accents accurately
  const csvContent = `\uFEFF${lines.join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerBrowserDownload(blob, filename);
}

export function downloadPdfReport(options: PdfExportOptions): void {
  const {
    filename,
    title,
    subtitle,
    school,
    generatedBy,
    orientation = columnsNeedLandscape(options.columns),
    summaryMetrics = [],
    columns,
    rows,
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;

  // Institutional Top Header Band
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 84, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(sanitizePdfText(school.name.toUpperCase()), marginX, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(167, 243, 208); // Emerald-200
  doc.text(
    sanitizePdfText(
      `${school.code}  |  ${school.levelType}  |  ${school.region}  |  ${school.currentAcademicYear} (${school.currentTerm})`
    ),
    marginX,
    46
  );

  doc.setTextColor(203, 213, 225); // Slate-300
  doc.setFontSize(8.5);
  doc.text(
    sanitizePdfText(
      `Address: ${school.address || school.district}  |  Tel: ${school.phone || 'N/A'}  |  Email: ${school.email || 'N/A'}`
    ),
    marginX,
    62
  );

  // Report Title & Generation Metadata
  let cursorY = 108;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(sanitizePdfText(title), marginX, cursorY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const timestampStr = new Date().toLocaleString();
  doc.text(
    sanitizePdfText(`Generated: ${timestampStr}  |  Prepared by: ${generatedBy}`),
    pageWidth - marginX,
    cursorY,
    { align: 'right' }
  );

  if (subtitle) {
    cursorY += 14;
    doc.text(sanitizePdfText(subtitle), marginX, cursorY);
  }

  // Summary Metrics Strip
  if (summaryMetrics.length > 0) {
    cursorY += 14;
    const boxHeight = 38;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, boxHeight, 4, 4, 'FD');

    const colWidth = (pageWidth - marginX * 2) / summaryMetrics.length;
    summaryMetrics.forEach((metric, index) => {
      const cellX = marginX + index * colWidth + 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(sanitizePdfText(metric.label), cellX, cursorY + 14);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(sanitizePdfText(metric.value), cellX, cursorY + 29);
    });

    cursorY += boxHeight + 14;
  } else {
    cursorY += 14;
  }

  const columnStyles: Record<number, { halign: 'left' | 'right' | 'center' }> = {};
  columns.forEach((col, idx) => {
    columnStyles[idx] = { halign: col.align || 'left' };
  });

  if (rows.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 48, 4, 4, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'No records matched the selected filters at the time this report was generated.',
      marginX + 14,
      cursorY + 28
    );
    cursorY += 68;
  } else {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX, bottom: 54 },
      head: [columns.map((c) => sanitizePdfText(c.header))],
      body: rows.map((row) => columns.map((c) => sanitizePdfText(row[c.key]))),
      styles: {
        font: 'helvetica',
        fontSize: columns.length > 7 ? 7.5 : 8.5,
        cellPadding: 5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [6, 95, 70], // Emerald-800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles,
    });

    cursorY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY
      ? ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24)
      : cursorY + 40;
  }

  // Signatory Block on Final Page if space allows
  if (cursorY + 56 < pageHeight - 40) {
    doc.setDrawColor(203, 213, 225);
    doc.line(marginX, cursorY + 24, marginX + 170, cursorY + 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(sanitizePdfText(school.headmasterName || generatedBy), marginX, cursorY + 36);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Institutional Signatory', marginX, cursorY + 47);
  }

  stampPageFooters(doc, school);
  doc.save(filename);
}

export function downloadComprehensiveExecutivePdf(options: ExecutiveMasterPdfOptions): void {
  const { filename, school, generatedBy, summaryMetrics, sections } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 36;

  // Cover / Top Institutional Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 86, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(sanitizePdfText(`${school.name.toUpperCase()} - EXECUTIVE DATA AUDIT & BACKUP`), marginX, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(167, 243, 208);
  doc.text(
    sanitizePdfText(
      `Code: ${school.code}  |  Classification: ${school.levelType}  |  Academic Cycle: ${school.currentAcademicYear} (${school.currentTerm})`
    ),
    marginX,
    49
  );

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8.5);
  doc.text(
    sanitizePdfText(
      `Generated: ${new Date().toLocaleString()}  |  Administrator: ${generatedBy}  |  Head of Institution: ${school.headmasterName}`
    ),
    marginX,
    65
  );

  let cursorY = 104;

  // Executive KPI Strip
  if (summaryMetrics.length > 0) {
    const boxHeight = 40;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, boxHeight, 4, 4, 'FD');

    const colWidth = (pageWidth - marginX * 2) / summaryMetrics.length;
    summaryMetrics.forEach((metric, index) => {
      const cellX = marginX + index * colWidth + 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(sanitizePdfText(metric.label), cellX, cursorY + 14);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(sanitizePdfText(metric.value), cellX, cursorY + 29);
    });

    cursorY += boxHeight + 18;
  }

  sections.forEach((sec) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (cursorY > pageHeight - 110) {
      doc.addPage();
      cursorY = 42;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(sanitizePdfText(`${sec.sectionTitle} (${sec.rows.length} records)`), marginX, cursorY);

    if (sec.sectionSubtitle) {
      cursorY += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(sanitizePdfText(sec.sectionSubtitle), marginX, cursorY);
    }

    cursorY += 8;

    if (sec.rows.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('No records currently registered in this category.', marginX, cursorY + 10);
      cursorY += 26;
      return;
    }

    const columnStyles: Record<number, { halign: 'left' | 'right' | 'center' }> = {};
    sec.columns.forEach((col, idx) => {
      columnStyles[idx] = { halign: col.align || 'left' };
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX, bottom: 48 },
      head: [sec.columns.map((c) => sanitizePdfText(c.header))],
      body: sec.rows.map((row) => sec.columns.map((c) => sanitizePdfText(row[c.key]))),
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 4.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [6, 95, 70],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles,
    });

    cursorY =
      ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || cursorY) + 22;
  });

  stampPageFooters(doc, school);
  doc.save(filename);
}

function columnsNeedLandscape(columns: ExportColumn[]): 'portrait' | 'landscape' {
  return columns.length >= 6 ? 'landscape' : 'portrait';
}

function stampPageFooters(doc: jsPDF, school: SchoolProfile): void {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 32, pageWidth - marginX, pageHeight - 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      sanitizePdfText(`${school.name} (${school.code}) - Official Institutional Data Export`),
      marginX,
      pageHeight - 19
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 19, {
      align: 'right',
    });
  }
}
