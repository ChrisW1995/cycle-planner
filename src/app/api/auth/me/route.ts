import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json(null, { status: 401 })
  }

  const session = await verifySessionToken(token)
  if (!session) {
    return NextResponse.json(null, { status: 401 })
  }

  return NextResponse.json({
    id: session.sub,
    username: session.username,
    display_name: session.display_name,
    role: session.role,
  })
}
