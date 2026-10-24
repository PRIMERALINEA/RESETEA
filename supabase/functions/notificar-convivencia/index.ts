// supabase/functions/notificar-convivencia/index.ts
//
// Avisa por email (SIN contenido del caso) de un nuevo aviso de acoso escolar.
// Dos usos, ambos protegidos con la cabecera  x-webhook-secret:
//   1) Database Webhook en INSERT sobre reportes_acoso  -> aviso inmediato a emails_aviso del centro.
//   2) Llamada periódica (cron) con body {"modo":"recordatorio"} -> reenvía a los avisos que siguen
//      sin ser asumidos pasadas horas_recordatorio horas, y además escribe a las propias cuentas
//      de los receptores (para que el aviso no dependa de un único buzón).
//
// Secrets necesarios (supabase secrets set ...):
//   WEBHOOK_SECRET   cadena larga aleatoria (la misma que pondrás en la cabecera del webhook y del cron)
//   RESEND_API_KEY   clave de Resend (dominio de envío verificado)
//   MAIL_FROM        p.ej.  "Resetea <avisos@tudominio.com>"
//   APP_URL          p.ej.  "https://resetea-two.vercel.app"
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase automáticamente.
//
// Despliegue:  supabase functions deploy notificar-convivencia --no-verify-jwt
// (se desactiva la verificación de JWT porque el webhook no lleva JWT de usuario;
//  la autenticación es el secreto compartido de arriba)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const APP_URL = (Deno.env.get("APP_URL") ?? "").replace(/\/$/, "");

async function enviarEmail(to: string[], asunto: string, texto: string) {
  const destinatarios = [...new Set(to.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (destinatarios.length === 0) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("MAIL_FROM"),
      to: destinatarios,
      subject: asunto,
      text: texto,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}

const PIE =
  "\n\nEste mensaje no contiene datos del caso. Accede con tu cuenta y la verificación en dos pasos.\n" +
  "No respondas a este correo.";

async function avisoInmediato(record: { id: string; centro_id: string; urgente?: boolean }) {
  const { data: cfg, error } = await supabase
    .from("config_convivencia")
    .select("emails_aviso, activo")
    .eq("centro_id", record.centro_id)
    .maybeSingle();
  if (error) throw error;
  if (!cfg?.activo || !cfg.emails_aviso?.length) {
    console.warn("Centro sin canal activo o sin emails de aviso:", record.centro_id);
    return;
  }
  const prefijo = record.urgente ? "[URGENTE] " : "";
  await enviarEmail(
    cfg.emails_aviso,
    `${prefijo}Nuevo aviso de convivencia en Resetea`,
    `Se ha recibido un nuevo aviso de convivencia${record.urgente ? " marcado como urgente" : ""}.\n\n` +
      `Entra en: ${APP_URL}/convivencia` + PIE,
  );
}

async function recordatorios() {
  const { data: configs, error } = await supabase
    .from("config_convivencia")
    .select("centro_id, emails_aviso, horas_recordatorio")
    .eq("activo", true);
  if (error) throw error;

  let enviados = 0;
  for (const cfg of configs ?? []) {
    const horas = cfg.horas_recordatorio ?? 4;
    const limite = new Date(Date.now() - horas * 3600_000).toISOString();

    const { data: pendientes, error: e2 } = await supabase
      .from("reportes_acoso")
      .select("id")
      .eq("centro_id", cfg.centro_id)
      .eq("estado", "pendiente")
      .is("responsable_id", null)
      .lt("created_at", limite)
      .or(`ultimo_recordatorio.is.null,ultimo_recordatorio.lt.${limite}`);
    if (e2) throw e2;
    if (!pendientes?.length) continue;

    // Emails de las cuentas de los receptores (además del buzón del centro)
    const { data: receptores } = await supabase
      .from("receptores_convivencia")
      .select("user_id")
      .eq("centro_id", cfg.centro_id)
      .eq("activo", true);
    const emailsReceptores: string[] = [];
    for (const r of receptores ?? []) {
      const { data } = await supabase.auth.admin.getUserById(r.user_id);
      if (data?.user?.email) emailsReceptores.push(data.user.email);
    }

    const n = pendientes.length;
    await enviarEmail(
      [...(cfg.emails_aviso ?? []), ...emailsReceptores],
      `RECORDATORIO: ${n === 1 ? "1 aviso de convivencia sin asumir" : `${n} avisos de convivencia sin asumir`}`,
      `Hay ${n === 1 ? "un aviso" : `${n} avisos`} de convivencia que lleva${n === 1 ? "" : "n"} más de ${horas} horas sin que nadie se haga cargo.\n\n` +
        `Entra en: ${APP_URL}/convivencia` + PIE,
    );

    await supabase
      .from("reportes_acoso")
      .update({ ultimo_recordatorio: new Date().toISOString() })
      .in("id", pendientes.map((p) => p.id));
    enviados++;
  }
  return enviados;
}

serve(async (req) => {
  // Autenticación por secreto compartido
  const secreto = Deno.env.get("WEBHOOK_SECRET");
  if (!secreto || req.headers.get("x-webhook-secret") !== secreto) {
    return new Response("No autorizado", { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    if (body?.modo === "recordatorio") {
      const n = await recordatorios();
      return new Response(JSON.stringify({ ok: true, centros_avisados: n }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Database Webhook: { type: "INSERT", table: "reportes_acoso", record: {...} }
    if (body?.type === "INSERT" && body?.table === "reportes_acoso" && body?.record?.id) {
      await avisoInmediato(body.record);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Petición no reconocida", { status: 400 });
  } catch (err) {
    console.error("notificar-convivencia error:", (err as Error).message);
    return new Response("Error interno", { status: 500 });
  }
});
