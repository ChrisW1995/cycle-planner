import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatOralInventory(totalTablets: number, tabsPerBox: number | null): string {
  if (!tabsPerBox || tabsPerBox <= 0) return `${totalTablets} 顆`
  const boxes = Math.floor(totalTablets / tabsPerBox)
  const remaining = totalTablets % tabsPerBox
  if (boxes === 0) return `${remaining} 顆`
  if (remaining === 0) return `${boxes} 盒`
  return `${boxes} 盒 ${remaining} 顆`
}
