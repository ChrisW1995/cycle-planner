'use client'

import { useRouter } from 'next/navigation'
import { useCreateDrug } from '@/hooks/use-drugs'
import { DrugForm } from '@/components/drugs/drug-form'

export default function NewDrugPage() {
  const router = useRouter()
  const createDrug = useCreateDrug()

  return (
    <div className="mx-auto max-w-2xl">
      <DrugForm
        onSubmit={(data) => {
          createDrug.mutate(data, {
            onSuccess: () => router.push('/drugs'),
          })
        }}
        loading={createDrug.isPending}
      />
    </div>
  )
}
