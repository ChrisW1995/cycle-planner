'use client'

import { useRouter } from 'next/navigation'
import { useCreateDrug } from '@/hooks/use-drugs'
import { DrugForm } from '@/components/drugs/drug-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewDrugPage() {
  const router = useRouter()
  const createDrug = useCreateDrug()

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" render={<Link href="/drugs" />}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        返回藥物庫存
      </Button>
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
