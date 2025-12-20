-- Fix FK references in product_creative_contexts to match actual schema
BEGIN;

-- Rename columns for consistency
ALTER TABLE product_creative_contexts
  RENAME COLUMN trend_snapshot_id TO snapshot_id;

ALTER TABLE product_creative_contexts
  RENAME COLUMN creative_pattern_id TO pattern_id;

-- Drop incorrect foreign key constraints if they exist
ALTER TABLE product_creative_contexts DROP CONSTRAINT IF EXISTS product_creative_contexts_trend_snapshot_id_fkey;
ALTER TABLE product_creative_contexts DROP CONSTRAINT IF EXISTS product_creative_contexts_creative_pattern_id_fkey;
ALTER TABLE product_creative_contexts DROP CONSTRAINT IF EXISTS product_creative_contexts_product_id_fkey;

-- Recreate proper foreign keys
ALTER TABLE product_creative_contexts
  ADD CONSTRAINT product_creative_contexts_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

ALTER TABLE product_creative_contexts
  ADD CONSTRAINT product_creative_contexts_snapshot_id_fkey
  FOREIGN KEY (snapshot_id) REFERENCES trend_snapshots(snapshot_id) ON DELETE CASCADE;

ALTER TABLE product_creative_contexts
  ADD CONSTRAINT product_creative_contexts_pattern_id_fkey
  FOREIGN KEY (pattern_id) REFERENCES creative_patterns(pattern_id) ON DELETE CASCADE;

-- Add unique composite constraint (if not yet applied)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_creative_contexts_unique_combo'
  ) THEN
    ALTER TABLE product_creative_contexts
      ADD CONSTRAINT product_creative_contexts_unique_combo
      UNIQUE (product_id, snapshot_id, pattern_id);
  END IF;
END $$;

COMMIT;
