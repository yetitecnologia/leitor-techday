import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { importarParticipantes, listarParticipantes } from "@/lib/participantes.functions";
import type { ParticipanteInput } from "@/lib/participantes.shared";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Importar lista do TechDay" },
      {
        name: "description",
        content: "Envie a planilha de participantes do TechDay para alimentar o leitor de QR Code.",
      }
    ],
  }),
  component: Admin,
});

const CAMPOS: Record<keyof ParticipanteInput, string[]> = {
  identificador: ["nº ingresso", "n° ingresso", "no ingresso", "ingresso", "identificador"],
  nome: ["nome"],
  sobrenome: ["sobrenome"],
  celular: ["telefone", "celular", "telefone.1"],
  cidade: ["cidade"],
  empresa: ["empresa"],
  cargo: ["cargo"],
  email: ["email", "e-mail"],
};

function mapear(row: Record<string, unknown>): ParticipanteInput {
  const chaves = Object.keys(row);
  const pick = (alvos: string[]) => {
    for (const alvo of alvos) {
      const k = chaves.find((c) => c.trim().toLowerCase() === alvo);
      if (k && String(row[k] ?? "").trim()) return String(row[k]).trim();
    }
    return "";
  };
  return {
    identificador: pick(CAMPOS.identificador),
    nome: pick(CAMPOS.nome),
    sobrenome: pick(CAMPOS.sobrenome),
    celular: pick(CAMPOS.celular),
    cidade: pick(CAMPOS.cidade),
    empresa: pick(CAMPOS.empresa),
    cargo: pick(CAMPOS.cargo),
    email: pick(CAMPOS.email),
  };
}

function Admin() {
  const navigate = useNavigate();
  const importar = useServerFn(importarParticipantes);
  const listar = useServerFn(listarParticipantes);
  const [msg, setMsg] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const lista = useQuery({
    queryKey: ["participantes"],
    queryFn: () => listar(),
  });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCarregando(true);
    setMsg(null);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]!]!;
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const linhas = rows.map(mapear).filter((l) => l.identificador);
      const { importados } = await importar({ data: { linhas } });
      setMsg(`${importados} participante(s) importado(s).`);
      lista.refetch();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Falha ao importar a planilha.");
    } finally {
      setCarregando(false);
      e.target.value = "";
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl space-y-6 bg-background px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Administração</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Sair
        </button>
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold text-card-foreground">Importar planilha de participantes</h2>
        <p className="text-sm text-muted-foreground">
          Arquivo .xlsx com as colunas Nº ingresso, Nome, Sobrenome, Telefone, Empresa, Cidade.
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFile}
          disabled={carregando}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
        />
        {carregando && <p className="text-sm text-muted-foreground">Importando…</p>}
        {msg && <p className="text-sm text-foreground">{msg}</p>}
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold text-card-foreground">
          Participantes ({lista.data?.participantes.length ?? 0})
        </h2>
        <ul className="divide-y divide-border text-sm">
          {lista.data?.participantes.map((p) => (
            <li key={p.identificador} className="flex justify-between gap-4 py-2">
              <span className="text-card-foreground">
                {p.nome} {p.sobrenome}
              </span>
              <span className="text-muted-foreground">{p.identificador}</span>
            </li>
          ))}
        </ul>
      </section>

      <Link to="/" className="block text-sm text-primary underline-offset-4 hover:underline">
        Voltar ao leitor
      </Link>
    </main>
  );
}
