import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySessionToken, hashPassword, COOKIE_NAME } from '@/lib/auth'
import { createClient as createServerClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Verify caller is admin (JWT) or developer (Supabase Auth)
async function verifyAdminOrDeveloper(request: NextRequest): Promise<{ role: string } | null> {
  // Check JWT cookie (admin/viewer)
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (token) {
    const session = await verifySessionToken(token)
    if (session && session.role === 'admin') return { role: 'admin' }
  }

  // Check Supabase Auth (developer)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'developer') return { role: 'developer' }
  }

  return null
}

// GET — list accounts
export async function GET(request: NextRequest) {
  const caller = await verifyAdminOrDeveloper(request)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()

  // Developer sees all, admin sees only viewers
  let query = db.from('accounts').select('id, username, display_name, role, created_at, updated_at').order('created_at', { ascending: false })

  if (caller.role === 'admin') {
    query = query.eq('role', 'viewer')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST — create account
export async function POST(request: NextRequest) {
  const caller = await verifyAdminOrDeveloper(request)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { username, password, display_name, role } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: '帳號和密碼為必填' }, { status: 400 })
  }

  // Admin can only create viewers, developer can create admins
  const targetRole = caller.role === 'developer' ? (role || 'admin') : 'viewer'
  if (caller.role === 'admin' && targetRole !== 'viewer') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const password_hash = await hashPassword(password)

  const db = getServiceClient()
  const { data, error } = await db
    .from('accounts')
    .insert({
      username: username.toLowerCase().trim(),
      password_hash,
      display_name: display_name || username,
      role: targetRole,
    })
    .select('id, username, display_name, role, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '帳號已存在' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE — delete account
export async function DELETE(request: NextRequest) {
  const caller = await verifyAdminOrDeveloper(request)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { accountId } = await request.json()
  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })

  const db = getServiceClient()

  // Admin can only delete viewers
  if (caller.role === 'admin') {
    const { data: target } = await db.from('accounts').select('role').eq('id', accountId).single()
    if (target?.role !== 'viewer') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 })
    }
  }

  const { error } = await db.from('accounts').delete().eq('id', accountId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
