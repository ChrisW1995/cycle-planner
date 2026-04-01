'use client'

import { useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Fingerprint, X } from 'lucide-react'
import { toast } from 'sonner'

const DISMISSED_KEY = 'passkey-prompt-dismissed'

interface PasskeyRegisterPromptProps {
  onComplete: () => void
}

export function PasskeyRegisterPrompt({ onComplete }: PasskeyRegisterPromptProps) {
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setLoading(true)
    try {
      // Get registration options
      const optionsRes = await fetch('/api/auth/webauthn/register-options', {
        method: 'POST',
      })

      if (!optionsRes.ok) {
        throw new Error('無法取得註冊選項')
      }

      const options = await optionsRes.json()

      // Start registration (triggers Face ID / Touch ID)
      const regResponse = await startRegistration({ optionsJSON: options })

      // Verify with server
      const verifyRes = await fetch('/api/auth/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regResponse),
      })

      if (!verifyRes.ok) {
        const data = await verifyRes.json()
        throw new Error(data.error || '註冊失敗')
      }

      toast.success('Passkey 已儲存', {
        description: '下次可直接使用 Face ID / Touch ID 登入',
      })
      onComplete()
    } catch (error) {
      const message = error instanceof Error ? error.message : '註冊失敗'
      if (!message.includes('cancelled') && !message.includes('abort')) {
        toast.error('Passkey 註冊失敗', { description: message })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-background/80" onClick={handleDismiss} />
      <Card className="relative z-10 w-full max-w-sm">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">儲存 Passkey</CardTitle>
          </div>
          <CardDescription>
            下次可使用 Face ID / Touch ID 快速登入，免輸入密碼
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={handleRegister} disabled={loading} className="flex-1">
            {loading ? '註冊中...' : '儲存'}
          </Button>
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            稍後再說
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
