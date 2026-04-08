'use client'

import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'

interface InfoTooltipProps {
  content: string
  source?: string
}

export function InfoTooltip({ content, source }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex align-middle ml-1 cursor-help text-muted-foreground hover:text-foreground transition-colors">
        <Info className="h-3.5 w-3.5" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        <p>{content}</p>
        {source && (
          <p className="mt-1 opacity-70">來源：{source}</p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

// Helper to render text that may have a tooltip
export interface TooltipText {
  text: string
  tooltip?: string
  source?: string
}

export function isTooltipText(value: string | TooltipText): value is TooltipText {
  return typeof value === 'object' && 'text' in value
}

export function TextWithTooltip({ value }: { value: string | TooltipText }) {
  if (typeof value === 'string') return <>{value}</>
  return (
    <span className="inline-flex items-center">
      {value.text}
      {value.tooltip && <InfoTooltip content={value.tooltip} source={value.source} />}
    </span>
  )
}
