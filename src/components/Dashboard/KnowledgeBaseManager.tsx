'use client';

// ============================================================
// KnowledgeBaseManager — Industry-aware structured KB builder
// Collapsible accordion sections with labeled fields for clear UX
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { INDUSTRIES, getIndustry, type IndustryConfig } from '@/lib/industries';

interface Props { pageId: string; }

interface Pkg { id: string; [key: string]: string; }
interface Item { id: string; name: string; category: string; notes: string; }

function SectionHeader({ icon, title, count, badge, expanded, onClick }: {
  icon: string; title: string; count?: number; badge?: string; expanded: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-3 px-1 text-left hover:opacity-80 transition-opacity group"
    >
      <div className="flex items-center gap-2.5">
        <span className={`text-lg transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>▶</span>
        <span className="font-semibold text-gray-800 text-sm">{icon} {title}</span>
        {count !== undefined && count > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 border border-orange-200 text-gray-500 font-medium ml-1">
            {count}
          </span>
        )}
      </div>
      {badge && (
        <span className="text-[10px] text-gray-400 font-normal group-hover:text-gray-600">{badge}</span>
      )}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium text-gray-500 mb-1">{children}</label>;
}

export function KnowledgeBaseManager({ pageId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Industry selector
  const [industryId, setIndustryId] = useState('general');
  const industry: IndustryConfig = getIndustry(industryId);

  // Business info
  const [bizInfo, setBizInfo] = useState<Record<string, string>>({});

  // Packages
  const [packages, setPackages] = useState<Pkg[]>([{ id: '1' }]);

  // Items
  const [items, setItems] = useState<Item[]>([{ id: '1', name: '', category: industry.itemCategories[0], notes: '' }]);

  // Policies
  const [policies, setPolicies] = useState<Record<string, string>>({});

  // Other Info (free-form — custom instructions, pasted pricing, special rules)
  const [customInfo, setCustomInfo] = useState('');

  // Collapse state for sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    business: true,
    packages: true,
    items: false,
    policies: false,
    other: false,
  });

  // Collapse state for individual packages (by pkg.id)
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  const togglePackage = (id: string) => setExpandedPackages(prev => ({ ...prev, [id]: !prev[id] }));

  const loadExisting = useCallback(async () => {
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      // Get form data record (NOT the AI context markdown record)
      const { data } = await supabase
        .from('knowledge_bases')
        .select('*')
        .eq('page_id', pageId)
        .not('content_type', 'ilike', '%_context')
        .order('created_at', { ascending: false })
        .limit(1);
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
          if (parsed.customInfo) setCustomInfo(parsed.customInfo);
        } catch {}
      }
    } catch {}
    setLoading(false);
  }, [pageId]);

  useEffect(() => { loadExisting(); }, [loadExisting]);


  // Helpers
  const addPackage = () => {
    const newId = Date.now().toString();
    setPackages([...packages, { id: newId }]);
    setExpandedPackages(prev => ({ ...prev, [newId]: true }));
    setExpandedSections(prev => ({ ...prev, packages: true }));
  };
  const removePackage = (id: string) => setPackages(packages.filter(p => p.id !== id));
  const updatePackage = (id: string, field: string, val: string) => setPackages(packages.map(p => p.id === id ? { ...p, [field]: val } : p));

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', category: industry.itemCategories[0], notes: '' }]);
    setExpandedSections(prev => ({ ...prev, items: true }));
  };
  const removeItem = (id: string) => setItems(items.filter(m => m.id !== id));
  const updateItem = (id: string, field: string, val: string) => setItems(items.map(m => m.id === id ? { ...m, [field]: val } : m));

  // Generate markdown from form data
  const generateMarkdown = () => {
    let md = `# ${bizInfo[industry.bizFields[0].key] || 'Business'}\n\n`;
    md += `**Industry:** ${industry.label}\n\n`;

    industry.bizFields.forEach(f => {
      const val = bizInfo[f.key];
      if (val) md += `**${f.label}:** ${val}\n`;
    });
    md += '\n';

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

    const hasPolicies = industry.policyFields.some(f => policies[f.key]);
    if (hasPolicies) {
      md += `## Policies & Terms\n\n`;
      industry.policyFields.forEach(f => {
        if (policies[f.key]) md += `- **${f.label}:** ${policies[f.key]}\n`;
      });
    }

    if (customInfo.trim()) {
    md += `## Other Information\n\n${customInfo.trim()}\n\n`;
  }

    return md;
  };

  const handleSave = async () => {
    try {
      const firstField = industry.bizFields[0];
      if (!bizInfo[firstField.key]?.trim()) { setMessage(`❌ Please enter your ${firstField.label}.`); return; }
      setSaving(true); setMessage('');
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const formData = { industryId, bizInfo, packages, items, policies, customInfo };
      const markdown = generateMarkdown();
      const title = bizInfo[industry.bizFields[0].key];

      // 1. Save form data as JSON (for reloading into the form on next visit)
      const { error } = await supabase.from('knowledge_bases').upsert({
        page_id: pageId,
        title,
        content_md: JSON.stringify(formData),
        content_type: industry.id,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'page_id,title' });

      if (error) throw new Error(error.message || 'Database save failed');

      // 2. Call API to save AI context (markdown text, separate title — no embeddings)
      const res = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, title, contentMd: markdown, contentType: industry.id }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(`✅ Saved! Your AI assistant now knows about ${title}.`);
      } else {
        setMessage(`⚠️ Form saved, but AI context failed: ${data.error || 'unknown error'}`);
      }
    } catch (e: any) {
      console.error('[KB] Save error:', e);
      setMessage(`❌ ${e?.message || 'Failed to save'}`);
    }
    setSaving(false);
  };

  // Computed counts for summary
  const filledPackages = packages.filter(p => p.name?.trim()).length;
  const totalPackages = packages.length;
  const filledItems = items.filter(m => m.name.trim()).length;
  const totalItems = items.length;
  const filledPolicies = industry.policyFields.filter(f => policies[f.key]).length;
  const totalPolicies = industry.policyFields.length;
  const bizName = bizInfo[industry.bizFields[0].key]?.trim();

  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {message && <div className={`p-3 rounded-xl text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message}</div>}

      {/* === Quick Summary Bar === */}
      {bizName && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-white/90 border border-orange-100 text-xs text-gray-500">
          <span className="font-semibold text-gray-700 truncate max-w-[200px]">{bizName}</span>
          <span className="text-gray-300">·</span>
          <span>{filledPackages}/{totalPackages} {industry.packageLabel.toLowerCase()}s</span>
          <span className="text-gray-300">·</span>
          <span>{filledItems}/{totalItems} items</span>
          <span className="text-gray-300">·</span>
          <span>{filledPolicies}/{totalPolicies} policies</span>
          {customInfo.trim() && (<><span className="text-gray-300">·</span><span>📝 custom info</span></>)}
        </div>
      )}

      {/* === Business Info (accordion) === */}
      <div className="rounded-xl bg-orange-50/50 border border-orange-100 overflow-hidden">
        <SectionHeader
          icon="🏪"
          title="Business Information"
          badge={bizName ? '✓ filled' : undefined}
          expanded={expandedSections.business}
          onClick={() => toggleSection('business')}
        />
        {expandedSections.business && (
          <div className="px-4 pb-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              {industry.bizFields.map(f => (
                <div key={f.key} className={f.type === 'textarea' ? 'col-span-2' : ''}>
                  <FieldLabel>{f.label}</FieldLabel>
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={bizInfo[f.key] || ''}
                    onChange={(e) => setBizInfo({ ...bizInfo, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* === Packages (accordion) === */}
      <div className="rounded-xl bg-amber-50/50 border border-amber-100 overflow-hidden">
        <SectionHeader
          icon="📦"
          title={`${industry.packageLabel}s`}
          count={filledPackages}
          badge={`${filledPackages} of ${totalPackages}`}
          expanded={expandedSections.packages}
          onClick={() => toggleSection('packages')}
        />
        {expandedSections.packages && (
          <div className="px-4 pb-4 space-y-2">
            {packages.map((pkg, i) => {
              const pkgName = pkg[industry.packageFields[0]?.key] || pkg.name || '';
              const isExpanded = expandedPackages[pkg.id] !== false;
              const filledFields = industry.packageFields.filter(pf => pf.key !== 'name' && pkg[pf.key]).length;
              const totalFields = industry.packageFields.filter(pf => pf.key !== 'name').length;

              return (
                <div key={pkg.id} className="rounded-lg bg-white border border-amber-100 overflow-hidden">
                  {/* Package header bar */}
                  <button
                    onClick={() => togglePackage(pkg.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-amber-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                      <span className={`text-sm font-medium truncate ${pkgName ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                        {pkgName || `${industry.packageLabel} ${i + 1}`}
                      </span>
                      {filledFields > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex-shrink-0">
                          {filledFields}/{totalFields} fields
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {packages.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removePackage(pkg.id); }}
                          className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </button>

                  {/* Expanded fields */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-amber-50">
                      {industry.packageFields.map(pf => (
                        <div key={pf.key}>
                          <FieldLabel>{pf.label}</FieldLabel>
                          <input
                            type={pf.type === 'number' ? 'number' : 'text'}
                            value={pkg[pf.key] || ''}
                            onChange={(e) => updatePackage(pkg.id, pf.key, e.target.value)}
                            placeholder={pf.placeholder}
                            className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={addPackage} className="w-full py-2.5 rounded-lg border-2 border-dashed border-amber-200 text-xs text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-colors font-medium">
              + Add {industry.packageLabel}
            </button>
          </div>
        )}
      </div>

      {/* === Items (accordion with category groups) === */}
      <div className="rounded-xl bg-green-50/50 border border-green-100 overflow-hidden">
        <SectionHeader
          icon="🍽️"
          title={industry.itemsLabel}
          count={filledItems}
          badge={`${filledItems} of ${totalItems}`}
          expanded={expandedSections.items}
          onClick={() => toggleSection('items')}
        />
        {expandedSections.items && (
          <div className="px-4 pb-4 space-y-2">
            {/* Group items by category */}
            {industry.itemCategories.map(cat => {
              const catItems = items.filter(m => m.category === cat);
              if (catItems.length === 0) return null;
              return (
                <div key={cat} className="space-y-1">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-1 pt-2">{cat}</div>
                  {catItems.map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder={`Item ${idx + 1} name`}
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
                        placeholder="Notes"
                        className="w-28 px-3 py-2 rounded-lg border border-green-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-400/50"
                      />
                      {items.length > 1 && (
                        <button onClick={() => removeItem(item.id)} className="text-xs text-red-400 hover:text-red-600 px-1 flex-shrink-0">×</button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
            <button onClick={addItem} className="w-full py-2.5 rounded-lg border-2 border-dashed border-green-200 text-xs text-green-600 hover:bg-green-50 hover:border-green-300 transition-colors font-medium">
              + Add Item
            </button>
          </div>
        )}
      </div>

      {/* === Policies (accordion) === */}
      <div className="rounded-xl bg-blue-50/50 border border-blue-100 overflow-hidden">
        <SectionHeader
          icon="📋"
          title="Policies & Terms"
          count={filledPolicies}
          badge={`${filledPolicies} of ${totalPolicies}`}
          expanded={expandedSections.policies}
          onClick={() => toggleSection('policies')}
        />
        {expandedSections.policies && (
          <div className="px-4 pb-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {industry.policyFields.map(f => (
                <div key={f.key}>
                  <FieldLabel>{f.label}</FieldLabel>
                  <input
                    type="text"
                    value={policies[f.key] || ''}
                    onChange={(e) => setPolicies({ ...policies, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>


      {/* === Other Info (free-form) === */}
      <div className="rounded-xl bg-purple-50/50 border border-purple-100 overflow-hidden">
        <SectionHeader
          icon="📝"
          title="Other Information"
          badge={customInfo.trim() ? '✓ filled' : undefined}
          expanded={expandedSections.other}
          onClick={() => toggleSection('other')}
        />
        {expandedSections.other && (
          <div className="px-4 pb-4">
            <FieldLabel>Paste any additional info, special instructions, or pricing details for the AI</FieldLabel>
            <textarea
              value={customInfo}
              onChange={(e) => setCustomInfo(e.target.value)}
              placeholder={"e.g.\n- For packages not listed above, here are the prices...\n- When a customer asks about X, respond with Y...\n- We don't accept returns after 7 days\n- Our promo isBuy 1 Take 1 every Friday"}
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 resize-y bg-white/60"
            />
            <p className="text-[10px] text-gray-400 mt-1.5">
              Anything you put here is added to the AI's knowledge base. Use it for custom pricing, special rules, or instructions on how the AI should respond.
            </p>
          </div>
        )}
      </div>

      {/* === Save === */}
      <div className="space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : '💾 Save & Update AI Knowledge'}
        </button>
        {bizName && (
          <p className="text-center text-[11px] text-gray-400">
            Last saved data reloads when you come back. The AI uses this info to answer customers.
          </p>
        )}
      </div>
    </div>
  );
}