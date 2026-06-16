// ============================================================
// Lemon Squeezy Checkout Route
// Plans: starter (₱499/mo), pro (₱999/mo), pro-annual (₱7,999/yr)
// ============================================================

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
  const plan = searchParams.get('plan'); // 'starter' | 'pro' | 'pro-annual'

  // Map plan to Lemon Squeezy variant ID
  const variantMap: Record<string, string> = {
    'starter': process.env.LEMON_SQUEEZY_VARIANT_STARTER || '',
    'pro': process.env.LEMON_SQUEEZY_VARIANT_PRO || '',
    'pro-annual': process.env.LEMON_SQUEEZY_VARIANT_PRO_ANNUAL || '',
    // Backward compat — keep old mappings until LS variants are updated
    '2week': process.env.LEMON_SQUEEZY_VARIANT_STARTER || process.env.LEMON_SQUEEZY_VARIANT_2W || '',
    '4week': process.env.LEMON_SQUEEZY_VARIANT_STARTER || process.env.LEMON_SQUEEZY_VARIANT_4W || '',
    '12week': process.env.LEMON_SQUEEZY_VARIANT_PRO || process.env.LEMON_SQUEEZY_VARIANT_12W || '',
  };

  const variantId = variantMap[plan];
  if (!variantId) {
    return NextResponse.json({ error: `Invalid plan: ${plan}` }, { status: 400 });
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
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }

  return NextResponse.redirect(checkoutUrl);
}
