'use client'

import { useRouter } from 'next/navigation'
import { useCreatePerson } from '@/hooks/use-people'
import { PersonForm } from '@/components/people/person-form'

export default function NewPersonPage() {
  const router = useRouter()
  const createPerson = useCreatePerson()

  return (
    <div className="mx-auto max-w-2xl">
      <PersonForm
        onSubmit={(data) => {
          createPerson.mutate(data, {
            onSuccess: () => router.push('/people'),
          })
        }}
        loading={createPerson.isPending}
      />
    </div>
  )
}
