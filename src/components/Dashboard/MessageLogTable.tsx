'use client';

// ============================================================
// MessageLogTable — Recent messages with AI response info
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  pageId: string;
}

interface MessageRow {
  id: string;
  direction: 'incoming' | 'outgoing';
  message_text: string;
  ai_processed: boolean;
  ai_response: string | null;
  ai_latency_ms: number | null;
  is_from_admin: boolean;
  created_at: string;
}

export function MessageLogTable({ pageId }: Props) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const supabase = createClient();

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('message_logs')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
      .limit(20);

    setMessages(data || []);
    setLoading(false);
  }, [supabase, pageId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-orange-50 rounded-lg" />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No messages yet. When customers message your page, they'll show up here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="rounded-xl border border-orange-100 overflow-hidden"
        >
          {/* Message row */}
          <button
            onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
            className="w-full text-left p-3 bg-white hover:bg-orange-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {msg.direction === 'incoming' ? '📥' : '📤'}
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
              <span className="text-sm text-gray-800 truncate flex-1">
                {msg.message_text.slice(0, 80)}
                {msg.message_text.length > 80 ? '...' : ''}
              </span>
              {msg.is_from_admin && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">
                  ADMIN
                </span>
              )}
              {msg.ai_processed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                  AI ✓
                </span>
              )}
            </div>
          </button>

          {/* Expanded detail */}
          {expanded === msg.id && (
            <div className="px-4 pb-3 space-y-2 bg-orange-50/30 border-t border-orange-100">
              <div>
                <p className="text-xs text-gray-500 font-medium">Message:</p>
                <p className="text-sm text-gray-800">{msg.message_text}</p>
              </div>
              {msg.ai_response && (
                <div>
                  <p className="text-xs text-gray-500 font-medium">AI Response:</p>
                  <p className="text-sm text-gray-700 bg-white/80 p-2 rounded-lg">
                    {msg.ai_response}
                  </p>
                </div>
              )}
              <div className="flex gap-4 text-xs text-gray-500">
                <span>Latency: {msg.ai_latency_ms || 'N/A'}ms</span>
                <span>Admin: {msg.is_from_admin ? 'Yes' : 'No'}</span>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={loadMessages}
        className="w-full text-center text-xs text-[#ff6b6b] hover:text-[#ffa94d] transition-colors py-2"
      >
        ↻ Refresh
      </button>
    </div>
  );
}
