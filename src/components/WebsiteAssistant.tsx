'use client';

// ============================================================
// WebsiteAssistant — Floating chat bubble for CaterAI website
// Doubles as a live demo of the product
// ============================================================

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'Magkano ang CaterAI?',
  'Paano mag-connect ng FB page?',
  'Anong businesses ang supported?',
  'Free ba talaga?',
];

export function WebsiteAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi po! 👋 Ako si CaterAI Assistant. Pwede ko po kayong tulungan sa questions niyo about CaterAI. Ano po ang gusto niyong malaman?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Pulse animation after 5 seconds if no interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteracted && !open) {
        const bubble = document.getElementById('chat-bubble');
        if (bubble) bubble.classList.add('animate-bounce');
        setTimeout(() => {
          if (bubble) bubble.classList.remove('animate-bounce');
        }, 2000);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [hasInteracted, open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setHasInteracted(true);
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/website-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry po, may error. Try again?' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry po, connection issue. Try again?' }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        id="chat-bubble"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#ffa94d] shadow-lg shadow-orange-300/40 flex items-center justify-center text-white hover:scale-110 transition-transform"
        aria-label="Open chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {!hasInteracted && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold animate-pulse">1</span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-96 h-[500px] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-orange-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-sm">AI</div>
          <div>
            <p className="text-white font-semibold text-sm">CaterAI Assistant</p>
            <p className="text-white/70 text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Online now
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#fef9f0] to-white">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white rounded-br-md'
                : 'bg-white border border-orange-100 text-gray-800 rounded-bl-md shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-orange-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-orange-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-orange-300 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Suggested questions (only show before first user message) */}
        {messages.length === 1 && !loading && (
          <div className="space-y-1.5 pt-2">
            <p className="text-[10px] text-gray-400 text-center">👇 Try these:</p>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="block w-full text-left px-3 py-2 rounded-xl bg-orange-50 border border-orange-100 text-xs text-gray-600 hover:bg-orange-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-orange-100 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(input); }}
            placeholder="Type your question..."
            className="flex-1 px-3 py-2 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white hover:shadow-md transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
        <p className="text-[9px] text-gray-300 text-center mt-1.5">Powered by CaterAI — this is how your AI replies to customers too! 🚀</p>
      </div>
    </div>
  );
}
