// supabase/functions/stripe-portal/index.ts
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const PORTAL_ID = Deno.env.get('STRIPE_PORTAL_ID') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve({ verify_jwt: false }, async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, return_url } = await req.json()

    // Buscar customer en Stripe por email
    const searchRes = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`,
      { headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } }
    )
    const searchData = await searchRes.json()
    const customer = searchData.data?.[0]
    if (!customer) throw new Error('No se encontró el cliente en Stripe')

    // Crear sesión del portal
    const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'customer': customer.id,
        'return_url': return_url,
        ...(PORTAL_ID ? { 'configuration': PORTAL_ID } : {}),
      }),
    })

    const portal = await portalRes.json()
    if (!portalRes.ok) throw new Error(portal.error?.message || 'Error al crear portal')

    return new Response(
      JSON.stringify({ url: portal.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
