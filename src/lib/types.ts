// ============================================================
// AI Messenger SaaS — Shared Types
// ============================================================

// --- Database row types ---

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  tenant_slug: string;
  plan: 'free' | 'starter' | 'pro';
  created_at: string;
  updated_at: string;
}

export interface ConnectedPage {
  id: string;
  user_id: string;
  page_id: string;
  page_name: string;
  page_access_token: string;
  page_category: string | null;
  instagram_business_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageSettings {
  id: string;
  page_id: string;
  ai_enabled: boolean;
  ai_paused_until: string | null;
  schedule_active: boolean;
  schedule_start: string | null;
  schedule_end: string | null;
  schedule_days: number[];
  auto_reply_off_hours: string | null;
  response_delay_sec: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBase {
  id: string;
  page_id: string;
  title: string;
  content_md: string;
  content_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeChunk {
  id: string;
  knowledge_id: string;
  page_id: string;
  chunk_index: number;
  content: string;
  embedding: number[];
  token_count: number;
  created_at: string;
}

export interface MessageLog {
  id: string;
  page_id: string;
  sender_psid: string;
  recipient_id: string;
  direction: 'incoming' | 'outgoing';
  message_text: string;
  attachments: Record<string, unknown>[];
  meta_mid: string | null;
  ai_processed: boolean;
  ai_response: string | null;
  ai_confidence: number | null;
  ai_sources: Record<string, unknown>[];
  ai_latency_ms: number | null;
  is_from_admin: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  lemon_squeezy_id: string;
  variant_id: string;
  plan: '2week' | '4week' | '12week';
  status: 'active' | 'expired' | 'cancelled';
  started_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationContext {
  id: string;
  page_id: string;
  sender_psid: string;
  context_json: {
    history: ChatHistoryItem[];
    lead_info: LeadInfo;
  };
  last_active: string;
  created_at: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface LeadInfo {
  name: string | null;
  phone: string | null;
  email: string | null;
  event_date: string | null;
  budget: string | null;
  guest_count: string | null;
  event_type: string | null;
  captured: boolean;
}

// --- Meta Webhook types ---

export interface MetaWebhookEntry {
  id: string;
  time: number;
  messaging: MetaMessagingEvent[];
}

export interface MetaWebhookBody {
  object: 'page';
  entry: MetaWebhookEntry[];
}

export interface MetaMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text: string;
    attachments?: MetaAttachment[];
  };
  postback?: {
    title: string;
    payload: string;
  };
}

export interface MetaAttachment {
  type: string;
  payload: {
    url: string;
    title?: string;
  };
}

// --- OpenRouter types ---

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens: number;
  temperature: number;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// --- Vector match result ---

export interface VectorMatchResult {
  id: string;
  knowledge_id: string;
  content: string;
  similarity: number;
}

// --- AI Processing payload ---

export interface ProcessAIPayload {
  page_id: string;
  sender_psid: string;
  message_text: string;
  meta_mid: string;
  timestamp: number;
  is_from_admin: boolean;
  page_name: string;
}
