// app/api/parse-file/route.ts
// Fetches + parses the Excel/CSV file SERVER-SIDE to avoid 403 CORS issues.
// Must use nodejs runtime — xlsx requires Node.js Buffer APIs (not available in Edge).
export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

function normalizeKey(raw: string): string {
  return String(raw).trim().replace(/\s+/g, '_').toLowerCase();
}

function coerceValue(val: unknown): string | number | boolean | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  const num = Number(val);
  if (!isNaN(num) && String(val).trim() !== '') return num;
  return String(val).trim();
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // Fetch from Vercel Blob server-side (no CORS restriction)
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      dateNF: 'yyyy-mm-dd',
    });

    const allRows: Record<string, unknown>[] = [];
    const sheetNames = workbook.SheetNames;
    const allColumnsSet = new Set<string>();

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null,
        blankrows: false,
      });

      for (const rawRow of rawRows) {
        const normalizedRow: Record<string, unknown> = { _sheet: sheetName };
        for (const [key, val] of Object.entries(rawRow)) {
          const nk = normalizeKey(key);
          normalizedRow[nk] = coerceValue(val);
          allColumnsSet.add(nk);
        }
        allRows.push(normalizedRow);
      }
    }

    const columns = Array.from(allColumnsSet);

    return NextResponse.json({
      data: allRows,
      sheets: sheetNames,
      totalRows: allRows.length,
      columns,
    });
  } catch (err) {
    console.error('[/api/parse-file]', err);
    const message = err instanceof Error ? err.message : 'Parsing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
