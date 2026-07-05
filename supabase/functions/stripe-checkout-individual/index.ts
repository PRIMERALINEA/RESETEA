// supabase/functions/stripe-checkout-individual/index.ts
// @ts-ignore
Deno.serve({ verify_jwt: false }, async (req) => {
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? ''

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { price_id, user_id, email, success_url, cancel_url } = await req.json()

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'customer_email': email,
        'line_items[0][price]': price_id,
        'line_items[0][quantity]': '1',
        'success_url': success_url,
        'cancel_url': cancel_url,
        'metadata[user_id]': user_id,
        'subscription_data[metadata][user_id]': user_id,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Stripe error: ${err}`)
    }

    const session = await res.json()

    return new Response(
      JSON.stringify({ session_id: session.id, url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})