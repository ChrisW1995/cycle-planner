import type { CycleDrug, Drug, DrugInventoryDelta } from '@/types'

interface DrugWithInventory {
  id: string
  name: string
  concentration: number
  primary_category: string
  ester_type: string | null
  inventory_count: number
}

interface CycleDrugWithDrug extends Omit<CycleDrug, 'drug'> {
  drug: DrugWithInventory
}

const ML_PER_VIAL = 10

/**
 * Calculate total ml needed for a drug across a cycle
 */
export function calculateTotalMl(cycleDrug: CycleDrugWithDrug): number {
  const { drug } = cycleDrug
  if (drug.primary_category !== 'Injectable' || !cycleDrug.weekly_dose) return 0

  const weeks = cycleDrug.end_week - cycleDrug.start_week + 1

  if (drug.ester_type === 'Long') {
    // 2 injections per week
    const mlPerInjection = cycleDrug.weekly_dose / 2 / drug.concentration
    return Math.round(mlPerInjection * 2 * weeks * 100) / 100
  } else if (drug.ester_type === 'Short') {
    // 3.5 injections per week
    const mlPerInjection = cycleDrug.weekly_dose / 3.5 / drug.concentration
    return Math.round(mlPerInjection * 3.5 * weeks * 100) / 100
  }

  return 0
}

/**
 * Calculate vials needed for a drug
 */
export function calculateVialsNeeded(totalMl: number): number {
  return Math.ceil(totalMl / ML_PER_VIAL)
}

/**
 * Calculate inventory delta for all drugs in a cycle
 */
export function calculateInventoryDeltas(
  cycleDrugs: CycleDrugWithDrug[]
): DrugInventoryDelta[] {
  // Group by drug_id (same drug may appear in multiple cycle_drugs)
  const drugMap = new Map<string, { totalMl: number; drug: DrugWithInventory }>()

  for (const cd of cycleDrugs) {
    if (cd.drug.primary_category !== 'Injectable') continue

    const existing = drugMap.get(cd.drug_id) || { totalMl: 0, drug: cd.drug }
    existing.totalMl += calculateTotalMl(cd)
    drugMap.set(cd.drug_id, existing)
  }

  return Array.from(drugMap.entries()).map(([drugId, { totalMl, drug }]) => {
    const vialsNeeded = calculateVialsNeeded(totalMl)
    return {
      drug_id: drugId,
      drug_name: drug.name,
      needed_ml: Math.round(totalMl * 100) / 100,
      needed_vials: vialsNeeded,
      current_inventory: drug.inventory_count,
      deficit: drug.inventory_count - vialsNeeded,
    }
  })
}

/**
 * Calculate weekly usage for a specific drug in a specific week
 */
export function calculateWeeklyUsage(
  cycleDrug: CycleDrugWithDrug,
  weekNumber: number
): { totalMl: number; totalMg: number } {
  const { drug } = cycleDrug

  if (weekNumber < cycleDrug.start_week || weekNumber > cycleDrug.end_week) {
    return { totalMl: 0, totalMg: 0 }
  }

  if (drug.primary_category === 'Injectable' && cycleDrug.weekly_dose) {
    if (drug.ester_type === 'Long') {
      const mlPerWeek = cycleDrug.weekly_dose / drug.concentration
      return {
        totalMl: Math.round(mlPerWeek * 100) / 100,
        totalMg: cycleDrug.weekly_dose,
      }
    } else if (drug.ester_type === 'Short') {
      // EOD pattern: depends on whether this is odd or even week in pair
      const mlPerInjection = cycleDrug.weekly_dose / 3.5 / drug.concentration
      const weekOffset = weekNumber - cycleDrug.start_week
      const injectionsThisWeek = weekOffset % 2 === 0 ? 4 : 3 // Week N=4, Week N+1=3
      const mlThisWeek = mlPerInjection * injectionsThisWeek
      const mgThisWeek = (cycleDrug.weekly_dose / 3.5) * injectionsThisWeek
      return {
        totalMl: Math.round(mlThisWeek * 100) / 100,
        totalMg: Math.round(mgThisWeek * 100) / 100,
      }
    }
  }

  return { totalMl: 0, totalMg: 0 }
}
