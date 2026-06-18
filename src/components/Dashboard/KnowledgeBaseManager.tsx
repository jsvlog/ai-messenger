'use client';

// ============================================================
// CateringKBBuilder — Structured form for catering businesses
// No markdown needed. Just fill in the form.
// ============================================================

import { useState, useEffect, useCallback } from 'react';

interface Props { pageId: string; }

interface Package {
  id: string; name: string; pricePerHead: string; minPax: string;
  inclusions: string; description: string;
}
interface MenuItem {
  id: string; name: string; category: string; notes: string;
}

export function KnowledgeBaseManager({ pageId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Business info
  const [bizName, setBizName] = useState('');
  const [bizLocation, setBizLocation] = useState('');
  const [serviceHours, setServiceHours] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');

  // Packages
  const [packages, setPackages] = useState<Package[]>([
    { id: '1', name: '', pricePerHead: '', minPax: '', inclusions: '', description: '' }
  ]);

  // Menu
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: '1', name: '', category: 'Viand', notes: '' }
  ]);

  // Policies
  const [downpayment, setDownpayment] = useState('');
  const [cancellation, setCancellation] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [freeTaste, setFreeTaste] = useState('');
  const [extraInfo, setExtraInfo] = useState('');

  const loadExisting = useCallback(async () => {
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.from('knowledge_bases').select('*').eq('page_id', pageId).order('created_at', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        const kb = data[0];
        setEditingId(kb.id);
        // Parse the stored content back into form fields
        try {
          const parsed = JSON.parse(kb.content_md.startsWith('{') ? kb.content_md : '{}');
          if (parsed.bizName) setBizName(parsed.bizName);
          if (parsed.bizLocation) setBizLocation(parsed.bizLocation);
          if (parsed.serviceHours) setServiceHours(parsed.serviceHours);
          if (parsed.serviceAreas) setServiceAreas(parsed.serviceAreas);
          if (parsed.packages) setPackages(parsed.packages);
          if (parsed.menuItems) setMenuItems(parsed.menuItems);
          if (parsed.downpayment) setDownpayment(parsed.downpayment);
          if (parsed.cancellation) setCancellation(parsed.cancellation);
          if (parsed.deliveryFee) setDeliveryFee(parsed.deliveryFee);
          if (parsed.freeTaste) setFreeTaste(parsed.freeTaste);
          if (parsed.extraInfo) setExtraInfo(parsed.extraInfo);
        } catch {}
      }
    } catch {}
    setLoading(false);
  }, [pageId]);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  // Package helpers
  const addPackage = () => setPackages([...packages, { id: Date.now().toString(), name: '', pricePerHead: '', minPax: '', inclusions: '', description: '' }]);
  const removePackage = (id: string) => setPackages(packages.filter(p => p.id !== id));
  const updatePackage = (id: string, field: string, val: string) => setPackages(packages.map(p => p.id === id ? { ...p, [field]: val } : p));

  // Menu helpers
  const addMenuItem = () => setMenuItems([...menuItems, { id: Date.now().toString(), name: '', category: 'Viand', notes: '' }]);
  const removeMenuItem = (id: string) => setMenuItems(menuItems.filter(m => m.id !== id));
  const updateMenuItem = (id: string, field: string, val: string) => setMenuItems(menuItems.map(m => m.id === id ? { ...m, [field]: val } : m));

  // Generate markdown from form data for AI embeddings
  const generateMarkdown = () => {
    let md = `# ${bizName || 'Catering Business'}\n\n`;
    if (bizLocation) md += `**Location:** ${bizLocation}\n`;
    if (serviceHours) md += `**Service Hours:** ${serviceHours}\n`;
    if (serviceAreas) md += `**Service Areas:** ${serviceAreas}\n\n`;

    const validPackages = packages.filter(p => p.name.trim());
    if (validPackages.length > 0) {
      md += `## Packages\n\n`;
      validPackages.forEach(p => {
        md += `### ${p.name}\n`;
        if (p.pricePerHead) md += `- Price: ₱${p.pricePerHead}/head\n`;
        if (p.minPax) md += `- Minimum: ${p.minPax} pax\n`;
        if (p.inclusions) md += `- Inclusions: ${p.inclusions}\n`;
        if (p.description) md += `- ${p.description}\n`;
        md += '\n';
      });
    }

    const validMenu = menuItems.filter(m => m.name.trim());
    if (validMenu.length > 0) {
      md += `## Menu\n\n`;
      const categories = [...new Set(validMenu.map(m => m.category))];
      categories.forEach(cat => {
        md += `### ${cat}\n`;
        validMenu.filter(m => m.category === cat).forEach(m => {
          md += `- ${m.name}${m.notes ? ` (${m.notes})` : ''}\n`;
        });
        md += '\n';
      });
    }

    md += `## Policies\n\n`;
    if (downpayment) md += `- **Downpayment:** ${downpayment}\n`;
    if (cancellation) md += `- **Cancellation:** ${cancellation}\n`;
    if (deliveryFee) md += `- **Delivery Fee:** ${deliveryFee}\n`;
    if (freeTaste) md += `- **Free Taste Test:** ${freeTaste}\n`;
    if (extraInfo) md += `\n## Additional Info\n\n${extraInfo}\n`;

    return md;
  };

  const handleSave = async () => {
    if (!bizName.trim()) { setMessage('❌ Please enter your business name.'); return; }
    setSaving(true); setMessage('');
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const formData = { bizName, bizLocation, serviceHours, serviceAreas, packages, menuItems, downpayment, cancellation, deliveryFee, freeTaste, extraInfo };
      const markdown = generateMarkdown();

      const { error } = await supabase.from('knowledge_bases').upsert({
        page_id: pageId,
        title: bizName,
        content_md: JSON.stringify(formData),
        content_type: 'catering',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'page_id,title' });

      if (error) throw error;

      // Also save the markdown version for AI search
      const { error: mdError } = await supabase.from('knowledge_bases').upsert({
        page_id: pageId,
        title: bizName + ' (AI Context)',
        content_md: markdown,
        content_type: 'catering_context',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'page_id,title' });

      // Generate embeddings via API
      const res = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, title: bizName, contentMd: markdown, contentType: 'catering' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Saved! ${data.chunksCreated || '?'} AI chunks generated. Your AI assistant now knows your menu and packages.`);
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

      {/* Business Info */}
      <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">🏪 Business Information</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <input type="text" value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="Business name (e.g. Maria's Catering)" className="px-3 py-2 rounded-lg border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
          <input type="text" value={bizLocation} onChange={(e) => setBizLocation(e.target.value)} placeholder="Location (e.g. Quezon City)" className="px-3 py-2 rounded-lg border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
          <input type="text" value={serviceHours} onChange={(e) => setServiceHours(e.target.value)} placeholder="Service hours (e.g. Mon-Sat 8am-8pm)" className="px-3 py-2 rounded-lg border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
          <input type="text" value={serviceAreas} onChange={(e) => setServiceAreas(e.target.value)} placeholder="Service areas (e.g. Metro Manila, nearby provinces)" className="px-3 py-2 rounded-lg border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
        </div>
      </div>

      {/* Packages */}
      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">📦 Packages</h4>
          <button onClick={addPackage} className="text-xs px-2 py-1 rounded-lg bg-amber-200 text-amber-800 hover:bg-amber-300 font-medium">+ Add Package</button>
        </div>
        {packages.map((pkg, i) => (
          <div key={pkg.id} className="p-3 rounded-lg bg-white border border-amber-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Package {i + 1}</span>
              {packages.length > 1 && <button onClick={() => removePackage(pkg.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>}
            </div>
            <input type="text" value={pkg.name} onChange={(e) => updatePackage(pkg.id, 'name', e.target.value)} placeholder="Package name (e.g. Premium Wedding Package)" className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={pkg.pricePerHead} onChange={(e) => updatePackage(pkg.id, 'pricePerHead', e.target.value)} placeholder="₱/head (e.g. 450)" className="px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
              <input type="text" value={pkg.minPax} onChange={(e) => updatePackage(pkg.id, 'minPax', e.target.value)} placeholder="Min pax (e.g. 50)" className="px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
            </div>
            <input type="text" value={pkg.inclusions} onChange={(e) => updatePackage(pkg.id, 'inclusions', e.target.value)} placeholder="Inclusions (e.g. 6 viands, rice, dessert, drinks, waiters, set-up)" className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
            <input type="text" value={pkg.description} onChange={(e) => updatePackage(pkg.id, 'description', e.target.value)} placeholder="Short description (optional)" className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="p-4 rounded-xl bg-green-50/50 border border-green-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">🍽️ Menu Items</h4>
          <button onClick={addMenuItem} className="text-xs px-2 py-1 rounded-lg bg-green-200 text-green-800 hover:bg-green-300 font-medium">+ Add Menu Item</button>
        </div>
        {menuItems.map((item, i) => (
          <div key={item.id} className="flex gap-2 items-center">
            <input type="text" value={item.name} onChange={(e) => updateMenuItem(item.id, 'name', e.target.value)} placeholder={`Dish name (e.g. ${i === 0 ? 'Lechon Kawali' : 'Chicken Adobo'})`} className="flex-1 px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50" />
            <select value={item.category} onChange={(e) => updateMenuItem(item.id, 'category', e.target.value)} className="px-2 py-2 rounded-lg border border-green-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-400/50">
              <option>Viand</option><option>Rice</option><option>Dessert</option><option>Drinks</option><option>Appetizer</option><option>Soup</option><option>Others</option>
            </select>
            {menuItems.length > 1 && <button onClick={() => removeMenuItem(item.id)} className="text-xs text-red-400 hover:text-red-600 px-1">×</button>}
          </div>
        ))}
      </div>

      {/* Policies */}
      <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">📋 Policies & Terms</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <input type="text" value={downpayment} onChange={(e) => setDownpayment(e.target.value)} placeholder="Downpayment (e.g. 50% to secure date)" className="px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
          <input type="text" value={cancellation} onChange={(e) => setCancellation(e.target.value)} placeholder="Cancellation policy" className="px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
          <input type="text" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} placeholder="Delivery fee (e.g. Free within NCR, ₱500 outside)" className="px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
          <input type="text" value={freeTaste} onChange={(e) => setFreeTaste(e.target.value)} placeholder="Free taste test (e.g. Yes, for 100+ pax bookings)" className="px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
        </div>
        <textarea value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} placeholder="Any other info the AI should know? (e.g. special offers, dietary options, equipment rentals)" rows={2} className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-y" />
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
        {saving ? 'Saving...' : '💾 Save & Generate AI Knowledge'}
      </button>
    </div>
  );
}
