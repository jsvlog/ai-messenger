'use client';

// ============================================================
// MessageLogTable — Recent messages with search, filter, conversation viewer
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ConversationViewer } from './ConversationViewer';

interface Props {
  pageId: string;
}

interface MessageRow {
  id: string;
  sender_psid: string;
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
  const [convoSender, setConvoSender] = useState<string | null>(null);

  // Search/filter
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'ai' | 'admin' | 'customer'>('all');

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('message_logs')
        .select('*')
        .eq('page_id', pageId)
        .order('created_at', { ascending: false })
        .limit(50);
      setMessages(data || []);
    } catch {}
    setLoading(false);
  }, [pageId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const filtered = useMemo(() => {
    let result = messages;
    if (filter === 'ai') result = result.filter((m) => m.ai_processed);
    if (filter === 'admin') result = result.filter((m) => m.is_from_admin);
    if (filter === 'customer') result = result.filter((m) => m.direction === 'incoming' && !m.is_from_admin);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) => m.message_text.toLowerCase().includes(q));
    }
    return result;
  }, [messages, search, filter]);

  if (loading) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 skeleton rounded-lg" />)}</div>;
  }

  if (messages.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">No messages yet. Customer messages will appear here.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Search + filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-orange-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/50"
          />
          <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        {['all', 'customer', 'ai', 'admin'].map((f) => (
          <button key={f} onClick={() => setFilter(f as any)} className={`px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all ${
            filter === f ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}>
            {f === 'all' ? 'All' : f === 'customer' ? '👤 Cust' : f === 'ai' ? '🤖 AI' : '🔒 Adm'}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {filtered.map((msg) => (
          <div key={msg.id} className="rounded-xl border border-orange-100 overflow-hidden">
            <div className="flex items-center gap-2 p-2.5 bg-white hover:bg-orange-50/50 transition-colors cursor-pointer" onClick={() => setConvoSender(msg.sender_psid)}>
              <span className="text-xs">{msg.direction === 'incoming' ? '📥' : '📤'}</span>
              <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-xs text-gray-700 truncate flex-1">{msg.message_text.slice(0, 60)}{msg.message_text.length > 60 ? '...' : ''}</span>
              {msg.is_from_admin && <span className="text-[9px] px-1 rounded bg-purple-100 text-purple-600 flex-shrink-0">ADMIN</span>}
              {msg.ai_processed && <span className="text-[9px] px-1 rounded bg-green-100 text-green-600 flex-shrink-0">AI</span>}
              {msg.ai_latency_ms && <span className="text-[9px] text-gray-400 flex-shrink-0">{msg.ai_latency_ms}ms</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No messages match</p>}
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span>{filtered.length} of {messages.length} messages</span>
        <button onClick={loadMessages} className="hover:text-[#ff6b6b]">↻ Refresh</button>
      </div>

      {/* Conversation Viewer Modal */}
      {convoSender && (
        <ConversationViewer pageId={pageId} senderPsid={convoSender} onClose={() => setConvoSender(null)} />
      )}
    </div>
  );
}
