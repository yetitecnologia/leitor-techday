import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso admin — TechDay Leads" },
      {
        name: "description",
        content: "Login da área administrativa do leitor de QR Code do TechDay.",
      },
      { property: "og:title", content: "Acesso admin — TechDay Leads" },
      { property: "og:description", content: "Login da área administrativa do TechDay Leads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setMsg(null);
    const res = await supabase.auth.signInWithPassword({ email, password: senha })
    setCarregando(false);
    if (res.error) {
      setMsg(res.error.message);
      return;
    }
    if (res.data.session) navigate({ to: "/admin" });
    else setMsg("Confira seu e-mail para confirmar o cadastro.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h1 className="text-xl font-bold text-card-foreground">Área administrativa</h1>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
        />
        <input
          type="password"
          required
          minLength={6}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
        />
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
