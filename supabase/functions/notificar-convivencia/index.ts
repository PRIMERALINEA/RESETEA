import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No autorizado");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error("Usuario no encontrado");

    const userId = authUser.user.id;
    const userEmail = authUser.user.email!;

    const appUrl = Deno.env.get("APP_URL")!;
    const priceId = Deno.env.get("STRIPE_PRICE_ID")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;

    const params = new URLSearchParams({
      "payment_method_types[0]": "card",
      "mode": "payment",
      "customer_email": userEmail,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "metadata[user_id]": userId,
      "success_url": `${appUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url": `${appUrl}/acceso-individual`,
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      throw new Error(session.error?.message || "Error al crear sesión de pago");
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
