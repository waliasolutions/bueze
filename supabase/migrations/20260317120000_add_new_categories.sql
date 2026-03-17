-- Add new major categories and subcategories to handwerker_category enum
-- New major categories: Gebäudehülle, Storen & Beschattung, Glas & Fenster, Bautrocknung & Wasserschäden

-- Gebäudehülle (major + new subcategories)
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'gebaeudehuelle';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'fassadenreinigung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'dachfenster';

-- Storen & Beschattung (major + subcategories)
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'storen_beschattung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'storen_rollaeden';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'lamellenstoren';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'markisen';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'sonnenstoren_reparatur';

-- Glas & Fenster (major + subcategories)
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'glas_fenster';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'glaser';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'glasbruch_reparatur';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'fensterersatz';

-- Bautrocknung & Wasserschäden (major + subcategories)
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'bautrocknung_wasserschaeden';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'wasserschaden_sanierung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'bautrocknung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'schimmelbehandlung';
