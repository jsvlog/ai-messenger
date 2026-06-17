'use client';

import { useState, useEffect, useCallback } from 'react';

interface Props {
  pageId: string;
}

interface KB {
  id: string;
  title: string;
  content_md: string;
  content_type: string;
  is_active: boolean;
  updated_at: string;
}

const TEMPLATES: Record<string, string> = {
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
- **A**: Yes po! 10% off for 2+ day bookings, 20% off for 5+ days.`,
  catering: `# 🍽️ Catering Information

## Packages
- **Budget Bilao (₱3,500)**: Good for 10-15 pax
- **Fiesta Package (₱8,500)**: Good for 20-30 pax
- **Premium Wedding (₱25,000)**: Good for 50 pax

## FAQs
- **Q**: May free taste test po ba?
- **A**: Yes! Schedule at our QC kitchen — free for wedding bookings.
- **Q**: Pwede po bang i-customize ang menu?
- **A**: Definitely! Mix and match viands or we can create a custom package.`,
};

export function KnowledgeBaseManager({ pageId }: Props) {
  const [kbs, setKbs] = useState<KB[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('general');
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const loadKBs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge-base?pageId=${pageId}`);
      const data = await res.json();
      setKbs(data.knowledgeBases || []);
    } catch { }
    setLoading(false);
  }, [pageId]);

  useEffect(() => { loadKBs(); }, [loadKBs]);

  const handleEdit = (kb: KB) => {
    setEditingId(kb.id);
    setTitle(kb.title);
    setContent(kb.content_md);
    setContentType(kb.content_type);
    setShowEditor(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setContentType('general');
    setShowEditor(true);
  };

  const handleDelete = async (kbId: string) => {
    if (!confirm('Delete this knowledge base?')) return;
    try {
      await fetch(`/api/knowledge-base?id=${kbId}`, { method: 'DELETE' });
      setMessage('✅ Deleted');
      loadKBs();
    } catch { setMessage('❌ Failed to delete'); }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setMessage('❌ Title and content required.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, title: title.trim(), contentMd: content.trim(), contentType }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Saved! ${data.chunksCreated || '?'} AI chunks generated.`);
        setShowEditor(false);
        loadKBs();
      } else {
        setMessage(`❌ ${data.error || 'Failed'}`);
      }
    } catch (e: any) {
      setMessage(`❌ ${e.message || 'Network error'}`);
    }
    setSaving(false);
  };

  const handleTemplate = (type: string) => {
    setContentType(type);
    setContent(TEMPLATES[type] || '');
    setTitle(type === 'rentals' ? 'Rentals Knowledge Base' : type === 'catering' ? 'Catering Knowledge Base' : '');
  };

  return (
    <div className="space-y-5">
      {/* Existing KBs */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
        </div>
      ) : kbs.length > 0 ? (
        <div className="space-y-2">
          {kbs.map((kb) => (
            <div key={kb.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-orange-100 hover:shadow-sm transition-shadow">
              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleEdit(kb)}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">{kb.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 flex-shrink-0">{kb.content_type}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Updated {new Date(kb.updated_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleDelete(kb.id)} className="text-xs text-red-400 hover:text-red-600 ml-2 flex-shrink-0">Delete</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-gray-400">
          <p className="text-2xl mb-2">📚</p>
          <p>No knowledge base yet</p>
          <p className="text-xs mt-1">Add your business info so the AI can answer customer questions</p>
        </div>
      )}

      {/* New KB button */}
      {!showEditor && (
        <button onClick={handleNew} className="w-full py-2.5 rounded-xl border-2 border-dashed border-orange-200 text-orange-500 text-sm font-medium hover:bg-orange-50 transition-colors">
          + Add Knowledge Base
        </button>
      )}

      {/* Editor */}
      {showEditor && (
        <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 space-y-3 fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              {editingId ? 'Edit Knowledge Base' : 'New Knowledge Base'}
            </h4>
            <button onClick={() => setShowEditor(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
          </div>

          {/* Templates */}
          <div className="flex gap-1.5">
            {Object.keys(TEMPLATES).map((t) => (
              <button key={t} onClick={() => handleTemplate(t)} className="text-[10px] px-2 py-1 rounded-lg bg-white border border-orange-100 text-orange-600 hover:bg-orange-50">
                {t === 'rentals' ? '🏠 Rentals' : '🍽️ Catering'}
              </button>
            ))}
            <button onClick={() => { setContent(''); setTitle(''); }} className="text-[10px] px-2 py-1 rounded-lg bg-white border border-gray-100 text-gray-500 hover:bg-gray-50">Clear</button>
          </div>

          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="KB Title (e.g. Pricing & Packages)" className="w-full px-3 py-2 rounded-lg border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
          <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-orange-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/50">
            <option value="general">General Info</option><option value="pricing">Pricing</option><option value="faq">FAQs</option><option value="menu">Menu</option><option value="availability">Availability</option>
          </select>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} placeholder="# Your Knowledge Base&#10;&#10;Write in Markdown..." className="w-full px-3 py-2 rounded-lg border border-orange-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-y" />
          <button onClick={handleSave} disabled={saving} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
            {saving ? 'Saving...' : '💾 Save & Generate AI Embeddings'}
          </button>
          {message && <p className={`text-xs ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}
        </div>
      )}
    </div>
  );
}
