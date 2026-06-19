'use client';

// ============================================================
// KnowledgeBaseManager — Industry-aware structured KB builder
// Dynamically adapts form fields based on selected business type
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { INDUSTRIES, getIndustry, type IndustryConfig } from '@/lib/industries';

interface Props { pageId: string; }

interface Pkg { id: string; [key: string]: string; }
interface Item { id: string; name: string; category: string; notes: string; }

export function KnowledgeBaseManager({ pageId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Industry selector
  const [industryId, setIndustryId] = useState('catering');
  const industry: IndustryConfig = getIndustry(industryId);

  // Business info
  const [bizInfo, setBizInfo] = useState<Record<string, string>>({});

  // Packages
  const [packages, setPackages] = useState<Pkg[]>([{ id: '1' }]);

  // Items
  const [items, setItems] = useState<Item[]>([{ id: '1', name: '', category: industry.itemCategories[0], notes: '' }]);

  // Policies
  const [policies, setPolicies] = useState<Record<string, string>>({});

  const loadExisting = useCallback(async () => {
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.from('knowledge_bases').select('*').eq('page_id', pageId).order('created_at', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        const kb = data[0];
        setEditingId(kb.id);
        try {
          const parsed = JSON.parse(kb.content_md.startsWith('{') ? kb.content_md : '{}');
          if (parsed.industryId) setIndustryId(parsed.industryId);
          if (parsed.bizInfo) setBizInfo(parsed.bizInfo);
          if (parsed.packages) setPackages(parsed.packages);
          if (parsed.items) setItems(parsed.items);
          if (parsed.policies) setPolicies(parsed.policies);
        } catch {}
      }
    } catch {}
    setLoading(false);
  }, [pageId]);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  // When industry changes, reset item categories
  const handleIndustryChange = (newId: string) => {
    setIndustryId(newId);
    const newIndustry = getIndustry(newId);
    setItems(prev => prev.map(it => ({ ...it, category: newIndustry.itemCategories[0] })));
  };

  // Helpers
  const addPackage = () => setPackages([...packages, { id: Date.now().toString() }]);
  const removePackage = (id: string) => setPackages(packages.filter(p => p.id !== id));
  const updatePackage = (id: string, field: string, val: string) => setPackages(packages.map(p => p.id === id ? { ...p, [field]: val } : p));

  const addItem = () => setItems([...items, { id: Date.now().toString(), name: '', category: industry.itemCategories[0], notes: '' }]);
  const removeItem = (id: string) => setItems(items.filter(m => m.id !== id));
  const updateItem = (id: string, field: string, val: string) => setItems(items.map(m => m.id === id ? { ...m, [field]: val } : m));

  // Generate markdown from form data
  const generateMarkdown = () => {
    let md = `# ${bizInfo[industry.bizFields[0].key] || 'Business'}\n\n`;
    md += `**Industry:** ${industry.label}\n\n`;

    // Business info
    industry.bizFields.forEach(f => {
      const val = bizInfo[f.key];
      if (val) md += `**${f.label}:** ${val}\n`;
    });
    md += '\n';

    // Packages
    const validPkgs = packages.filter(p => p.name?.trim());
    if (validPkgs.length > 0) {
      md += `## ${industry.packageLabel}s\n\n`;
      validPkgs.forEach(p => {
        md += `### ${p.name || ''}\n`;
        industry.packageFields.forEach(pf => {
          if (pf.key !== 'name' && p[pf.key]) {
            md += `- ${pf.label}: ${p[pf.key]}\n`;
          }
        });
        md += '\n';
      });
    }

    // Items
    const validItems = items.filter(m => m.name.trim());
    if (validItems.length > 0) {
      md += `## ${industry.itemsLabel}\n\n`;
      const cats = [...new Set(validItems.map(m => m.category))];
      cats.forEach(cat => {
        md += `### ${cat}\n`;
        validItems.filter(m => m.category === cat).forEach(m => {
          md += `- ${m.name}${m.notes ? ` (${m.notes})` : ''}\n`;
        });
        md += '\n';
      });
    }

    // Policies
    const hasPolicies = industry.policyFields.some(f => policies[f.key]);
    if (hasPolicies) {
      md += `## Policies & Terms\n\n`;
      industry.policyFields.forEach(f => {
        if (policies[f.key]) md += `- **${f.label}:** ${policies[f.key]}\n`;
      });
    }

    return md;
  };

  const handleSave = async () => {
    const firstField = industry.bizFields[0];
    if (!bizInfo[firstField.key]?.trim()) { setMessage(`❌ Please enter your ${firstField.label}.`); return; }
    setSaving(true); setMessage('');
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const formData = { industryId, bizInfo, packages, items, policies };
      const markdown = generateMarkdown();
      const title = bizInfo[industry.bizFields[0].key];

      const { error } = await supabase.from('knowledge_bases').upsert({
        page_id: pageId,
        title,
        content_md: JSON.stringify(formData),
        content_type: industry.id,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'page_id,title' });

      if (error) throw error;

      // Save markdown version for AI search
      await supabase.from('knowledge_bases').upsert({
        page_id: pageId,
        title: title + ' (AI Context)',
        content_md: markdown,
        content_type: industry.id + '_context',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'page_id,title' });

      // Generate embeddings
      const res = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, title, contentMd: markdown, contentType: industry.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Saved! ${data.chunksCreated || '?'} AI chunks generated. Your AI assistant is ready.`);
      } else {
        setMessage(`✅ Saved! (Embeddings: ${data.error || 'pending'})`);
      }
    } catch (e: any) {
      setMessage(`❌ ${e?.message || 'Failed to save'}`);
    }
    setSaving(false);
  };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  return (
    <div className="space-y-5">
      {message && <div className={`p-3 rounded-xl text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message}</div>}

      {/* Industry Selector */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">🏷️ What kind of business is this?</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {INDUSTRIES.map(ind => (
            <button
              key={ind.id}
              onClick={() => handleIndustryChange(ind.id)}
              className={`p-2.5 rounded-xl border text-left transition-all ${industryId === ind.id ? 'border-[#ff6b6b] bg-white shadow-md' : 'border-orange-100 bg-white/50 hover:bg-white'}`}
            >
              <div className="text-lg mb-0.5">{ind.icon}</div>
              <div className="text-xs font-medium text-gray-800">{ind.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{ind.tagline}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Business Info */}
      <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">🏪 Business Information</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {industry.bizFields.map(f => (
            <input
              key={f.key}
              type={f.type === 'number' ? 'number' : 'text'}
              value={bizInfo[f.key] || ''}
              onChange={(e) => setBizInfo({ ...bizInfo, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className={`px-3 py-2 rounded-lg border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 ${f.type === 'textarea' ? 'col-span-2' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Packages */}
      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">📦 {industry.packageLabel}s</h4>
          <button onClick={addPackage} className="text-xs px-2 py-1 rounded-lg bg-amber-200 text-amber-800 hover:bg-amber-300 font-medium">+ Add {industry.packageLabel}</button>
        </div>
        {packages.map((pkg, i) => (
          <div key={pkg.id} className="p-3 rounded-lg bg-white border border-amber-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">{industry.packageLabel} {i + 1}</span>
              {packages.length > 1 && <button onClick={() => removePackage(pkg.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>}
            </div>
            {industry.packageFields.map(pf => (
              <input
                key={pf.key}
                type={pf.type === 'number' ? 'number' : 'text'}
                value={pkg[pf.key] || ''}
                onChange={(e) => updatePackage(pkg.id, pf.key, e.target.value)}
                placeholder={pf.placeholder}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
            ))}
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="p-4 rounded-xl bg-green-50/50 border border-green-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">🍽️ {industry.itemsLabel}</h4>
          <button onClick={addItem} className="text-xs px-2 py-1 rounded-lg bg-green-200 text-green-800 hover:bg-green-300 font-medium">+ Add Item</button>
        </div>
        {items.map((item, i) => (
          <div key={item.id} className="flex gap-2 items-center">
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
              placeholder={`Item ${i + 1} name`}
              className="flex-1 px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
            />
            <select
              value={item.category}
              onChange={(e) => updateItem(item.id, 'category', e.target.value)}
              className="px-2 py-2 rounded-lg border border-green-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-400/50"
            >
              {industry.itemCategories.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              type="text"
              value={item.notes}
              onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
              placeholder="Notes (optional)"
              className="w-32 px-3 py-2 rounded-lg border border-green-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-400/50"
            />
            {items.length > 1 && <button onClick={() => removeItem(item.id)} className="text-xs text-red-400 hover:text-red-600 px-1">×</button>}
          </div>
        ))}
      </div>

      {/* Policies */}
      <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">📋 Policies & Terms</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {industry.policyFields.map(f => (
            <input
              key={f.key}
              type="text"
              value={policies[f.key] || ''}
              onChange={(e) => setPolicies({ ...policies, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          ))}
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
        {saving ? 'Saving...' : '💾 Save & Generate AI Knowledge'}
      </button>
    </div>
  );
}
