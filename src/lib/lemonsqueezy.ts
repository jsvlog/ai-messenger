// ============================================================
// Lemon Squeezy — Checkout & Subscription helpers
// ============================================================

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1';

export interface LSCheckoutParams {
  variantId: string;
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Create a Lemon Squeezy checkout session.
 */
export async function createCheckout(params: LSCheckoutParams): Promise<string | null> {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    console.error('[LS] Missing API key or store ID — set LEMON_SQUEEZY_API_KEY and LEMON_SQUEEZY_STORE_ID in Vercel env vars');
    return null;
  }

  try {
    const res = await fetch(`${LS_API_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: params.userEmail,
              custom: {
                user_id: params.userId,
              },
            },
            product_options: {
              redirect_url: params.successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
            },
            checkout_options: {
              embed: true,
              media: true,
              logo: true,
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: params.variantId,
              },
            },
          },
        },
      }),
    });

    const data = await res.json();

    if (data.errors) {
      console.error(`[LS] Checkout error HTTP ${res.status} — API response:`, JSON.stringify(data.errors, null, 2).slice(0, 500));
      return null;
    }

    const checkoutUrl = data.data?.attributes?.url;
    if (!checkoutUrl) {
      console.error(`[LS] No checkout URL in response (HTTP ${res.status}):`, JSON.stringify(data).slice(0, 300));
      return null;
    }

    return checkoutUrl;
  } catch (err) {
    console.error('[LS] Checkout creation failed:', err);
    return null;
  }
}

/**
 * Verify a Lemon Squeezy webhook signature.
 */
export function verifyLSWebhook(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return false;
  }

  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Calculate subscription expiry based on plan variant.
 * Starter/Pro: 30 days. Pro Annual: 365 days.
 */
export function getPlanExpiry(variantId: string): Date {
  const now = new Date();
  const days30 = 30 * 24 * 60 * 60 * 1000;
  const days365 = 365 * 24 * 60 * 60 * 1000;

  const PRO_ANNUAL = process.env.LEMON_SQUEEZY_VARIANT_PRO_ANNUAL;
  const STARTER_ANNUAL = process.env.LEMON_SQUEEZY_VARIANT_STARTER_ANNUAL;

  if (variantId === PRO_ANNUAL || variantId === STARTER_ANNUAL) {
    return new Date(now.getTime() + days365);
  }

  // All monthly plans: 30 days
  return new Date(now.getTime() + days30);
}

/**
 * Get plan details for display.
 */
export function getPlanDetails(variantId: string): { name: string; period: string } {
  const PRO_ANNUAL = process.env.LEMON_SQUEEZY_VARIANT_PRO_ANNUAL;
  const STARTER_ANNUAL = process.env.LEMON_SQUEEZY_VARIANT_STARTER_ANNUAL;
  const PRO = process.env.LEMON_SQUEEZY_VARIANT_PRO;
  const STARTER = process.env.LEMON_SQUEEZY_VARIANT_STARTER;

  if (variantId === PRO_ANNUAL) return { name: 'Pro Annual', period: '12 months' };
  if (variantId === STARTER_ANNUAL) return { name: 'Starter Annual', period: '12 months' };
  if (variantId === PRO) return { name: 'Pro', period: '1 month' };
  if (variantId === STARTER) return { name: 'Starter', period: '1 month' };

  return { name: 'Starter', period: '1 month' };
}
