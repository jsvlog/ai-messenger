'use client';

// ============================================================
// KnowledgeBaseUploader — Markdown editor + embed generation
// ============================================================

import { useState } from 'react';

interface Props {
  pageId: string;
}

const INDUSTRY_TEMPLATES: Record<string, string> = {
  rentals: `# 🏠 Rentals Information

## Pricing
- **Basic Sound System**: ₱3,500/day (2 speakers, 1 mixer, 1 mic)
- **Full Party Package**: ₱8,000/day (sound system + lights + bubble machine)
- **LED Wall Rental**: ₱15,000/day (9 panels, 3m x 2m)
- **Photo Booth**: ₱5,000/day (unlimited prints, custom template)

## Availability
- We require at least 3 days advance booking
- 50% downpayment to secure the date
- Free delivery within Metro Manila (₱500 beyond)

## FAQs
- **Q**: May discount po ba for multiple days?
- **A**: Yes po! 10% off for 2+ day bookings, 20% off for 5+ days.
- **Q**: Pwede po bang i-customize yung photo booth template?
- **A**: Absolutely! Just send us your design or theme, we'll match it.
- **Q**: What's included sa Full Party Package?
- **A**: Sound system, party lights, bubble machine, fog machine, and basic backdrop.`,
  catering: `# 🍽️ Catering Information

## Packages
- **Budget Bilao (₱3,500)**: Good for 10-15 pax — Pancit, Lumpia, Chicken, Rice, Dessert
- **Fiesta Package (₱8,500)**: Good for 20-30 pax — 5 viands, rice, dessert station, drinks
- **Premium Wedding (₱25,000)**: Good for 50 pax — 7 viands, lechon, dessert buffet, waiters

## Menu Items
- Lechon Baboy (whole): ₱8,500
- Lechon Manok: ₱350 each
- Kaldereta: ₱1,200/tray
- Spaghetti: ₱900/tray
- Lumpiang Shanghai: ₱750/100pcs

## FAQs
- **Q**: May free taste test po ba?
- **A**: Yes! Schedule a food tasting at our QC kitchen — free for wedding bookings.
- **Q**: Pwede po bang i-customize ang menu?
- **A**: Definitely! Mix and match viands or we can create a custom package for you.
- **Q**: Do you cater outside Metro Manila?
- **A**: Yes, with a minimal out-of-town fee depending on the location.`,
};

export function KnowledgeBaseUploader({ pageId }: Props) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleTemplate = (type: string) => {
    setContentType(type);
    setContent(INDUSTRY_TEMPLATES[type] || '');
    setTitle(type === 'rentals' ? 'Rentals Knowledge Base' : type === 'catering' ? 'Catering Knowledge Base' : '');
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setMessage('❌ Please provide both a title and content.');
      return;
    }

    setSaving(true);
    setMessage('');

    const res = await fetch('/api/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId,
        title: title.trim(),
        contentMd: content.trim(),
        contentType,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage(`✅ Knowledge base saved! ${data.chunksCreated} chunks generated for AI search.`);
    } else {
      setMessage(`❌ Error: ${data.error || 'Failed to save'}`);
    }

    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Template buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleTemplate('rentals')}
          className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200 hover:shadow-md transition-all"
        >
          🏠 Rentals Template
        </button>
        <button
          onClick={() => handleTemplate('catering')}
          className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200 hover:shadow-md transition-all"
        >
          🍽️ Catering Template
        </button>
        <button
          onClick={() => { setContent(''); setTitle(''); }}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 hover:shadow-md transition-all"
        >
          Clear
        </button>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Knowledge base title (e.g., 'Pricing & Packages')"
        className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
      />

      {/* Content type selector */}
      <select
        value={contentType}
        onChange={(e) => setContentType(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
      >
        <option value="general">General Info</option>
        <option value="pricing">Pricing & Packages</option>
        <option value="faq">FAQs</option>
        <option value="menu">Menu / Inventory</option>
        <option value="availability">Availability & Booking</option>
      </select>

      {/* Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="# Your Knowledge Base

Write your business info here in Markdown format. The AI will use this to answer customer questions.

## Pricing
- Item 1: ₱X
- Item 2: ₱Y

## FAQs
- **Q**: Common question?
- **A**: Your answer here."
        rows={14}
        className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all resize-y"
      />

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white font-semibold hover:shadow-lg hover:shadow-orange-300/40 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating AI embeddings...
          </>
        ) : (
          '💾 Save Knowledge Base & Generate Embeddings'
        )}
      </button>

      {message && (
        <p className={`text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}

      {/* Info */}
      <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
        <p className="text-xs text-orange-700">
          💡 <strong>How it works:</strong> Your markdown content is split into chunks, converted to AI embeddings (1536-dim vectors), and stored in Supabase with pgvector. When a customer messages, the AI searches these chunks to find the most relevant information before replying.
        </p>
      </div>
    </div>
  );
}
