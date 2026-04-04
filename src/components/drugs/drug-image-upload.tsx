'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { uploadDrugImage, deleteDrugImage } from '@/lib/supabase/storage'
import { ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DrugImageUploadProps {
  currentUrl: string | null
  onUrlChange: (url: string | null) => void
  onPendingDelete?: (url: string) => void
}

export function DrugImageUpload({ currentUrl, onUrlChange, onPendingDelete }: DrugImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('請選擇圖片檔案')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('圖片大小不能超過 10MB')
      return
    }

    setUploading(true)
    try {
      if (currentUrl) {
        if (onPendingDelete) {
          onPendingDelete(currentUrl)
        } else {
          await deleteDrugImage(currentUrl)
        }
      }
      const url = await uploadDrugImage(file)
      onUrlChange(url)
      toast.success('圖片已上傳')
    } catch (error) {
      toast.error('上傳失敗', { description: (error as Error).message })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    if (!currentUrl) return
    if (onPendingDelete) {
      onPendingDelete(currentUrl)
      onUrlChange(null)
    } else {
      try {
        await deleteDrugImage(currentUrl)
        onUrlChange(null)
        toast.success('圖片已移除')
      } catch (error) {
        toast.error('移除失敗', { description: (error as Error).message })
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {currentUrl ? (
        <div className="relative">
          <img
            src={currentUrl}
            alt="藥品照片"
            width={260}
            height={260}
            className="h-56 w-56 rounded-lg border object-contain bg-white lg:h-64 lg:w-64"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            aria-label="移除圖片"
            className="absolute -right-2 -top-2 h-8 w-8 shadow-md backdrop-blur-sm"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="flex h-56 w-56 cursor-pointer items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors lg:h-64 lg:w-64"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm">上傳照片</span>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  )
}
