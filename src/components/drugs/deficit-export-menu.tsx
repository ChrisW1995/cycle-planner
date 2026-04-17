'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportDeficitsToXLSX, exportDeficitsToPDF } from '@/lib/export/deficit-export'
import { InventoryBatchEditDialog } from './inventory-batch-edit-dialog'
import { FileSpreadsheet, FileText, PencilLine } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import type { DrugInventoryDelta, Drug } from '@/types'

interface DeficitActionsProps {
  deficits: DrugInventoryDelta[]
  allDrugs: Drug[]
}

export function DeficitActions({ deficits, allDrugs }: DeficitActionsProps) {
  const { isAdmin } = useAuth()
  const [batchOpen, setBatchOpen] = useState(false)

  const hasShortage = deficits.some((d) => d.deficit < 0)
  if (!hasShortage) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => exportDeficitsToXLSX(deficits)}>
        <FileSpreadsheet className="mr-1.5 h-4 w-4" />
        匯出 XLSX
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportDeficitsToPDF(deficits)}>
        <FileText className="mr-1.5 h-4 w-4" />
        匯出 PDF
      </Button>
      {isAdmin && (
        <Button variant="outline" size="sm" onClick={() => setBatchOpen(true)}>
          <PencilLine className="mr-1.5 h-4 w-4" />
          批次更新庫存
        </Button>
      )}
      <InventoryBatchEditDialog
        open={batchOpen}
        onOpenChange={setBatchOpen}
        deficits={deficits}
        allDrugs={allDrugs}
      />
    </div>
  )
}
