-- Purpose: create join table linking products, trend snapshots, and creative patterns
BEGIN;

CREATE TABLE IF NOT EXISTS product_creative_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  trend_snapshot_id UUID NOT NULL REFERENCES trend_snapshots(snapshot_id) ON DELETE CASCADE,
  creative_pattern_id UUID NOT NULL REFERENCES creative_patterns(pattern_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT product_creative_contexts_unique
    UNIQUE (product_id, trend_snapshot_id, creative_pattern_id)
);

CREATE INDEX IF NOT EXISTS product_creative_contexts_product_id_idx
  ON product_creative_contexts (product_id);

CREATE INDEX IF NOT EXISTS product_creative_contexts_trend_snapshot_id_idx
  ON product_creative_contexts (trend_snapshot_id);

CREATE INDEX IF NOT EXISTS product_creative_contexts_creative_pattern_id_idx
  ON product_creative_contexts (creative_pattern_id);

COMMIT;
