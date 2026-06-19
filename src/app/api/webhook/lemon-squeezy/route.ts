// ============================================================
// Lemon Squeezy Webhook Handler
// Receives order.created, subscription.expired, subscription.cancelled
// Plans: starter (₱499/mo), pro (₱999/mo), pro-annual (₱7,999/yr)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { getPlanExpiry } from '@/lib/lemonsqueezy';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const eventName = body.meta?.event_name;
    const eventData = body.data;

    console.log('[LS Webhook] Event:', eventName);

    const supabase = getServiceClient();

    switch (eventName) {
      // ---- ORDER CREATED (payment completed) ----
      case 'order_created': {
        const customData = eventData.attributes?.custom_data;
        if (!customData?.user_id) {
          console.error('[LS Webhook] No user_id in custom data');
          return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
        }

        const userId = customData.user_id;
        const variantId = eventData.attributes?.variant_id?.toString();
        const orderId = eventData.id;
        const expiresAt = getPlanExpiry(variantId);

        // Determine plan name from variant
        let planName = 'starter';
        const STARTER = process.env.LEMON_SQUEEZY_VARIANT_STARTER || process.env.LEMON_SQUEEZY_VARIANT_2W;
        const STARTER_ANNUAL = process.env.LEMON_SQUEEZY_VARIANT_STARTER_ANNUAL;
        const PRO = process.env.LEMON_SQUEEZY_VARIANT_PRO || process.env.LEMON_SQUEEZY_VARIANT_12W;
        const PRO_ANNUAL = process.env.LEMON_SQUEEZY_VARIANT_PRO_ANNUAL;

        if (variantId === PRO) planName = 'pro';
        else if (variantId === PRO_ANNUAL) planName = 'pro-annual';
        else if (variantId === STARTER) planName = 'starter';
        else if (variantId === STARTER_ANNUAL) planName = 'starter-annual';
        // backward compat
        else if (variantId === process.env.LEMON_SQUEEZY_VARIANT_4W) planName = 'starter';

        // Upsert subscription
        const { error } = await (supabase.from('subscriptions') as any).upsert(
          {
            user_id: userId,
            lemon_squeezy_id: orderId,
            variant_id: variantId,
            plan: planName,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'lemon_squeezy_id' }
        );

        if (error) {
          console.error('[LS Webhook] DB insert error:', error);
          return NextResponse.json({ error: 'DB error' }, { status: 500 });
        }

        // Update profile plan
        const profilePlan = planName === 'pro-annual' ? 'pro' : planName === 'starter-annual' ? 'starter' : planName;
        await supabase
          .from('profiles')
          .update({ plan: profilePlan, updated_at: new Date().toISOString() })
          .eq('id', userId);

        console.log(`[LS Webhook] ✓ Subscription activated for user ${userId} (plan: ${planName})`);
        break;
      }

      // ---- SUBSCRIPTION EXPIRED ----
      case 'subscription_expired': {
        const lsId = eventData.id;
        await supabase
          .from('subscriptions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('lemon_squeezy_id', lsId);

        // Downgrade profile to free
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('lemon_squeezy_id', lsId)
          .single();

        if (sub?.user_id) {
          await supabase
            .from('profiles')
            .update({ plan: 'free', updated_at: new Date().toISOString() })
            .eq('id', sub.user_id);
        }

        console.log(`[LS Webhook] Subscription ${lsId} expired`);
        break;
      }

      // ---- SUBSCRIPTION CANCELLED ----
      case 'subscription_cancelled': {
        const lsId = eventData.id;
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('lemon_squeezy_id', lsId);

        console.log(`[LS Webhook] Subscription ${lsId} cancelled`);
        break;
      }

      default:
        console.log(`[LS Webhook] Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[LS Webhook] Fatal error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
