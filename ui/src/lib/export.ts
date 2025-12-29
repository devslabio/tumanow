import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(
  data: any[],
  columns: ExportColumn[],
  filename: string = 'export'
) {
  // Convert data to CSV format
  const headers = columns.map(col => col.label);
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      if (col.format) {
        return col.format(value);
      }
      // Handle nested values
      if (value && typeof value === 'object') {
        return JSON.stringify(value);
      }
      return value ?? '';
    })
  );

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape commas and quotes in CSV
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export data to Excel format
 */
export function exportToExcel(
  data: any[],
  columns: ExportColumn[],
  filename: string = 'export',
  sheetName: string = 'Sheet1'
) {
  // Prepare data for Excel
  const headers = columns.map(col => col.label);
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      if (col.format) {
        return col.format(value);
      }
      // Handle nested values
      if (value && typeof value === 'object') {
        if (value.name) return value.name;
        if (value.code) return value.code;
        return JSON.stringify(value);
      }
      return value ?? '';
    })
  );

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Set column widths
  const colWidths = columns.map(() => ({ wch: 15 }));
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export data with format options
 */
export function exportData(
  data: any[],
  columns: ExportColumn[],
  format: 'CSV' | 'EXCEL' = 'EXCEL',
  filename: string = 'export'
) {
  if (format === 'CSV') {
    exportToCSV(data, columns, filename);
  } else {
    exportToExcel(data, columns, filename);
  }
}

