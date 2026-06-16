// ============================================================
// Free Tier Enforcement Middleware
// ============================================================
// Checks daily message count and plan status before AI processing.

export interface TierCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  resetAt?: string;
}

/**
 * Check if a page is allowed to use AI processing.
 * Free tier: 100 messages/day. Paid: unlimited until expiry.
 */
export async function checkTierLimit(
  pageId: string,
  userId: string,
  supabase: any // Using `any` since we haven't generated DB types yet
): Promise<TierCheckResult> {
  // 1. Check active subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('expires_at', { ascending: false })
    .limit(1)
    .single();

  if (sub && new Date(sub.expires_at) > new Date()) {
    // Paid plan active — unlimited
    return { allowed: true };
  }

  // 2. Free tier: count messages sent today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('message_logs')
    .select('*', { count: 'exact', head: true })
    .eq('page_id', pageId)
    .eq('direction', 'outgoing')
    .eq('ai_processed', true)
    .gte('created_at', today.toISOString());

  const msgCount = count || 0;
  const FREE_LIMIT = 20; // Free tier: 20 messages per day

  if (msgCount >= FREE_LIMIT) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      allowed: false,
      reason: `Daily limit of ${FREE_LIMIT} messages reached.`,
      remaining: 0,
      resetAt: tomorrow.toISOString(),
    };
  }

  return {
    allowed: true,
    remaining: FREE_LIMIT - msgCount,
    resetAt: new Date(today.getTime() + 86400000).toISOString(),
  };
}

/**
 * Check if user can add another page (free: 1 page, paid: unlimited/3).
 */
export async function checkPageLimit(
  userId: string,
  supabase: any
): Promise<{ allowed: boolean; max: number }> {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('expires_at', { ascending: false })
    .limit(1)
    .single();

  const { count } = await supabase
    .from('connected_pages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const pageCount = count || 0;

  if (!sub || new Date(sub.expires_at) <= new Date()) {
    // Free tier: 1 page
    return { allowed: pageCount < 1, max: 1 };
  }

  if (sub.plan === '12week') {
    // Pro: unlimited
    return { allowed: true, max: 999 };
  }

  // Starter: 3 pages
  return { allowed: pageCount < 3, max: 3 };
}
