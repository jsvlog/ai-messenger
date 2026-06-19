// ============================================================
// AI Engine — OpenRouter integration & Taglish prompt builder
// ============================================================

import type { OpenRouterResponse, VectorMatchResult, LeadInfo, ChatHistoryItem } from './types';
import { getIndustry } from './industries';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.0-flash-001'; // Cheap, fast, good Taglish
const FALLBACK_MODEL = 'openai/gpt-4o-mini';
const APP_NAME = 'AI Messenger';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aimessenger.vercel.app';

/**
 * Call OpenRouter to generate an embedding for semantic search.
 * Uses OpenAI-compatible embedding endpoint.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('[AI] No API key — using mock embedding');
    return new Array(1536).fill(0).map(() => Math.random() * 0.01);
  }

  try {
    // Try OpenRouter embedding endpoint first
    const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': APP_URL,
        'X-Title': APP_NAME,
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text,
      }),
    });

    const data = await res.json();
    if (data.data?.[0]?.embedding) {
      return data.data[0].embedding;
    }

    // Fallback: OpenAI directly
    if (process.env.OPENAI_API_KEY) {
      const oaiRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
      });
      const oaiData = await oaiRes.json();
      if (oaiData.data?.[0]?.embedding) {
        return oaiData.data[0].embedding;
      }
    }

    console.error('[AI] Embedding generation failed:', data);
    return [];
  } catch (err) {
    console.error('[AI] Embedding error:', err);
    return [];
  }
}

/**
 * Build the Taglish system prompt tailored for Rentals & Catering leads.
 * Injects knowledge base context from vector search results.
 */
export function buildTaglishPrompt(
  contextChunks: VectorMatchResult[],
  leadInfo: LeadInfo,
  chatHistory: ChatHistoryItem[],
  pageName: string,
  industry: 'rentals' | 'catering' | 'general'
): string {
  const industryConfig = getIndustry(industry);
  const contextText =
    contextChunks.length > 0
      ? contextChunks.map((c, i) => `[Context ${i + 1}] (relevance: ${(c.similarity * 100).toFixed(0)}%)\n${c.content}`).join('\n\n')
      : 'No specific knowledge base available yet — ask the customer for details and offer to help.';

  const leadContext =
    leadInfo.name || leadInfo.phone
      ? `\nCurrent lead info captured so far:\n- Name: ${leadInfo.name || 'not yet'}\n- Phone: ${leadInfo.phone || 'not yet'}\n- Event Date: ${leadInfo.event_date || 'not yet'}\n- Budget: ${leadInfo.budget || 'not yet'}\n- Guests (pax): ${leadInfo.guest_count || 'not yet'}\n- Event Type: ${leadInfo.event_type || 'not yet'}\n- Venue: ${leadInfo.venue || 'not yet'}`
      : '';

  const conversationHistory =
    chatHistory.length > 0
      ? '\n\nRecent conversation:\n' +
        chatHistory
          .slice(-6)
          .map((m) => `${m.role === 'user' ? 'Customer' : 'AI'}: ${m.content}`)
          .join('\n')
      : '';

  const knowledgeStr = industryConfig.aiKnows.map(k => `- ${k}`).join('\n');
  const flowStr = industryConfig.aiConversationFlow.map((f, i) => `${i + 1}. ${f}`).join('\n');
  const captureStr = industryConfig.aiCaptureFields
    .sort((a, b) => a.priority - b.priority)
    .map(c => `${c.priority}. **${c.label}** — "${c.question}"`)
    .join('\n');

  return `You are "Ate Girl" — a warm, bubbly, and super helpful AI sales agent for ${pageName}, a ${industryConfig.label.toUpperCase()} business in the Philippines.

${industryConfig.aiSpecialty}

YOU KNOW:
${knowledgeStr}

YOUR PERSONALITY:
- Speak in natural TAGLISH (mix of Tagalog and English) — casual, friendly, warm like a real Filipina ate
- Use "po" occasionally to show respect, but keep it natural — not every sentence
- Use Pinoy expressions naturally: "ay, sige po!", "teka lang po", "ayos!", "gets ko po", "sige-sige"
- Be conversational, never robotic. You're chatting on Messenger, not writing an email.
- Short messages only (1-3 sentences per reply). Don't overwhelm with walls of text.
- Always be encouraging and excited! Use emojis sparingly.

YOUR JOB — CAPTURE DETAILS (be natural, not interrogating!):
${captureStr}

CONVERSATION FLOW:
${flowStr}

RULES:
- NEVER mention you're an AI. You're "${pageName}'s messaging assistant."
- If asked about something NOT in the context, say "Ay, teka lang po — iche-check ko po sa team namin yan. Pwede ko pong i-note yung tanong niyo?" — never make up prices.
- When discussing pricing, ALWAYS be clear about what's included.
- If they want to customize or negotiate, be flexible: "Pwede po! Let me see what we can do for you."
- Keep the conversation flowing. If they give one detail, acknowledge it warmly then naturally ask the next question.

KNOWLEDGE BASE (your products, services, and policies):
${contextText}
${leadContext}
${conversationHistory}

Remember: You are a ${industryConfig.label} specialist. Capture details naturally. Be warm, be helpful, be Taglish. Short replies only! 🫶`;}


/**
 * Call OpenRouter to generate an AI reply.
 */
