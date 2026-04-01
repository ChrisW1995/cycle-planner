import type { CycleDrug, Drug, CycleCell, EsterType } from '@/types'

interface DrugInfo {
  id: string
  name: string
  concentration: number
  primary_category: string
  ester_type: EsterType | null
}

interface CellData {
  cycle_drug_id: string
  week_number: number
  day_of_week: number
  display_value: string
  ml_amount: number | null
  is_manual_override: boolean
}

/**
 * Generate schedule cells for a cycle drug based on auto-calculation rules.
 *
 * Rule A: Long Ester Injectable → 2x/week on Day 1 & Day 4
 * Rule B: Short Ester Injectable → EOD alternating across 2 weeks
 * Rule C: Oral / PCT → daily dose on all 7 days
 */
export function generateCellsForDrug(
  cycleDrug: CycleDrug & { drug: DrugInfo },
  totalWeeks: number
): CellData[] {
  const { drug } = cycleDrug
  const cells: CellData[] = []

  if (drug.primary_category === 'Injectable' && cycleDrug.weekly_dose) {
    if (drug.ester_type === 'Long') {
      // Rule A: Long Ester — Day 1 & Day 4
      const perInjection = cycleDrug.weekly_dose / 2
      const mlPerInjection = roundMl(perInjection / drug.concentration)

      for (let week = cycleDrug.start_week; week <= Math.min(cycleDrug.end_week, totalWeeks); week++) {
        // Day 1 (Monday)
        cells.push({
          cycle_drug_id: cycleDrug.id,
          week_number: week,
          day_of_week: 1,
          display_value: `${drug.name} ${mlPerInjection}ml`,
          ml_amount: mlPerInjection,
          is_manual_override: false,
        })
        // Day 4 (Thursday)
        cells.push({
          cycle_drug_id: cycleDrug.id,
          week_number: week,
          day_of_week: 4,
          display_value: `${drug.name} ${mlPerInjection}ml`,
          ml_amount: mlPerInjection,
          is_manual_override: false,
        })
      }
    } else if (drug.ester_type === 'Short') {
      // Rule B: Short Ester — EOD alternating across 2 weeks
      // 3.5 injections per week → 7 injections per 2 weeks
      const perInjection = cycleDrug.weekly_dose / 3.5
      const mlPerInjection = roundMl(perInjection / drug.concentration)

      for (let week = cycleDrug.start_week; week <= Math.min(cycleDrug.end_week, totalWeeks); week += 2) {
        // Week N: Day 1, 3, 5, 7
        const weekNDays = [1, 3, 5, 7]
        for (const day of weekNDays) {
          if (week <= totalWeeks) {
            cells.push({
              cycle_drug_id: cycleDrug.id,
              week_number: week,
              day_of_week: day,
              display_value: `${drug.name} ${mlPerInjection}ml`,
              ml_amount: mlPerInjection,
              is_manual_override: false,
            })
          }
        }
        // Week N+1: Day 2, 4, 6
        const weekN1 = week + 1
        if (weekN1 <= Math.min(cycleDrug.end_week, totalWeeks)) {
          const weekN1Days = [2, 4, 6]
          for (const day of weekN1Days) {
            cells.push({
              cycle_drug_id: cycleDrug.id,
              week_number: weekN1,
              day_of_week: day,
              display_value: `${drug.name} ${mlPerInjection}ml`,
              ml_amount: mlPerInjection,
              is_manual_override: false,
            })
          }
        }
      }
    }
  } else if (
    (drug.primary_category === 'Oral' || drug.primary_category === 'PCT') &&
    cycleDrug.daily_dose
  ) {
    // Rule C: Oral — daily dose on all 7 days
    const tabletsPerDay = roundTablets(cycleDrug.daily_dose / drug.concentration)

    for (let week = cycleDrug.start_week; week <= Math.min(cycleDrug.end_week, totalWeeks); week++) {
      for (let day = 1; day <= 7; day++) {
        cells.push({
          cycle_drug_id: cycleDrug.id,
          week_number: week,
          day_of_week: day,
          display_value: `${drug.name} ${cycleDrug.daily_dose}mg (${tabletsPerDay})`,
          ml_amount: null,
          is_manual_override: false,
        })
      }
    }
  }

  return cells
}

/**
 * Regenerate all cells for an entire cycle
 */
export function generateAllCells(
  cycleDrugs: (CycleDrug & { drug: DrugInfo })[],
  totalWeeks: number,
  existingManualOverrides?: CycleCell[]
): CellData[] {
  const allCells: CellData[] = []

  for (const cd of cycleDrugs) {
    const generated = generateCellsForDrug(cd, totalWeeks)
    allCells.push(...generated)
  }

  // Restore manual overrides
  if (existingManualOverrides?.length) {
    for (const override of existingManualOverrides) {
      const idx = allCells.findIndex(
        (c) =>
          c.cycle_drug_id === override.cycle_drug_id &&
          c.week_number === override.week_number &&
          c.day_of_week === override.day_of_week
      )
      if (idx >= 0) {
        allCells[idx] = {
          ...allCells[idx],
          display_value: override.display_value || allCells[idx].display_value,
          ml_amount: override.ml_amount,
          is_manual_override: true,
        }
      }
    }
  }

  return allCells
}

/**
 * Calculate expected ml per injection for validation
 */
export function getExpectedMl(
  cycleDrug: CycleDrug & { drug: DrugInfo }
): number | null {
  const { drug } = cycleDrug
  if (drug.primary_category !== 'Injectable' || !cycleDrug.weekly_dose) return null

  if (drug.ester_type === 'Long') {
    return roundMl(cycleDrug.weekly_dose / 2 / drug.concentration)
  } else if (drug.ester_type === 'Short') {
    return roundMl(cycleDrug.weekly_dose / 3.5 / drug.concentration)
  }
  return null
}

function roundMl(value: number): number {
  return Math.round(value * 100) / 100
}

function roundTablets(value: number): number {
  return Math.round(value * 10) / 10
}
