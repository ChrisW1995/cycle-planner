import { NextRequest, NextResponse } from 'next/server'
import { generateAuthenticationOptions, type AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { createClient } from '@supabase/supabase-js'
import { rpID } from '@/lib/webauthn'

export async function POST(request: NextRequest) {
  const { username } = await request.json().catch(() => ({ username: undefined }))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = []

  if (username) {
    // Get account by username
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('username', username.toLowerCase().trim())
      .single()

    if (account) {
      const { data: creds } = await supabase
        .from('webauthn_credentials')
        .select('id, transports')
        .eq('account_id', account.id)

      allowCredentials = creds?.map(c => ({
        id: c.id,
        transports: (c.transports || []) as AuthenticatorTransportFuture[],
      })) || []
    }
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials,
  })

  // Store challenge in cookie
  const response = NextResponse.json(options)
  response.cookies.set('webauthn_challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 300,
  })

  return response
}
