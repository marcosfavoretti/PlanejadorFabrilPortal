import { Workbook } from 'exceljs';
import * as FileSaver from 'file-saver';

type ExportRow = Record<string, unknown>;

function normalizeCellValue(value: unknown): string | number | boolean | Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function escapeCsvValue(value: unknown): string {
  const normalized = normalizeCellValue(value);
  const stringValue = normalized instanceof Date ? normalized.toISOString() : String(normalized);
  const escapedValue = stringValue.replace(/"/g, '""');

  return /[",\n\r]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
}

export async function exportRowsToXlsx(rows: ExportRow[], filename: string, sheetName = 'Dados'): Promise<void> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  worksheet.columns = headers.map(header => ({
    header,
    key: header,
    width: Math.max(header.length + 2, 16),
  }));

  rows.forEach(row => {
    const normalizedRow = headers.reduce<Record<string, string | number | boolean | Date>>((acc, header) => {
      acc[header] = normalizeCellValue(row[header]);
      return acc;
    }, {});

    worksheet.addRow(normalizedRow);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  FileSaver.saveAs(blob, filename);
}

export function exportRowsToCsv(rows: ExportRow[], filename: string): void {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const lines = [
    headers.map(header => escapeCsvValue(header)).join(','),
    ...rows.map(row => headers.map(header => escapeCsvValue(row[header])).join(',')),
  ];
  const csv = lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  FileSaver.saveAs(blob, filename);
}
