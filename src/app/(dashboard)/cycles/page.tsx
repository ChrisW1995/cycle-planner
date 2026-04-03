'use client'

import { useState } from 'react'
import { useCycles, useDeleteCycle } from '@/hooks/use-cycles'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { CycleStatus } from '@/types'

const statusColors: Record<CycleStatus, string> = {
  Scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  Planned: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  Completed: 'bg-green-500/10 text-green-500 border-green-500/30',
  Archived: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/30',
}
const statusLabels: Record<CycleStatus, string> = {
  Scheduled: '已預定',
  Planned: '已排制',
  Completed: '已完成',
  Archived: '已封存',
}

export default function CyclesPage() {
  const { data: cycles, isLoading } = useCycles()
  const deleteCycle = useDeleteCycle()
  const { isAdmin } = useAuth()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">載入中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">課表管理</h1>
        {isAdmin && (
          <Button render={<Link href="/cycles/new" />}>
              <Plus className="mr-2 h-4 w-4" />
              新建課表
          </Button>
        )}
      </div>

      {!cycles?.length ? (
        <p className="text-muted-foreground py-12 text-center">尚無課表</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>人員</TableHead>
                <TableHead>名稱</TableHead>
                <TableHead>週數</TableHead>
                <TableHead>開始日期</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => (
                <TableRow key={cycle.id} className={cycle.status === 'Archived' ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{(cycle as any).person?.nickname}</TableCell>
                  <TableCell>{cycle.name || '—'}</TableCell>
                  <TableCell>{cycle.total_weeks} 週</TableCell>
                  <TableCell>
                    {cycle.start_date ? new Date(cycle.start_date).toLocaleDateString('zh-TW') : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[cycle.status]}>
                      {statusLabels[cycle.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" render={<Link href={`/cycles/${cycle.id}`} />}>
                        編輯
                      </Button>
                      {isAdmin && cycle.status === 'Scheduled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(cycle.id)}
                        >
                          刪除
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>此操作會刪除課表及所有排程資料，確定嗎？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={() => { deleteTarget && deleteCycle.mutate(deleteTarget); setDeleteTarget(null) }}>刪除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
