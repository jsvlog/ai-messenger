// ============================================================
// AnalyticsPanel — Stats bar for dashboard (server component)
// ============================================================

interface Props {
  pageId: string;
  supabase: any;
}

export async function getAnalytics(pageId: string, supabase: any) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  try {
    const [
      { count: msgsToday },
      { count: msgsWeek },
      { count: replied },
      { count: leadsWeek },
      { data: avgLatency },
    ] = await Promise.all([
      supabase.from('message_logs').select('*', { count: 'exact', head: true }).eq('page_id', pageId).gte('created_at', today.toISOString()),
      supabase.from('message_logs').select('*', { count: 'exact', head: true }).eq('page_id', pageId).gte('created_at', weekAgo.toISOString()),
      supabase.from('message_logs').select('*', { count: 'exact', head: true }).eq('page_id', pageId).eq('direction', 'incoming').gte('created_at', today.toISOString()),
      supabase.from('conversation_context').select('context_json', { count: 'exact', head: false }).eq('page_id', pageId).gte('last_active', weekAgo.toISOString()).limit(100),
      supabase.from('message_logs').select('ai_latency_ms').eq('page_id', pageId).eq('ai_processed', true).gte('created_at', today.toISOString()).limit(50),
    ]);

    const replyCount = (replied || 0);
    const responseRate = msgsToday > 0 ? Math.round((replyCount / (msgsToday || 1)) * 100) : 100;
    const leadsCaptured = (leadsWeek || []).filter((c: any) => c?.context_json?.lead_info?.captured).length;
    const avgMs = avgLatency?.length ? Math.round((avgLatency as any[]).reduce((s: number, m: any) => s + (m.ai_latency_ms || 0), 0) / avgLatency.length) : 0;

    return { msgsToday: msgsToday || 0, msgsWeek: msgsWeek || 0, responseRate, leadsCaptured, avgLatencyMs: avgMs };
  } catch {
    return { msgsToday: 0, msgsWeek: 0, responseRate: 100, leadsCaptured: 0, avgLatencyMs: 0 };
  }
}

export function AnalyticsBar({ stats }: { stats: { msgsToday: number; msgsWeek: number; responseRate: number; leadsCaptured: number; avgLatencyMs: number } }) {
  const items = [
    { label: 'Messages today', value: stats.msgsToday, sub: '/20 free', color: 'coral' },
    { label: 'This week', value: stats.msgsWeek, sub: 'total', color: 'amber' },
    { label: 'Response rate', value: `${stats.responseRate}%`, sub: 'today', color: 'green' },
    { label: 'Leads captured', value: stats.leadsCaptured, sub: 'this week', color: 'blue' },
    { label: 'Avg reply', value: stats.avgLatencyMs > 0 ? `${(stats.avgLatencyMs / 1000).toFixed(1)}s` : '—', sub: 'today', color: 'purple' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-white/80 border border-orange-100 p-3 shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
          <p className="text-xl font-bold text-gray-800 mt-0.5">{item.value}</p>
          <p className="text-[10px] text-gray-400">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
