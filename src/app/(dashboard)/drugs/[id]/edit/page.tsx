'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useDrug, useUpdateDrug } from '@/hooks/use-drugs'
import { DrugForm } from '@/components/drugs/drug-form'

export default function EditDrugPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: drug, isLoading } = useDrug(id)
  const updateDrug = useUpdateDrug()

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">載入中...</div>
  }

  if (!drug) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">找不到藥品</div>
  }

  return (
    <div className="mx-auto max-w-2xl">
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
