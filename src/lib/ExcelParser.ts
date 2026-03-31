// ============================================================
// lib/ExcelParser.ts
// Fetches a Blob URL, parses all sheets, merges into one JSON
// ============================================================

import * as XLSX from 'xlsx';

export interface InventoryRow {
  [key: string]: string | number | boolean | null;
}

export interface ParseResult {
  data: InventoryRow[];
  sheets: string[];
  totalRows: number;
  columns: string[];
}

/**
 * Normalizes a header string: trims, lowercases, replaces spaces with underscores.
 */
function normalizeKey(raw: string): string {
  return String(raw).trim().replace(/\s+/g, '_').toLowerCase();
}

/**
 * Infers numeric or string value from a raw cell value.
 */
function coerceValue(val: unknown): string | number | boolean | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  const num = Number(val);
  if (!isNaN(num) && String(val).trim() !== '') return num;
  return String(val).trim();
}

/**
 * Main parser: fetches file from a URL, parses all sheets,
 * and merges all rows into a single unified array.
 *
 * @param blobUrl  The Vercel Blob URL (or any accessible URL) of the xlsx/csv file
 */
export async function parseExcelFromUrl(blobUrl: string): Promise<ParseResult> {
  // 1. Fetch file as ArrayBuffer
  const res = await fetch(blobUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();

  // 2. Parse workbook
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    dateNF: 'yyyy-mm-dd',
  });

  const allRows: InventoryRow[] = [];
  const sheetNames = workbook.SheetNames;
  const allColumnsSet = new Set<string>();

  // 3. Iterate every sheet and merge rows
  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];

    // sheet_to_json returns raw rows with header row as keys
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      blankrows: false,
    });

    for (const rawRow of rawRows) {
      const normalizedRow: InventoryRow = {
        _sheet: sheetName, // track which sheet the row came from
      };

      for (const [key, val] of Object.entries(rawRow)) {
        const nk = normalizeKey(key);
        normalizedRow[nk] = coerceValue(val);
        allColumnsSet.add(nk);
      }

      allRows.push(normalizedRow);
    }
  }

  // 4. Derive unique, ordered column list (exclude internal _sheet key for display)
  const columns = Array.from(allColumnsSet);

  return {
    data: allRows,
    sheets: sheetNames,
    totalRows: allRows.length,
    columns,
  };
}

/**
 * Converts an array of objects to a CSV string.
 * Handles commas, quotes, and newlines inside values.
 */
export function toCSV(rows: InventoryRow[], columns: string[]): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const header = columns.map(escape).join(',');
  const body = rows
    .map((row) => columns.map((col) => escape(row[col])).join(','))
    .join('\n');

  return `${header}\n${body}`;
}