export async function callOpenRouter(
  systemPrompt: string,
  userMessage: string,
  model: string = DEFAULT_MODEL
): Promise<{
  content: string;
  model: string;
  latencyMs: number;
  tokensUsed: number;
}> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('[AI] No OpenRouter key — using mock response');
    return {
      content: `Hi po! 👋 Salamat sa message niyo sa amin. Ako po si Ate Girl, ang assistant ng page na ito. Pano ko po kayo matutulungan today?`,
      model: 'mock',
      latencyMs: 0,
      tokensUsed: 0,
    };
  }

  const t0 = Date.now();

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': APP_URL,
        'X-Title': APP_NAME,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 300,
        temperature: 0.85,
        top_p: 0.95,
      }),
    });

    const data: OpenRouterResponse = await res.json();
    const latencyMs = Date.now() - t0;

    if (!data.choices?.[0]?.message?.content) {
      console.error('[AI] Empty response from OpenRouter:', data);
      // Fallback to second model
      if (model === DEFAULT_MODEL) {
        console.log('[AI] Retrying with fallback model...');
        return callOpenRouter(systemPrompt, userMessage, FALLBACK_MODEL);
      }
      throw new Error('Empty response from AI');
    }

    return {
      content: data.choices[0].message.content.trim(),
      model: data.id || model,
      latencyMs,
      tokensUsed: data.usage?.total_tokens || 0,
    };
  } catch (err) {
    console.error('[AI] OpenRouter call failed:', err);
    const latencyMs = Date.now() - t0;

    // Fallback to GPT-4o-mini if first model fails
    if (model === DEFAULT_MODEL) {
      console.log('[AI] Retrying with fallback model...');
      return callOpenRouter(systemPrompt, userMessage, FALLBACK_MODEL);
    }

    return {
      content: `Hi po! Sorry, medyo nagka-technical difficulty po. Pwede niyo po bang i-try ulit in a few minutes? Or tawag na lang po kayo sa amin. Salamat po! 🙏`,
      model: 'error-fallback',
      latencyMs,
      tokensUsed: 0,
    };
  }
}

/**
 * Extract lead information from a customer message using regex + heuristics.
 * This runs before the LLM call to update the conversation context.
 */
export function extractLeadInfo(
  message: string,
  existing: LeadInfo
): LeadInfo {
  const updated = { ...existing };
  const msg = message.toLowerCase().trim();

  // Name extraction (simple heuristics)
  const namePatterns = [
    /ako (?:si|po si) ([a-z]+\s*[a-z]*)/i,
    /name(?:\s*is|\s*ko|\s*po)?[:\s]+([a-z]+\s*[a-z]*)/i,
    /(?:si|ako)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:po|nga|lang)/i,
  ];
  if (!updated.name) {
    for (const pat of namePatterns) {
      const match = message.match(pat);
      if (match) {
        updated.name = match[1].trim();
        break;
      }
    }
  }

  // Phone number extraction (Philippine format)
  const phonePatterns = [
    /(?:09\d{2}[\s-]?\d{3}[\s-]?\d{4})/,
    /(?:\+63\s?\d{3}[\s-]?\d{3}[\s-]?\d{4})/,
    /(\d{4}[\s-]?\d{3}[\s-]?\d{4})/,
  ];
  if (!updated.phone) {
    for (const pat of phonePatterns) {
      const match = message.match(pat);
      if (match) {
        updated.phone = match[0].trim();
        break;
      }
    }
  }

  // Email extraction
  if (!updated.email) {
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      updated.email = emailMatch[0];
    }
  }

  // Date extraction (common Filipino date mentions)
  if (!updated.event_date) {
    const datePatterns = [
      /(?:sa|on|ng)\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:,?\s*(\d{4}))?/i,
      /(\d{1,2})\s*(?:ng|of)\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s*(\d{4}))?/i,
    ];
    for (const pat of datePatterns) {
      const match = message.match(pat);
      if (match) {
        updated.event_date = match[0].trim();
        break;
      }
    }
  }

  // Budget extraction
  if (!updated.budget) {
    const budgetPatterns = [
      /(?:budget|presyo|price)[\s:]*[a-z]*\s*(\d{1,2}(?:,\d{3})*(?:k|K| thousand)?)/i,
      /(\d{1,2}(?:,\d{3})*(?:k|K))\s*(?:budget|pesos|php)/i,
      /(?:mga|around|approximately)\s*(\d{1,2}(?:,\d{3})*(?:k|K)?)/i,
      /p(\d{1,2}(?:,\d{3})*)/i,
    ];
    for (const pat of budgetPatterns) {
      const match = message.match(pat);
      if (match) {
        updated.budget = `₱${match[1]}`;
        break;
      }
    }
  }

  // Guest count
  if (!updated.guest_count) {
    const guestPatterns = [
      /(\d+)\s*(?:pax|guests|persons|tao|pax|guest)/i,
      /(?:for|para sa)\s*(\d+)\s*(?:pax|guests|persons|tao)/i,
    ];
    for (const pat of guestPatterns) {
      const match = message.match(pat);
      if (match) {
        updated.guest_count = match[1];
        break;
      }
    }
  }

  // Event type
  if (!updated.event_type) {
    const eventTypes = [
      'wedding', 'birthday', 'debut', 'binyag', 'baptism',
      'anniversary', 'reunion', 'corporate', 'seminar', 'party',
      'kasalan', 'kaarawan', 'pista', 'graduation', 'prom',
    ];
    for (const et of eventTypes) {
      if (msg.includes(et)) {
        updated.event_type = et;
        break;
      }
    }
  }

  // Check if we've captured enough
  const capturedFields = [updated.name, updated.phone, updated.event_date, updated.budget].filter(Boolean).length;
  updated.captured = capturedFields >= 2;

  return updated;
}

/**
 * Chunk markdown content for embedding.
 * Splits by paragraphs and merges short ones to keep chunks meaningful.
 */
export function chunkMarkdown(markdown: string, maxChunkSize = 500): string[] {
  // Split by double newlines (paragraphs) first
  const paragraphs = markdown
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxChunkSize && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [markdown.slice(0, maxChunkSize)];
}
