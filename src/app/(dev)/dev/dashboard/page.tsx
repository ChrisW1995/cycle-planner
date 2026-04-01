'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Trash2, LogOut, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Account } from '@/types'

export default function DevDashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)

  // Form state
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')

  // Verify developer
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/dev'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'developer') { router.push('/dev'); return }

      setAuthorized(true)
      setLoading(false)
    }
    check()
  }, [supabase, router])

  const fetchAccounts = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) setAccounts(await res.json())
  }, [])

  useEffect(() => {
    if (authorized) fetchAccounts()
  }, [authorized, fetchAccounts])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, display_name: displayName || username, role: 'admin' }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error('建立失敗', { description: data.error })
      return
    }
    toast.success('Admin 帳號已建立')
    setUsername(''); setDisplayName(''); setPassword('')
    setCreateOpen(false)
    fetchAccounts()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: deleteTarget.id }),
    })
    if (!res.ok) {
      const data = await res.json()
      toast.error('刪除失敗', { description: data.error })
    } else {
      toast.success('帳號已刪除')
      fetchAccounts()
    }
    setDeleteTarget(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/dev')
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">驗證中...</div>
  }

  const admins = accounts.filter(a => a.role === 'admin')
  const viewers = accounts.filter(a => a.role === 'viewer')

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Developer Console</h1>
            <p className="text-sm text-muted-foreground">管理 Admin 與 Viewer 帳號</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              前往系統
            </Link>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              登出
            </Button>
          </div>
        </div>

        {/* Admin Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Admin 帳號</CardTitle>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              建立 Admin
            </Button>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">尚未建立 Admin 帳號</p>
            ) : (
              <AccountTable accounts={admins} onDelete={setDeleteTarget} />
            )}
          </CardContent>
        </Card>

        {/* Viewer Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Viewer 帳號</CardTitle>
          </CardHeader>
          <CardContent>
            {viewers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">尚未建立 Viewer 帳號</p>
            ) : (
              <AccountTable accounts={viewers} onDelete={setDeleteTarget} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Admin Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>建立 Admin 帳號</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>帳號 *</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="例：admin1" required />
            </div>
            <div className="space-y-2">
              <Label>暱稱</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="選填，預設同帳號" />
            </div>
            <div className="space-y-2">
              <Label>密碼 *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 6 個字元" required minLength={6} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
              <Button type="submit">建立</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>確定要刪除帳號 {deleteTarget?.username} 嗎？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>刪除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AccountTable({ accounts, onDelete }: { accounts: Account[]; onDelete: (a: Account) => void }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>帳號</TableHead>
            <TableHead>暱稱</TableHead>
            <TableHead>建立時間</TableHead>
            <TableHead className="w-16">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.username}</TableCell>
              <TableCell>{a.display_name}</TableCell>
              <TableCell className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString('zh-TW')}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(a)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
