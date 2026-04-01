export async function uploadDrugImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/drugs/upload-image', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || '上傳失敗')
  }

  const { url } = await res.json()
  return url
}

export async function deleteDrugImage(url: string): Promise<void> {
  await fetch('/api/drugs/upload-image', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
}
