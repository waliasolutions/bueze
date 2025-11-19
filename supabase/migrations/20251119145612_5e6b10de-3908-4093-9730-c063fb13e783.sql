-- Add major category values to the handwerker_category enum
-- This allows leads to use simplified major categories while maintaining backward compatibility

ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'bau_renovation';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektroinstallationen';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'heizung_klima';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'sanitaer';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'innenausbau_schreiner';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'bodenbelaege';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'kueche';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'garten_umgebung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'reinigung_hauswartung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'raeumung_entsorgung';