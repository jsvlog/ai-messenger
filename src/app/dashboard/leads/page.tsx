export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadsExportButton } from '@/components/leads/LeadsExportButton';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leads Dashboard — AI Messenger',
  description: 'View and export all captured leads from your Facebook Messenger conversations.',
};

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: pages } = await supabase
    .from('connected_pages')
    .select('id, page_name')
    .eq('user_id', user.id);

  const pageIds = (pages || []).map((p) => p.id);

  const { data: conversations } =
    pageIds.length > 0
      ? await supabase
          .from('conversation_context')
          .select('page_id, sender_psid, context_json, last_active')
          .in('page_id', pageIds)
          .order('last_active', { ascending: false })
          .limit(200)
      : { data: [] };

  const senderPsids = (conversations || []).map((c) => c.sender_psid);
  const uniquePsids = [...new Set(senderPsids)];

  let senderMap: Record<string, string> = {};
  if (uniquePsids.length > 0) {
    const { data: msgs } = await supabase
      .from('message_logs')
      .select('sender_psid, message_text')
      .in('sender_psid', uniquePsids)
      .eq('direction', 'incoming')
      .order('created_at', { ascending: false })
      .limit(500);

    const seen = new Set<string>();
    (msgs || []).forEach((m) => {
      if (!seen.has(m.sender_psid)) {
        seen.add(m.sender_psid);
        senderMap[m.sender_psid] = m.message_text.slice(0, 50);
      }
    });
  }

  const pageNameMap: Record<string, string> = {};
  (pages || []).forEach((p) => {
    pageNameMap[p.id] = p.page_name;
  });

  const leads = (conversations || [])
    .map((c) => {
      const leadInfo = c.context_json?.lead_info;
      if (!leadInfo) return null;
      return {
        id: c.sender_psid,
        pageName: pageNameMap[c.page_id] || 'Unknown Page',
        senderPsid: c.sender_psid,
        name: leadInfo.name || 'Unknown',
        phone: leadInfo.phone || '—',
        email: leadInfo.email || '—',
        eventDate: leadInfo.event_date || '—',
        budget: leadInfo.budget || '—',
        guestCount: leadInfo.guest_count || '—',
        eventType: leadInfo.event_type || '—',
        captured: leadInfo.captured || false,
        lastActive: c.last_active,
        lastMessage: senderMap[c.sender_psid] || '—',
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.captured ? 1 : 0) - (a!.captured ? 1 : 0));

  const exportLeads = leads.filter((l) => l!.captured).map((l) => l!);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
      <header className="border-b border-orange-200/50 bg-white/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6b6b] to-[#ffa94d] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-300/30">AI</div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] bg-clip-text text-transparent">AI Messenger</h1>
            </Link>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-[#ff6b6b] transition-colors">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Leads" value={leads.length} color="coral" />
          <StatCard label="Hot Leads" value={leads.filter((l) => l!.captured).length} color="green" />
          <StatCard label="Pages" value={pages?.length || 0} color="amber" />
          <StatCard label="With Phone" value={leads.filter((l) => l!.phone !== '—').length} color="blue" />
        </div>

        <div className="warm-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Captured Leads</h2>
            <LeadsExportButton leads={exportLeads} />
          </div>
          <LeadsTable leads={leads.filter((l): l is NonNullable<typeof l> => l !== null)} />
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'coral' | 'green' | 'amber' | 'blue' }) {
  const colors: Record<string, string> = {
    coral: 'from-[#ff6b6b]/10 to-[#ff6b6b]/5 border-[#ff6b6b]/20',
    green: 'from-green-50 to-green-50/50 border-green-100',
    amber: 'from-amber-50 to-amber-50/50 border-amber-100',
    blue: 'from-blue-50 to-blue-50/50 border-blue-100',
  };
  const texts: Record<string, string> = {
    coral: 'text-[#ff6b6b]', green: 'text-green-600', amber: 'text-amber-600', blue: 'text-blue-600',
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${colors[color]} border p-4`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${texts[color]}`}>{value}</p>
    </div>
  );
}
