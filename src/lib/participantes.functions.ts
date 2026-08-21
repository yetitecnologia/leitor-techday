import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizarIdentificador, type ParticipanteInput } from "./participantes.shared";

export const buscarParticipante = createServerFn({ method: "POST" })
  .inputValidator((data: { codigo: string }) => {
    const codigo = normalizarIdentificador(String(data?.codigo ?? ""));
    if (!codigo || codigo.length > 64) throw new Error("Código inválido");
    return { codigo };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("participantes")
      .select("identificador, nome, sobrenome, celular, cidade, empresa, cargo, email")
      .eq("identificador", data.codigo)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { participante: row ?? null };
  });

export const enviarLead = createServerFn({ method: "POST" })
  .inputValidator((data: { codigo: string }) => {
    const codigo = normalizarIdentificador(String(data?.codigo ?? ""));
    if (!codigo || codigo.length > 64) throw new Error("Código inválido");
    return { codigo };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p, error } = await supabaseAdmin
      .from("participantes")
      .select("identificador, nome, sobrenome, celular, cidade, empresa, cargo")
      .eq("identificador", data.codigo)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!p) throw new Error("Participante não encontrado");

    const secret = process.env["INGEST_SECRET"] ?? process.env["SECRET"];
    if (!secret) throw new Error("Segredo de integração não configurado");

    const payload = {
      identificador: p.identificador,
      origem: "techday2026",
      nome: `${p.nome} ${p.sobrenome}`.trim(),
      celular: p.celular ?? "",
      cidade: p.cidade ?? "",
      empresa: p.empresa ?? "",
      cargo: p.cargo ?? "",
      aceita_contato: true,
      tags: ["techday"],
    };

    const res = await fetch("https://boslhfcbddgfajqvkgnq.supabase.co/functions/v1/ingest-lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
        "x-ingest-secret": secret,
      },
      body: JSON.stringify(payload),
    });
    const texto = (await res.text()).slice(0, 500);

    await supabaseAdmin.from("envios").insert({
      identificador: p.identificador,
      nome: payload.nome,
      status: res.ok ? "ok" : `erro_${res.status}`,
      resposta: texto,
    });

    if (!res.ok) throw new Error(`Falha ao enviar (${res.status})`);
    return { ok: true as const };
  });

export const importarParticipantes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { linhas: ParticipanteInput[] }) => {
    const linhas = Array.isArray(data?.linhas) ? data.linhas : [];
    if (!linhas.length) throw new Error("Nenhuma linha encontrada");
    if (linhas.length > 20000) throw new Error("Planilha muito grande");
    return { linhas };
  })
  .handler(async ({ data, context }) => {
    const rows = data.linhas
      .map((l) => ({
        identificador: normalizarIdentificador(String(l.identificador ?? "")),
        nome: String(l.nome ?? "").trim(),
        sobrenome: String(l.sobrenome ?? "").trim(),
        celular: String(l.celular ?? "").trim(),
        cidade: String(l.cidade ?? "").trim(),
        empresa: String(l.empresa ?? "").trim(),
        cargo: String(l.cargo ?? "").trim(),
        email: String(l.email ?? "").trim(),
      }))
      .filter((l) => l.identificador);

    if (!rows.length) throw new Error("Nenhum identificador válido na planilha");

    const { error } = await context.supabase
      .from("participantes")
      .upsert(rows, { onConflict: "identificador" });
    if (error) throw new Error(error.message);
    return { importados: rows.length };
  });

export const listarParticipantes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("participantes")
      .select("identificador, nome, sobrenome, empresa, cidade")
      .order("nome")
      .limit(500);
    if (error) throw new Error(error.message);
    return { participantes: data ?? [] };
  });
