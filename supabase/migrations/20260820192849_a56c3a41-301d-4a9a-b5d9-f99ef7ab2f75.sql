CREATE TABLE public.participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identificador text NOT NULL UNIQUE,
  nome text NOT NULL DEFAULT '',
  sobrenome text NOT NULL DEFAULT '',
  celular text NOT NULL DEFAULT '',
  cidade text NOT NULL DEFAULT '',
  empresa text NOT NULL DEFAULT '',
  cargo text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.participantes TO authenticated;
GRANT ALL ON public.participantes TO service_role;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem ver participantes" ON public.participantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem inserir participantes" ON public.participantes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados podem atualizar participantes" ON public.participantes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Autenticados podem apagar participantes" ON public.participantes FOR DELETE TO authenticated USING (true);

CREATE TABLE public.envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identificador text NOT NULL,
  nome text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ok',
  resposta text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.envios TO authenticated;
GRANT ALL ON public.envios TO service_role;
ALTER TABLE public.envios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem ver envios" ON public.envios FOR SELECT TO authenticated USING (true);