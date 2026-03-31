// app/api/verify-key/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const authorizedUsers = (process.env.AUTHORIZED_USERS ?? '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const valid = authorizedUsers.includes(key.trim());

    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
