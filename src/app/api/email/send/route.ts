import { NextResponse } from 'next/server'
import { getTokenFromCookie } from '@/lib/token'

export async function POST(request: Request) {
  try {
    const emailApiEndpoint = process.env.NEXT_PUBLIC_EMAIL_API_URL

    if (!emailApiEndpoint) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_EMAIL_API_URL is not configured' },
        { status: 500 }
      )
    }

    const token = await getTokenFromCookie()

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const response = await fetch(emailApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(
        errorData,
        { status: response.status }
      )
    }

    const responseData = await response.json()
    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
