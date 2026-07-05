import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  // 1. Verificar que el webhook viene realmente de Stripe
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Webhook signature inválida:", err.message);
    return new Response("Webhook error", { status: 400 });
  }

  // 2. Solo nos interesa el evento de pago completado
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;

    if (!userId) {
      console.error("No se encontró user_id en metadata");
      return new Response("OK", { status: 200 });
    }

    // 3. Actualizar tabla users en Supabase con el estado de suscripción
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service role para escribir sin restricciones RLS
    );

    const { error } = await supabase
      .from("perfiles_alumnos")
      .update({
        subscription_status: "active",
        subscription_type: "individual",
        subscription_expires_at: new Date("2027-06-30").toISOString(),
        stripe_session_id: session.id,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error actualizando usuario:", error);
      return new Response("DB error", { status: 500 });
    }

    console.log(`✅ Suscripción activada para usuario ${userId}`);
  }

  return new Response("OK", { status: 200 });
});
