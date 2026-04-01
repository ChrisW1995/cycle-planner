import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: '帳號和密碼為必填' }, { status: 400 })
  }

  // Query accounts table directly with service role (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: account, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('username', username.toLowerCase().trim())
    .single()

  if (error || !account) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 })
  }

  const valid = await verifyPassword(password, account.password_hash)
  if (!valid) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 })
  }

  // Create JWT
  const token = await createSessionToken({
    sub: account.id,
    username: account.username,
    display_name: account.display_name,
    role: account.role,
  })

  const response = NextResponse.json({
    id: account.id,
    username: account.username,
    display_name: account.display_name,
    role: account.role,
  })

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  return response
}
