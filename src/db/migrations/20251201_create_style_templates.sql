CREATE TABLE IF NOT EXISTS style_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  colors JSONB NOT NULL,
  fonts JSONB NOT NULL,
  transitions JSONB,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_style_templates_active
  ON style_templates(is_active);
