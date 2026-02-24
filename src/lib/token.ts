import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const COOKIE_NAME = 'auth-token'

export async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value || null
}

export function setTokenCookie(response: NextResponse, token: string, expiresIn: number): NextResponse {
  const expires = new Date()
  expires.setTime(expires.getTime() + expiresIn * 1000)

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/'
  })

  return response
}

export function clearTokenCookie(): NextResponse {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(COOKIE_NAME)
  return response
}

export async function verifyToken(token: string): Promise<boolean> {
  const tokenEndpoint = process.env.TOKEN_ENDPOINT

  if (!tokenEndpoint) {
    return false
  }

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    return response.ok
  } catch (error) {
    return false
  }
}
