'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Account } from '@/types'

export default function AdminUsersPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)

  // Form
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!authLoading && !isAdmin) { router.push('/'); return }
    if (!authLoading && isAdmin) fetchUsers()
  }, [authLoading, isAdmin, router, fetchUsers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, display_name: displayName || username, role: 'viewer' }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error('建立失敗', { description: data.error })
      return
    }
    toast.success('Viewer 帳號已建立')
    setUsername(''); setDisplayName(''); setPassword('')
    setCreateOpen(false)
    fetchUsers()
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
      fetchUsers()
    }
    setDeleteTarget(null)
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">載入中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">帳號管理</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          建立 Viewer
        </Button>
      </div>

      {users.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">尚未建立 Viewer 帳號</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>帳號</TableHead>
                <TableHead>暱稱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>建立時間</TableHead>
                <TableHead className="w-16">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.display_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Viewer</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('zh-TW')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(user)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Viewer Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>建立 Viewer 帳號</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>帳號 *</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="例：viewer1" required />
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
