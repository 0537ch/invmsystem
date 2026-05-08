import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import type { TokenPayload } from '@/types';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const payload = verifyToken(token) as TokenPayload | null;

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: payload.userId,
      username: payload.username,
      name: payload.name,
    },
  });
}
