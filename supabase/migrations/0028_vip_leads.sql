-- Lista VIP: captación de leads desde la home para promociones posteriores

CREATE TABLE vip_leads (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  phone      text        NOT NULL,
  email      text,
  source     text        NOT NULL DEFAULT 'home_form',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vip_leads ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante puede registrarse (sin autenticación)
CREATE POLICY "public_insert_vip_leads"
  ON vip_leads FOR INSERT
  WITH CHECK (true);

-- Solo service role puede leer (admin panel usa service role key, no pasa por RLS)
