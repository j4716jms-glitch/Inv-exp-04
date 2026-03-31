// app/api/list-files/route.ts
import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const { blobs } = await list();

    // Filter to only spreadsheet files
    const spreadsheets = blobs.filter((b) =>
      /\.(xlsx|xls|csv)(\?|$)/i.test(b.pathname)
    );

    const files = spreadsheets.map((b) => ({
      url: b.url,
      downloadUrl: b.downloadUrl,
      pathname: b.pathname,
      size: b.size,
      uploadedAt: b.uploadedAt,
    }));

    return NextResponse.json({ files });
  } catch (err) {
    console.error('[/api/list-files]', err);
    return NextResponse.json(
      { error: 'Could not list files' },
      { status: 500 }
    );
  }
}
