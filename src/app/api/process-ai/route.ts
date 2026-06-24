// ============================================================
// AI Processing Route — Vector search → OpenRouter → Meta Send
// ============================================================
// Called by the webhook handler asynchronously (after 200 OK).
// Internal only — protected by X-Internal-Secret header.

import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { sendMessage, getSenderProfile } from '@/lib/facebook';
import {
  generateEmbedding,
  callOpenRouter,
  buildTaglishPrompt,
  extractLeadInfo,
} from '@/lib/ai-engine';
import type {
  LeadInfo,
  ChatHistoryItem,
  VectorMatchResult,
  ConversationContext,
} from '@/lib/types';
import { checkTierLimit } from '@/lib/tier-limit';

export async function POST(request: NextRequest) {
  const t0 = Date.now();

  // Verify internal secret
  const secret = request.headers.get('x-internal-secret');
  const expected = process.env.INTERNAL_API_SECRET || 'dev-secret-change-in-prod';

  if (secret !== expected) {
    console.error('[Process-AI] Unauthorized — invalid secret');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const {
      page_id,
      sender_psid,
      message_text,
      meta_mid,
      page_name,
      page_access_token,
    } = payload;

    console.log(`[Process-AI] Processing message for page ${page_name} from ${sender_psid}`);

    const supabase = getServiceClient();

    // ==================================================
    // 1. Check if AI should respond (toggle, cooldown, schedule)
    // ==================================================
    const { data: shouldRespond } = await supabase.rpc('should_ai_respond', {
      p_page_id: page_id,
    });

    if (shouldRespond === false) {
      console.log('[Process-AI] AI is currently paused/disabled — skipping');
      return NextResponse.json({ status: 'skipped', reason: 'ai_disabled' });
    }

    // ==================================================
    // 2. Check free tier limit
    // ==================================================
    // Get the user_id for this page
    const { data: pageOwner } = await supabase
      .from('connected_pages')
      .select('user_id')
      .eq('id', page_id)
      .single();

    if (pageOwner) {
      const tierCheck = await checkTierLimit(page_id, pageOwner.user_id, supabase);
      if (!tierCheck.allowed) {
        console.log('[Process-AI] Free tier limit reached — sending upgrade prompt');
        // Send an upgrade nudge instead of AI reply
        await sendMessage(
          page_access_token,
          sender_psid,
          `Hi po! 👋 Pasensya na, na-reach na po namin yung daily message limit (20 messages) for our free plan.\n\nPara sa unlimited messages at mas maraming features, pwedeng mag-upgrade sa aming Starter (₱499/month) or Pro (₱999/month) plan.\n\nI-check niyo po dito: ${process.env.NEXT_PUBLIC_APP_URL}/pricing\n\nSalamat po! 🙏`
        );
        return NextResponse.json({ status: 'skipped', reason: 'tier_limit', remaining: tierCheck.remaining });
      }
    }

    // ==================================================
    // 3. Get or create conversation context (lead tracking + chat history)
    // ==================================================
    let { data: convo } = await supabase
      .from('conversation_context')
      .select('*')
      .eq('page_id', page_id)
      .eq('sender_psid', sender_psid)
      .single();

    if (!convo) {
      // First message in this conversation — create context
      const { data: newConvo } = await supabase
        .from('conversation_context')
        .insert({
          page_id,
          sender_psid,
          context_json: {
            history: [],
            lead_info: {
              name: null,
              phone: null,
              email: null,
              event_date: null,
              budget: null,
              guest_count: null,
              event_type: null,
              captured: false,
            },
          },
          last_active: new Date().toISOString(),
        })
        .select('*')
        .single();

      convo = newConvo;
    }

    if (!convo) {
      console.error('[Process-AI] Failed to create/get conversation context');
      return NextResponse.json({ error: 'Context error' }, { status: 500 });
    }

    // ==================================================
    // 3. Extract lead info from the incoming message
    // ==================================================
    const contextData = convo.context_json as ConversationContext['context_json'];
    const updatedLeadInfo = extractLeadInfo(message_text, contextData.lead_info);
    const leadChanged =
      JSON.stringify(updatedLeadInfo) !== JSON.stringify(contextData.lead_info);

    // ==================================================
    // 4. Vector similarity search on knowledge base
    // ==================================================
    let matchedChunks: VectorMatchResult[] = [];

    try {
      // Generate embedding for the customer's question
      const embedding = await generateEmbedding(message_text);

      if (embedding.length > 0) {
        // Query Supabase pgvector
        const { data: matches, error: matchError } = await supabase.rpc(
          'match_knowledge_chunks',
          {
            query_embedding: embedding,
            p_page_id: page_id,
            match_threshold: 0.65,
            match_count: 5,
          }
        );

        if (matchError) {
          console.error('[Process-AI] Vector search error:', matchError);
        } else if (matches) {
          matchedChunks = matches as VectorMatchResult[];
        }
      }
    } catch (err) {
      console.error('[Process-AI] Embedding/vector error:', err);
      // Continue without context — the AI prompt will handle it
    }

    console.log(
      `[Process-AI] Found ${matchedChunks.length} relevant knowledge chunks (top similarity: ${
        matchedChunks[0] ? (matchedChunks[0].similarity * 100).toFixed(1) + '%' : 'N/A'
      })`
    );

    // ==================================================
    // 5. Build chat history
    // ==================================================
    const chatHistory: ChatHistoryItem[] = [
      ...contextData.history,
      { role: 'user' as const, content: message_text, timestamp: new Date().toISOString() },
    ];

    // ==================================================
    // 6. Get sender profile (for personalization)
    // ==================================================
    let senderName = '';
    try {
      const profile = await getSenderProfile(page_access_token, sender_psid);
      if (profile?.first_name) {
        senderName = profile.first_name;
      }
    } catch {
      // Non-critical — continue without name
    }

    // ==================================================
    // 7. Fetch knowledge base for industry detection
    // ==================================================
    const { data: kbData } = await supabase
      .from('knowledge_bases')
      .select('content_type, content_md')
      .eq('page_id', page_id)
      .eq('is_active', true)
      .limit(5);

    // ==================================================
    // 8. Build Taglish prompt + Call OpenRouter
    // ==================================================
    const greeting = senderName ? `${senderName}, ` : '';
    const userMessageForAI = `${greeting}Customer message: "${message_text}"`;

    // Determine industry from KB content_type
    let industryType: 'rentals' | 'catering' | 'general' = 'general';
    if (kbData && kbData.length > 0) {
      const ct = kbData[0].content_type || '';
      if (ct.includes('catering')) industryType = 'catering';
      else if (ct.includes('rentals')) industryType = 'rentals';
      else if (ct.includes('salon') || ct.includes('clinic') || ct.includes('photography') || ct.includes('realestate')) industryType = 'general';
      // Try to read from stored JSON
      try {
        const parsed = JSON.parse(kbData[0].content_md);
        if (parsed.industryId) {
          industryType = (['catering', 'rentals', 'general'].includes(parsed.industryId) ? parsed.industryId : 'general') as any;
        }
      } catch {}
    }

    const systemPrompt = buildTaglishPrompt(
      matchedChunks,
      updatedLeadInfo,
      chatHistory,
      page_name,
      industryType
    );

    const aiResult = await callOpenRouter(systemPrompt, userMessageForAI);
    const aiResponse = aiResult.content;

    console.log(
      `[Process-AI] AI response generated in ${aiResult.latencyMs}ms (model: ${aiResult.model}, tokens: ${aiResult.tokensUsed})`
    );

    // ==================================================
    // 8. Send reply via Meta Send API
    // ==================================================
    const sendResult = await sendMessage(page_access_token, sender_psid, aiResponse);

    // ==================================================
    // 9. Save outgoing message to DB
    // ==================================================
    await supabase.from('message_logs').insert({
      page_id,
      sender_psid,
      recipient_id: sender_psid,
      direction: 'outgoing',
      message_text: aiResponse,
      meta_mid: sendResult.messageId || null,
      ai_processed: true,
      ai_response: aiResponse,
      ai_confidence: matchedChunks[0]?.similarity || null,
      ai_sources: matchedChunks.map((c) => ({
        id: c.id,
        similarity: c.similarity,
        snippet: c.content.slice(0, 100),
      })),
      ai_latency_ms: aiResult.latencyMs,
      is_from_admin: false,
    });

    // ==================================================
    // 10. Update conversation context
    // ==================================================
    const updatedHistory: ChatHistoryItem[] = [
      ...chatHistory,
      {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      },
    ];

    // Keep only last 20 messages to avoid context bloat
    const trimmedHistory = updatedHistory.slice(-20);

    await supabase
      .from('conversation_context')
      .update({
        context_json: {
          history: trimmedHistory,
          lead_info: updatedLeadInfo,
        },
        last_active: new Date().toISOString(),
      })
      .eq('id', convo.id);

    // ==================================================
    // 11. Mark incoming message as processed
    // ==================================================
    await supabase
      .from('message_logs')
      .update({ ai_processed: true })
      .eq('meta_mid', meta_mid);

    const totalMs = Date.now() - t0;
    console.log(
      `[Process-AI] ✓ Done — reply sent in ${totalMs}ms | lead: ${updatedLeadInfo.name || '?'} | phone: ${updatedLeadInfo.phone || '?'} | budget: ${updatedLeadInfo.budget || '?'}`
    );

    return NextResponse.json({
      status: 'ok',
      ai_model: aiResult.model,
      latency_ms: totalMs,
      sent: sendResult.success,
      chunks_used: matchedChunks.length,
      lead_captured: updatedLeadInfo.captured,
    });
  } catch (err) {
    console.error('[Process-AI] Fatal error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
