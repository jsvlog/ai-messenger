'use client';

// ============================================================
// ConversationViewer — Full chat thread for a sender
// ============================================================

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  direction: 'incoming' | 'outgoing';
  message_text: string;
  ai_response: string | null;
  ai_confidence: number | null;
  ai_latency_ms: number | null;
  is_from_admin: boolean;
  created_at: string;
}

interface Props {
  pageId: string;
  senderPsid: string;
  onClose: () => void;
}

export function ConversationViewer({ pageId, senderPsid, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase
          .from('message_logs')
          .select('*')
          .eq('page_id', pageId)
          .eq('sender_psid', senderPsid)
          .order('created_at', { ascending: true })
          .limit(50);
        setMessages(data || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [pageId, senderPsid]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-orange-100">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Conversation</h3>
            <p className="text-xs text-gray-400">{senderPsid.slice(0, 12)}...</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#fef9f0] to-white">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className={`h-16 skeleton rounded-2xl ${i % 2 === 0 ? 'ml-12' : 'mr-12'}`} />)}
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No messages found</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.direction === 'outgoing'
                    ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white rounded-br-md'
                    : 'bg-white border border-orange-100 text-gray-800 rounded-bl-md shadow-sm'
                }`}>
                  <p className="leading-relaxed">{msg.message_text}</p>
                  <div className={`flex items-center gap-2 mt-1 ${msg.direction === 'outgoing' ? 'text-white/70' : 'text-gray-400'}`}>
                    <span className="text-[10px]">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.is_from_admin && <span className="text-[10px] px-1 rounded bg-purple-500/20">Admin</span>}
                    {msg.ai_processed && <span className="text-[10px]">AI</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
