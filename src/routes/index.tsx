import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { buscarParticipante, enviarLead } from "@/lib/participantes.functions";
import { normalizarIdentificador } from "@/lib/participantes.shared";

const QrScanner = lazy(() =>
  import("@/components/QrScanner").then((m) => ({ default: m.QrScanner })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TechDay Leads — Leitor de QR Code" },
      {
        name: "description",
        content:
          "Leia o QR Code do ingresso do TechDay, confira os dados do participante e envie o lead em um toque.",
      }
    ],
  }),
  component: Index,
});

type Participante = {
  identificador: string;
  nome: string;
  sobrenome: string;
  celular: string;
  cidade: string;
  empresa: string;
  cargo: string;
  email: string;
};

type Estado =
  | { tipo: "inicio" }
  | { tipo: "lendo" }
  | { tipo: "buscando" }
  | { tipo: "encontrado"; participante: Participante }
  | { tipo: "enviando"; participante: Participante }
  | { tipo: "sucesso"; nome: string }
  | { tipo: "erro"; mensagem: string };

function Index() {
  const [estado, setEstado] = useState<Estado>({ tipo: "inicio" });
  const buscar = useServerFn(buscarParticipante);
  const enviar = useServerFn(enviarLead);

  const onResult = useCallback(
    async (texto: string) => {
      const codigo = normalizarIdentificador(texto);
      setEstado({ tipo: "buscando" });
      try {
        const { participante } = await buscar({ data: { codigo } });
        if (!participante) {
          setEstado({ tipo: "erro", mensagem: `Ingresso ${codigo} não encontrado na lista.` });
          return;
        }
        setEstado({ tipo: "encontrado", participante: participante as Participante });
      } catch (e) {
        setEstado({
          tipo: "erro",
          mensagem: e instanceof Error ? e.message : "Erro ao consultar o participante.",
        });
      }
    },
    [buscar],
  );

  async function confirmar(p: Participante) {
    setEstado({ tipo: "enviando", participante: p });
    try {
      await enviar({ data: { codigo: p.identificador } });
      setEstado({ tipo: "sucesso", nome: `${p.nome} ${p.sobrenome}`.trim() });
    } catch (e) {
      setEstado({
        tipo: "erro",
        mensagem: e instanceof Error ? e.message : "Erro ao enviar o lead.",
      });
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-30 bg-background px-5 py-10">
      <header className="text-center">
        <img src="/logo.png" alt="TechDay" className="mx-auto h-20" />
      </header>

      {estado.tipo === "inicio" && (
        <button
          onClick={() => setEstado({ tipo: "lendo" })}
          className="w-full max-w-sm rounded-2xl bg-primary px-6 py-5 text-lg font-bold text-primary-foreground shadow-[0_0_40px_-10px_var(--primary)] transition-transform active:scale-95"
        >
          Ler QR Code
        </button>
      )}

      {estado.tipo === "lendo" && (
        <ClientOnly fallback={<p className="text-muted-foreground">Abrindo câmera…</p>}>
          <Suspense fallback={<p className="text-muted-foreground">Abrindo câmera…</p>}>
            <QrScanner onResult={onResult} onCancel={() => setEstado({ tipo: "inicio" })} />
          </Suspense>
        </ClientOnly>
      )}

      {estado.tipo === "buscando" && <p className="text-muted-foreground">Consultando lista…</p>}

      {(estado.tipo === "encontrado" || estado.tipo === "enviando") && (
        <section className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Participante</p>
            <h2 className="mt-1 text-2xl font-bold text-card-foreground">
              {estado.participante.nome} {estado.participante.sobrenome}
            </h2>
          </div>
          <dl className="space-y-2 text-sm">
            <Linha rotulo="Ingresso" valor={estado.participante.identificador} />
            <Linha rotulo="Celular" valor={estado.participante.celular} />
            <Linha rotulo="Empresa" valor={estado.participante.empresa} />
            <Linha rotulo="Cargo" valor={estado.participante.cargo} />
            <Linha rotulo="Cidade" valor={estado.participante.cidade} />
          </dl>
          <div className="flex gap-3">
            <button
              disabled={estado.tipo === "enviando"}
              onClick={() => setEstado({ tipo: "inicio" })}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              disabled={estado.tipo === "enviando"}
              onClick={() => confirmar(estado.participante)}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
            >
              {estado.tipo === "enviando" ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </section>
      )}

      {estado.tipo === "sucesso" && (
        <section className="w-full max-w-sm space-y-5 rounded-2xl border border-primary/40 bg-card p-6 text-center shadow-lg">
          <h2 className="text-xl font-bold text-card-foreground">Lead enviado!</h2>
          <p className="text-sm text-muted-foreground">{estado.nome}</p>
          <button
            onClick={() => setEstado({ tipo: "lendo" })}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
          >
            Ler outro QR Code
          </button>
        </section>
      )}

      {estado.tipo === "erro" && (
        <section className="w-full max-w-sm space-y-5 rounded-2xl border border-destructive/40 bg-card p-6 text-center shadow-lg">
          <h2 className="text-lg font-bold text-card-foreground">Ops</h2>
          <p className="text-sm text-muted-foreground">{estado.mensagem}</p>
          <button
            onClick={() => setEstado({ tipo: "inicio" })}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground"
          >
            Voltar
          </button>
        </section>
      )}
    </main>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
      <dt className="text-muted-foreground">{rotulo}</dt>
      <dd className="text-right font-medium text-card-foreground">{valor || "—"}</dd>
    </div>
  );
}
