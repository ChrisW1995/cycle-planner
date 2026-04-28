import type { CycleCell, CycleDrug, Supply, CycleSupply, SupplySummary } from '@/types'

/** Count non-skipped CycleCells that belong to an Injectable cycle_drug. */
export function countInjectionEvents(cells: CycleCell[], cycleDrugs: CycleDrug[]): number {
  const injectableCdIds = new Set(
    cycleDrugs
      .filter((cd) => cd.drug?.primary_category === 'Injectable')
      .map((cd) => cd.id)
  )
  return cells.filter(
    (c) => !c.is_skipped && c.cycle_drug_id && injectableCdIds.has(c.cycle_drug_id)
  ).length
}

export function computeSupplyQuantity(
  supply: Supply,
  totalWeeks: number,
  injectionEventCount: number
): number {
  const v = Number(supply.rule_value) || 0
  switch (supply.rule_type) {
    case 'per_injection':
      return Math.ceil(injectionEventCount * v)
    case 'per_day':
      return Math.ceil(totalWeeks * 7 * v)
    case 'per_week':
      return Math.ceil(totalWeeks * v)
    case 'fixed':
      return Math.ceil(v)
  }
}

export function buildSupplySummaries(
  selected: CycleSupply[],
  overrides: Record<string, number | null>,
  supplies: Supply[],
  totalWeeks: number,
  injectionEventCount: number
): SupplySummary[] {
  // Iterate `supplies` (already sorted by display_order) and pick out the
  // selected ones, so the output order in the export matches the order the
  // user dragged in the dialog. `overrides` is a per-export local map keyed
  // by supply_id; if a supply has an entry in `overrides` it wins over the
  // auto-computed quantity. Override values are not persisted to DB — the
  // caller (cycle-export-dialog) owns this transient state.
  const selectedIds = new Set(selected.map((cs) => cs.supply_id))
  const summaries: SupplySummary[] = []
  for (const s of supplies) {
    if (!selectedIds.has(s.id)) continue
    const auto = computeSupplyQuantity(s, totalWeeks, injectionEventCount)
    const ov = overrides[s.id]
    summaries.push({
      name: s.name,
      unit: s.unit,
      quantity: ov !== undefined && ov !== null ? ov : auto,
    })
  }
  return summaries
}
