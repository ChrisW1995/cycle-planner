'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'

interface AuthUser {
  id: string
  username?: string
  email?: string
  display_name: string
  role: UserRole
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      // 1. Try JWT session (admin/viewer)
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setUser(data)
            setLoading(false)
            return
          }
        }
      } catch {
        // Not a JWT session
      }

      // 2. Try Supabase Auth (developer)
      try {
        const supabase = createClient()
        const { data: { user: supaUser } } = await supabase.auth.getUser()
        if (supaUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supaUser.id)
            .single()

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              display_name: profile.display_name || profile.email,
              role: profile.role as UserRole,
            })
            setLoading(false)
            return
          }
        }
      } catch {
        // Not a Supabase session
      }

      setLoading(false)
    }

    fetchSession()
  }, [])

  const isDeveloper = user?.role === 'developer'
  const isAdmin = user?.role === 'admin' || isDeveloper

  const logout = async () => {
    // Clear JWT cookie
    await fetch('/api/auth/logout', { method: 'POST' })
    // Also sign out Supabase Auth
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    setUser(null)
    window.location.href = '/login'
  }

  return { user, loading, isAdmin, isDeveloper, logout }
}
