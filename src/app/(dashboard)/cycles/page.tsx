'use client'

import { useState } from 'react'
import { useCycles, useDeleteCycle } from '@/hooks/use-cycles'
import { useAuth } from '@/hooks/use-auth'
import { CycleExportDialog } from '@/components/cycles/cycle-export-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { statusColors, statusLabels } from '@/lib/constants/cycle-status'
import type { CycleStatus } from '@/types'

export default function CyclesPage() {
  const { data: cycles, isLoading } = useCycles()
  const deleteCycle = useDeleteCycle()
  const { isAdmin } = useAuth()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

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
                <TableHead className="w-28 text-center">操作</TableHead>
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
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="檢視" onClick={() => setPreviewId(cycle.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="編輯" render={<Link href={`/cycles/${cycle.id}`} />}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && (cycle.status === 'Scheduled' || cycle.status === 'Planned') && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="刪除" onClick={() => setDeleteTarget(cycle.id)}>
                          <Trash2 className="h-4 w-4" />
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

      {/* Cycle Preview/Export Modal */}
      {previewId && (
        <CycleExportDialog id={previewId} open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)} />
      )}
    </div>
  )
}
