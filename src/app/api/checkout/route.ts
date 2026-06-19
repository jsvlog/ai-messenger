// ============================================================
// Lemon Squeezy Checkout Route
// Lemon Squeezy Checkout Route
// Plans: starter (₱499/mo), pro (₱999/mo), starter-annual (₱3,999/yr), pro-annual (₱7,999/yr)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckout } from '@/lib/lemonsqueezy';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const plan = searchParams.get('plan'); // 'starter' | 'pro' | 'starter-annual' | 'pro-annual'

  // Map plan to Lemon Squeezy variant ID from env
  const variantMap: Record<string, string> = {
    'starter': process.env.LEMON_SQUEEZY_VARIANT_STARTER || process.env.LEMON_SQUEEZY_VARIANT_2W || '',
    'pro': process.env.LEMON_SQUEEZY_VARIANT_PRO || process.env.LEMON_SQUEEZY_VARIANT_12W || '',
    'starter-annual': process.env.LEMON_SQUEEZY_VARIANT_STARTER_ANNUAL || '',
    'pro-annual': process.env.LEMON_SQUEEZY_VARIANT_PRO_ANNUAL || '',
    // Backward compat
    '2week': process.env.LEMON_SQUEEZY_VARIANT_STARTER || process.env.LEMON_SQUEEZY_VARIANT_2W || '',
    '4week': process.env.LEMON_SQUEEZY_VARIANT_STARTER || process.env.LEMON_SQUEEZY_VARIANT_4W || '',
    '12week': process.env.LEMON_SQUEEZY_VARIANT_PRO || process.env.LEMON_SQUEEZY_VARIANT_12W || '',
  };

  const variantId = variantMap[plan];
  if (!variantId) {
    console.error(`[Checkout] No variant ID for plan "${plan}". Env vars set: STARTER=${!!process.env.LEMON_SQUEEZY_VARIANT_STARTER}, PRO=${!!process.env.LEMON_SQUEEZY_VARIANT_PRO}, STARTER_ANNUAL=${!!process.env.LEMON_SQUEEZY_VARIANT_STARTER_ANNUAL}, PRO_ANNUAL=${!!process.env.LEMON_SQUEEZY_VARIANT_PRO_ANNUAL}`);
    return NextResponse.json({ error: `Plan "${plan}" is not available yet. Please try again or contact support.` }, { status: 400 });
  }

  // Get user email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();

  const checkoutUrl = await createCheckout({
    variantId,
    userId: user.id,
    userEmail: profile?.email || user.email || '',
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
  });

  if (!checkoutUrl) {
    // Diagnostic: check what's configured
    const hasApiKey = !!process.env.LEMON_SQUEEZY_API_KEY;
    const hasStoreId = !!process.env.LEMON_SQUEEZY_STORE_ID;
    return NextResponse.json({
      error: 'Failed to create checkout',
      debug: { hasApiKey, hasStoreId, variantId, plan }
    }, { status: 500 });
  }

  return NextResponse.redirect(checkoutUrl);
}
