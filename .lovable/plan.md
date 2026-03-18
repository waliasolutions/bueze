

# Add 16 Missing Category Enum Values to Database

## Problem
The 4 new major categories and their subcategories exist in `majorCategories.ts` and `subcategoryLabels.ts` but are missing from the `handwerker_category` PostgreSQL enum. Any attempt to save a profile with these categories results in an "invalid enum value" error.

## Missing Values (16 total)

**Major category IDs (4):**
- `gebaeudehuelle`
- `storen_beschattung`
- `glas_fenster`
- `bautrocknung_wasserschaeden`

**Subcategories (12):**
- `fassadenreinigung`, `dachfenster`
- `storen_rollaeden`, `lamellenstoren`, `markisen`, `sonnenstoren_reparatur`
- `glaser`, `glasbruch_reparatur`, `fensterersatz`
- `wasserschaden_sanierung`, `bautrocknung`, `schimmelbehandlung`

## Changes

### 1. Database migration
Single migration file with 16 `ALTER TYPE ... ADD VALUE IF NOT EXISTS` statements. All idempotent, safe on PostgreSQL 15.

### 2. Update `types.ts`
Add all 16 values to the `handwerker_category` enum type definition so TypeScript accepts them.

No other files need changes -- `subcategoryLabels.ts` and `majorCategories.ts` already have these values defined.

