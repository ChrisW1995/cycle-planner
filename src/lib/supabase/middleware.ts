import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Public paths — always accessible
  if (
    pathname.startsWith('/login') ||
    pathname === '/dev' ||
    pathname.startsWith('/api/auth')
  ) {
    return supabaseResponse
  }

  // Redirect /signup to /login
  if (pathname.startsWith('/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Developer dashboard — requires Supabase Auth (developer role)
  if (pathname.startsWith('/dev/dashboard')) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dev'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // API routes (non-auth) — let them handle their own auth
  if (pathname.startsWith('/api')) {
    return supabaseResponse
  }

  // All other routes — require JWT session (admin/viewer) OR Supabase Auth (developer)
  const jwtToken = request.cookies.get(COOKIE_NAME)?.value
  const jwtSession = jwtToken ? await verifySessionToken(jwtToken) : null

  if (jwtSession) {
    return supabaseResponse
  }

  // Check Supabase Auth (developer accessing main app)
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    return supabaseResponse
  }

  // Not authenticated — redirect to login
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}
