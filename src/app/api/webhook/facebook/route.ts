// ============================================================
// Meta Webhook Listener — GET (challenge) + POST (events)
// ============================================================
// CRITICAL: Must respond 200 OK within 3 seconds for Meta,
// then kick off async AI processing via internal fetch.

import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { verifyWebhook, isPageAdmin } from '@/lib/facebook';
import { getServiceClient } from '@/lib/supabase/server';
import type { MetaWebhookBody, MetaMessagingEvent } from '@/lib/types';

/**
 * GET: Meta Platform verification challenge
 * Meta sends: GET ?hub.mode=subscribe&hub.challenge=X&hub.verify_token=Y
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('[Webhook] GET verification:', { mode, token: token ? '***' : null });

  const result = verifyWebhook(mode || '', token || '', challenge || '');

  if (result.valid) {
    console.log('[Webhook] ✓ Verification successful');
    return new NextResponse(result.challenge, { status: 200 });
  }

  console.log('[Webhook] ✗ Verification failed');
  return new NextResponse('Verification failed', { status: 403 });
}

/**
 * POST: Incoming Messenger events
 * Meta sends: JSON body with messaging events
 * RULE: Save to DB + respond 200 OK within 3 seconds, then process async.
 */
export async function POST(request: NextRequest) {
  const t0 = Date.now();

  try {
    const body: MetaWebhookBody = await request.json();
    console.log('[Webhook] POST received:', JSON.stringify(body).slice(0, 300));

    // Validate — it must be a page event
    if (body.object !== 'page') {
      return NextResponse.json({ error: 'Unsupported object type' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Process all entries in parallel (but fast — just save, don't wait for AI)
    const processingPromises: Promise<void>[] = [];

    for (const entry of body.entry) {
      const pageId = entry.id;

      // Find connected page in our DB
      const { data: connectedPage } = await supabase
        .from('connected_pages')
        .select('id, page_id, page_access_token, page_name')
        .eq('page_id', pageId)
        .single();

      if (!connectedPage) {
        console.log(`[Webhook] Page ${pageId} not found in our DB — skipping`);
        continue;
      }

      for (const event of entry.messaging) {
        // Skip non-message events (postbacks, read receipts, etc.)
        if (!event.message?.text) {
          continue;
        }

        const senderPsid = event.sender.id;
        const messageText = event.message.text;
        const metaMid = event.message.mid;

        // Check if sender is page admin (triggers cooldown)
        let isFromAdmin = false;

        // Fast admin check — we do this in parallel with saving
        const adminCheckPromise = isPageAdmin(
          connectedPage.page_access_token,
          connectedPage.page_id,
          senderPsid
        ).then((admin) => {
          isFromAdmin = admin;
          return admin;
        });

        // 1. IMMEDIATELY save incoming message to DB
        const savePromise = supabase
          .from('message_logs')
          .insert({
            page_id: connectedPage.id,
            sender_psid: senderPsid,
            recipient_id: pageId,
            direction: 'incoming',
            message_text: messageText,
            attachments: event.message.attachments
              ? JSON.stringify(event.message.attachments)
              : '[]',
            meta_mid: metaMid,
            is_from_admin: false, // will update if admin
            ai_processed: false,
          })
          .select('id')
          .single();

        // Wait for save + admin check
        const [adminResult] = await Promise.all([
          adminCheckPromise,
          savePromise,
        ]);

        // Update is_from_admin if needed
        if (adminResult) {
          // Save was already done, update the is_from_admin flag
          await supabase
            .from('message_logs')
            .update({ is_from_admin: true })
            .eq('meta_mid', metaMid);

          // ADMIN DETECTED → Trigger 30-minute AI cooldown
          console.log(`[Webhook] ⚠ Admin message detected from ${senderPsid} on page ${connectedPage.page_name}`);
          const cooldownUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();

          await supabase
            .from('page_settings')
            .upsert(
              {
                page_id: connectedPage.id,
                ai_paused_until: cooldownUntil,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'page_id' }
            );

          console.log(`[Webhook] AI paused for page ${connectedPage.page_name} until ${cooldownUntil}`);
        }

        // 2. Kick off async AI processing (don't await — must respond in 3s)
        if (!adminResult) {
          processingPromises.push(
            triggerAsyncAIProcessing({
              pageId: connectedPage.id,
              pageName: connectedPage.page_name,
              pageAccessToken: connectedPage.page_access_token,
              senderPsid,
              messageText,
              metaMid,
            })
          );
        }
      }
    }

    // Respond 200 OK immediately (Meta requires <3s response)
    const elapsed = Date.now() - t0;
    console.log(`[Webhook] Responding 200 OK in ${elapsed}ms`);

    // Use waitUntil to keep the function alive for background processing
    // (Vercel normally kills the function after response is sent)
    waitUntil(
      Promise.all(processingPromises).catch((err) => {
        console.error('[Webhook] Background AI processing error:', err);
      })
    );

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } catch (err) {
    console.error('[Webhook] Fatal error:', err);
    // Still return 200 so Meta doesn't keep retrying
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }
}

/**
 * Trigger the internal AI processing route asynchronously.
 * Uses fetch to call our own API — this runs after the 200 OK response.
 */
async function triggerAsyncAIProcessing(payload: {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  senderPsid: string;
  messageText: string;
  metaMid: string;
}) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/process-ai`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || 'dev-secret-change-in-prod',
      },
      body: JSON.stringify({
        page_id: payload.pageId,
        sender_psid: payload.senderPsid,
        message_text: payload.messageText,
        meta_mid: payload.metaMid,
        page_name: payload.pageName,
        page_access_token: payload.pageAccessToken,
        timestamp: Date.now(),
        is_from_admin: false,
      }),
    });

    if (!res.ok) {
      console.error(`[Webhook] AI processing trigger failed: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error('[Webhook] Failed to trigger AI processing:', err);
  }
}
