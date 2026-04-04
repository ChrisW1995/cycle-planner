# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build + TypeScript type check
npm run lint     # ESLint
```

No test framework configured. Verify changes with `npm run build`.

DB migrations in `supabase/migrations/` — numbered sequentially (001, 002, ...). Apply via Supabase dashboard or CLI.

## Architecture

**Stack:** Next.js 16 (App Router) + Supabase (Postgres + R2 Storage) + Tailwind CSS 4 + @base-ui/react

### Auth (Dual-layer)

- **Admin/Viewer:** Custom JWT via `jose`. Passwords hashed with `bcryptjs`. Session in `cp_session` cookie (7d). Login at `/login`, API at `/api/auth/*`.
- **Developer:** Supabase Auth (email/password) at `/dev`. Optional WebAuthn passkeys (`@simplewebauthn/*`).
- **Middleware** (`src/middleware.ts`): Validates JWT or Supabase session, protects dashboard routes.
- **RLS:** All tables have RLS enabled. Anon role has full CRUD — auth enforced at app level, not DB level.

### Data Model

```
People ──< Cycles ──< CycleDrugs >── Drugs (← DrugTemplates)
                          │
                     CycleCells
```

- **People** — subjects with body stats (height, weight, body_fat, age)
- **Drugs** — categorized as `Injectable | Oral | PCT`, with `ester_type` (`Long | Short`)
  - Injectable: `concentration` = mg/ml, `inventory_count` = vials (10ml each)
  - Oral/PCT: `concentration` = mg/tab, `inventory_count` = total tablets, `tabs_per_box` = per box
- **Cycles** — weekly schedules. Status flow: `Scheduled → Planned → Completed → Archived`
- **CycleDrugs** — drug-to-cycle assignments (start/end week, weekly_dose or daily_dose)
- **CycleCells** — schedule grid cells (week × day), auto-generated or manually overridden

### Schedule Engine (`src/lib/calculations/schedule-engine.ts`)

Auto-generates CycleCells from CycleDrugs:
- **Long ester injectable:** 2x/week on Day 1 & Day 4
- **Short ester injectable:** EOD alternating across 2-week pairs (4+3 injections)
- **Oral/PCT:** Daily dose on all 7 days

### State Management

React Query v5 with hooks in `src/hooks/` (`use-cycles.ts`, `use-drugs.ts`, `use-people.ts`, `use-auth.ts`).

QueryClient config in `src/components/providers.tsx`. All mutations use `refetchType: 'all'` for cache invalidation. `useUpdateCycle` has optimistic updates with rollback.

### UI Components

Base primitives from `@base-ui/react` (NOT Radix), wrapped as shadcn-style components in `src/components/ui/`.

**Key difference from Radix:** Select renders items in a Portal. When popup is closed, `SelectValue` can't read item text. Use render function children pattern:
```tsx
<SelectValue placeholder="...">
  {(value: string | null) => {
    if (!value) return null
    return resolvedLabel
  }}
</SelectValue>
```
See `src/components/drugs/drug-form.tsx:122` for reference.

Icons: `lucide-react`. Toasts: `sonner` (bottom-right). Theme: `next-themes` (dark mode).

### Export

- **XLSX** (`exceljs`): `src/lib/export/xlsx-export.ts` — styled headers, auto-fit columns, drug stats
- **PDF** (`jspdf` + `jspdf-autotable`): `src/lib/export/pdf-export.ts` — English day labels (Mon–Sun) to avoid CJK font issues in jsPDF
- Both accept optional `DrugInventoryDelta[]` for appended drug requirements table

### Inventory Calculator (`src/lib/calculations/vial-calculator.ts`)

Handles both injectable (ml → vials, 10ml/vial) and oral (tablets → boxes). Pools inventory across drugs sharing the same `template_id` + `concentration`.

### Key Patterns

- `isEditable` flag on cycle detail: `isAdmin && status !== 'Archived'` — hides edit controls for archived cycles
- Drugs/People pages: Grid/list toggle persisted to `localStorage`
- Inventory quick-edit: Click `InventoryBadge` → inline Dialog (oral shows boxes + tablets input)
- Service worker (`public/sw.js`): Skips all non-origin requests (Supabase API) — only caches same-origin static assets

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
WEBAUTHN_RP_ID=
WEBAUTHN_RP_NAME=
WEBAUTHN_ORIGIN=
```
