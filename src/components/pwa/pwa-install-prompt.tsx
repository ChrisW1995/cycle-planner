'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DISMISSED_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export function PwaInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      deferredPrompt.current = e

      const dismissed = localStorage.getItem(DISMISSED_KEY)
      if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_DURATION) {
        return
      }
      setShow(true)
    }

    const installed = () => {
      setShow(false)
      deferredPrompt.current = null
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt.current) return
    await deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'dismissed') {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString())
    }
    deferredPrompt.current = null
    setShow(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString())
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300 sm:left-auto sm:right-4">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-lg">
        <Download className="h-5 w-5 shrink-0 text-primary" />
        <p className="flex-1 text-sm">安裝 Cycle Planner 到主畫面</p>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={handleInstall}>
            安裝
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
