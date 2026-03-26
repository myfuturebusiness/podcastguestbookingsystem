export interface PayPalCredentials {
  clientId: string
  clientSecret: string
}

function getBaseUrl() {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

async function getAccessToken(creds: PayPalCredentials): Promise<string> {
  const credentials = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')

  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  const data = await res.json()
  if (!data.access_token) throw new Error('PayPal: failed to get access token')
  return data.access_token
}

export async function createPayPalOrder(params: {
  amountCents: number
  currency: string
  description: string
  returnUrl: string
  cancelUrl: string
  credentials: PayPalCredentials
}): Promise<{ orderId: string; approvalUrl: string }> {
  const accessToken = await getAccessToken(params.credentials)
  const amount = (params.amountCents / 100).toFixed(2)

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: params.description,
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: amount,
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            landing_page: 'LOGIN',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: params.returnUrl,
            cancel_url: params.cancelUrl,
          },
        },
      },
    }),
    cache: 'no-store',
  })

  const data = await res.json()
  const approvalUrl = data.links?.find((l: { rel: string; href: string }) => l.rel === 'payer-action')?.href

  if (!approvalUrl) throw new Error('PayPal: no approval URL in response')
  return { orderId: data.id, approvalUrl }
}

export async function capturePayPalOrder(
  orderId: string,
  credentials: PayPalCredentials
): Promise<{ success: boolean; captureId?: string }> {
  const accessToken = await getAccessToken(credentials)

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  const data = await res.json()
  const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id
  return { success: data.status === 'COMPLETED', captureId }
}

export async function refundPayPalCapture(
  captureId: string,
  credentials: PayPalCredentials
): Promise<boolean> {
  const accessToken = await getAccessToken(credentials)

  const res = await fetch(`${getBaseUrl()}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
    cache: 'no-store',
  })

  const data = await res.json()
  return data.status === 'COMPLETED'
}
