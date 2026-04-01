'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useDrug, useUpdateDrug } from '@/hooks/use-drugs'
import { DrugForm } from '@/components/drugs/drug-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditDrugPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: drug, isLoading } = useDrug(id)
  const updateDrug = useUpdateDrug()

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">載入中…</div>
  }

  if (!drug) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">找不到藥品</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" render={<Link href="/drugs" />}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        返回藥物庫存
      </Button>
      <DrugForm
        initialData={drug}
        onSubmit={(data) => {
          updateDrug.mutate(
            { id, ...data },
            { onSuccess: () => router.push('/drugs') }
          )
        }}
        loading={updateDrug.isPending}
      />
    </div>
  )
}
