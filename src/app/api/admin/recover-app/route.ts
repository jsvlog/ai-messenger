// ============================================================
// Admin Recovery Route — Reconnect all pages to a new Meta App
// ============================================================
// When the old Meta app is banned/disabled, the admin creates a
// new Meta app, gets a user access token, and runs this endpoint.
// It fetches all pages the admin manages, updates their tokens in
// Supabase, and subscribes each page to the new app's webhook.
//
// Protected: only the configured admin email can call this.

import { NextRequest, NextResponse } from 'next/server';
import { createClient, getServiceClient } from '@/lib/supabase/server';
import {
  getUserPages,
  subscribePageToWebhook,
  exchangeForLongLivedToken,
} from '@/lib/facebook';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sczyrynjohnson@gmail.com';

export async function POST(request: NextRequest) {
  const t0 = Date.now();

  // ============================================================
  // 1. Auth check — only the admin can run this
  // ============================================================
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user?.email) {
    console.error('[Recover-App] Unauthorized — no valid session');
    return NextResponse.json(
      { success: false, error: 'You must be logged in as admin.' },
      { status: 401 }
    );
  }

  if (userData.user.email !== ADMIN_EMAIL) {
    console.error(`[Recover-App] Unauthorized — ${userData.user.email} is not admin`);
    return NextResponse.json(
      { success: false, error: 'Only the admin can run recovery.' },
      { status: 403 }
    );
  }

  console.log(`[Recover-App] Admin ${userData.user.email} authorized`);

  // ============================================================
  // 2. Parse input
  // ============================================================
  let body: { userAccessToken: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body. Provide { userAccessToken: string }.' },
      { status: 400 }
    );
  }

  const { userAccessToken } = body;

  if (!userAccessToken || typeof userAccessToken !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid userAccessToken.' },
      { status: 400 }
    );
  }

  // ============================================================
  // 3. Exchange for long-lived token
  // ============================================================
  console.log('[Recover-App] Exchanging for long-lived token...');
  const longLived = await exchangeForLongLivedToken(userAccessToken);

  const accessToken = longLived?.access_token || userAccessToken;
  const expiresIn = longLived?.expires_in || null;

  if (longLived) {
    console.log(`[Recover-App] Long-lived token obtained (expires in ${expiresIn}s)`);
  } else {
    console.warn('[Recover-App] Token exchange failed — proceeding with provided token');
  }

  // ============================================================
  // 4. Fetch all pages the admin manages
  // ============================================================
  console.log('[Recover-App] Fetching pages from Meta...');
  const { pages, rawResponse } = await getUserPages(accessToken);

  if (pages.length === 0) {
    console.error('[Recover-App] No pages found for this user token.');
    return NextResponse.json({
      success: false,
      error: 'No pages found for this user token.',
      debug: {
        tokenExchangeSucceeded: !!longLived,
        rawResponse: rawResponse.slice(0, 500),
      },
    }, { status: 404 });
  }

  console.log(`[Recover-App] Found ${pages.length} pages from Meta API`);

  // ============================================================
  // 5. Match pages to DB and update tokens
  // ============================================================
  const serviceClient = getServiceClient();

  const details: Array<{
    pageId: string;
    pageName: string;
    dbMatched: boolean;
    tokenUpdated: boolean;
    webhookSubscribed: boolean;
    error?: string;
  }> = [];

  let pagesUpdated = 0;
  let pagesNotFound = 0;
  let webhooksSubscribed = 0;
  let webhooksFailed = 0;

  for (const page of pages) {
    const result = {
      pageId: page.id,
      pageName: page.name,
      dbMatched: false,
      tokenUpdated: false,
      webhookSubscribed: false,
    };

    // Find matching page in connected_pages
    const { data: existingPage, error: lookupError } = await serviceClient
      .from('connected_pages')
      .select('id, page_id, page_name')
      .eq('page_id', page.id)
      .maybeSingle();

    if (lookupError) {
      console.error(`[Recover-App] DB lookup error for page ${page.id}:`, lookupError.message);
      result.error = `DB lookup: ${lookupError.message}`;
      details.push(result);
      continue;
    }

    if (!existingPage) {
      console.log(`[Recover-App] Page ${page.id} (${page.name}) not in DB — skipping`);
      pagesNotFound++;
      details.push(result);
      continue;
    }

    result.dbMatched = true;

    // Update the page access token
    const { error: updateError } = await serviceClient
      .from('connected_pages')
      .update({
        page_access_token: page.access_token,
        page_name: page.name, // update name in case it changed
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPage.id);

    if (updateError) {
      console.error(`[Recover-App] Failed to update token for ${page.name}:`, updateError.message);
      result.error = `Token update: ${updateError.message}`;
      details.push(result);
      continue;
    }

    result.tokenUpdated = true;
    pagesUpdated++;
    console.log(`[Recover-App] ✓ Updated token for ${page.name} (${page.id})`);

    // Subscribe page to the new app's webhook
    const subscribed = await subscribePageToWebhook(page.access_token);
    if (subscribed) {
      result.webhookSubscribed = true;
      webhooksSubscribed++;
      console.log(`[Recover-App]   ✓ Webhook subscribed for ${page.name}`);
    } else {
      webhooksFailed++;
      console.error(`[Recover-App]   ✗ Webhook subscription failed for ${page.name}`);
    }

    details.push(result);
  }

  const elapsed = Date.now() - t0;

  // ============================================================
  // 6. Return summary
  // ============================================================
  const allSucceeded = pagesNotFound === 0 && webhooksFailed === 0;

  return NextResponse.json({
    success: allSucceeded,
    summary: {
      totalPagesFromMeta: pages.length,
      pagesUpdated,
      pagesNotFound,
      webhooksSubscribed,
      webhooksFailed,
      elapsedMs: elapsed,
      tokenExpiresIn: expiresIn,
    },
    details,
    nextSteps: [
      'Go to Meta Developer dashboard for your NEW app',
      'Verify webhook callback URL is set: https://ai-messenger-pi.vercel.app/api/webhook/facebook',
      'Verify token: hermes_ai_messenger_verify_2024',
      'In Messenger > Webhooks, manually subscribe to the "messages" field',
      'Test: send a message to any connected page — AI should respond',
    ],
  });
}
