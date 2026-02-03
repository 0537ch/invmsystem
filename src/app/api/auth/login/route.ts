import { NextRequest, NextResponse } from 'next/server';
import { getDb, type User } from '@/lib/db';
import { authenticateWithCompanyAPI } from '@/lib/company-auth';
import { createToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    let companyAuthResponse;
    try {
      companyAuthResponse = await authenticateWithCompanyAPI(username, password);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const db = getDb();
    const user = await db<User[]>`
      SELECT * FROM users WHERE username = ${username} AND active = true
    `;

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: 'User not found in local database' },
        { status: 401 }
      );
    }

    const token = createToken({
      userId: user[0].id,
      username: user[0].username,
      name: user[0].name,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user[0].id,
          username: user[0].username,
          name: user[0].name,
        },
      },
      {
        headers: {
          'Set-Cookie': `auth-token=${token}; HttpOnly; Path=/; SameSite=lax; Max-Age=${60 * 60 * 24 * 7}`,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
