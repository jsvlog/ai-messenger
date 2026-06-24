// ============================================================
// Dashboard — Managed Service client panel
// ============================================================
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FacebookConnect } from '@/components/Dashboard/FacebookConnect';
import { AIToggle } from '@/components/Dashboard/AIToggle';
import { KnowledgeBaseManager } from '@/components/Dashboard/KnowledgeBaseManager';
import { SchedulingConfig } from '@/components/Dashboard/SchedulingConfig';
import { MessageLogTable } from '@/components/Dashboard/MessageLogTable';
import { PageSelector } from '@/components/Dashboard/PageSelector';
import { getAnalytics, AnalyticsBar } from '@/components/Dashboard/AnalyticsPanel';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; success?: string; error?: string; count?: string }>;
}) {
  let supabase: any;
  let user: any;

  try {
    supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch (e: any) {
    console.error('[Dashboard] Auth error:', e?.message || e);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
        <div className="text-center p-10 warm-card">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to connect</h2>
          <p className="text-gray-500 text-sm mb-4">The database connection failed. Please try again.</p>
          <a href="/login" className="gradient-btn px-6 py-2 rounded-lg text-sm inline-block">Back to Login</a>
        </div>
      </div>
    );
  }

  if (!user) redirect('/login');

  const isAdmin = user.email === 'sczyrynjohnson@gmail.com';
  const params = await searchParams;
  const statusMessage = params.success
    ? { type: 'success' as const, text: `✅ Connected ${params.count || ''} page(s) successfully!` }
    : params.error
      ? { type: 'error' as const, text: `❌ Connection failed: ${params.error}` }
      : null;
  const selectedPageId = params.page;

  // Fetch tenant's data
  let pages: any[] = [];
  let profile: any = null;
  let subscription: any = null;
  let hasKb = false;

  try {
    const { data: pagesData } = await supabase
      .from('connected_pages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    pages = pagesData || [];

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = profileData;

    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();
    subscription = subData;
  } catch (e: any) {
    console.error('[Dashboard] Supabase error:', e?.message || e);
  }

  // Determine active page
  const activePage = selectedPageId
    ? (pages || []).find((p) => p.id === selectedPageId) || (pages?.[0] ?? null)
    : (pages?.[0] ?? null);

  // Check if knowledge base exists
  if (activePage) {
    try {
      const { count } = await supabase
        .from('knowledge_bases')
        .select('*', { count: 'exact', head: true })
        .eq('page_id', activePage.id);
      hasKb = (count || 0) > 0;
    } catch {}
  }

  const hasPages = (pages?.length || 0) > 0;
  const isSubActive = subscription && subscription.status === 'active';
  const daysLeft = isSubActive
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86400000))
    : 0;
  const planLabel = isSubActive
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : 'Managed Service';

  // Fetch analytics for active page
  let analytics = { msgsToday: 0, msgsWeek: 0, responseRate: 100, leadsCaptured: 0, avgLatencyMs: 0 };
  if (activePage) {
    analytics = await getAnalytics(activePage.id, supabase);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
      {/* Header */}
      <header className="border-b border-orange-200/50 bg-white/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6b6b] to-[#ffa94d] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-300/30">
              AI
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] bg-clip-text text-transparent">
                AI Messenger
              </h1>
              <p className="text-xs text-gray-500">
                {profile?.full_name || user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 text-purple-700 font-medium hover:shadow-sm transition-all"
              >
                🛠️ Admin
              </Link>
            )}
            <Link
              href="/dashboard/leads"
              className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 font-medium hover:shadow-sm transition-all"
            >
              📋 Leads
            </Link>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
              isSubActive
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200'
                : 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200'
            }`}>
              {isSubActive ? `${planLabel} · ${daysLeft}d left` : planLabel}
            </span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Status banner (success/error from FB connect) */}
      {statusMessage && (
        <div className={`w-full py-3 px-6 text-center text-sm font-medium ${
          statusMessage.type === 'success'
            ? 'bg-green-50 text-green-700 border-b border-green-200'
            : 'bg-red-50 text-red-700 border-b border-red-200'
        }`}>
          {statusMessage.text}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Analytics Bar */}
        {activePage && <AnalyticsBar stats={analytics} />}

        {/* Welcome banner (only if no pages yet) */}
        {!hasPages && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff6b6b] via-[#f77f5d] to-[#ffa94d] p-8 text-white shadow-xl shadow-orange-300/30 mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">
                🚀 Let&apos;s get your Facebook Page connected!
              </h2>
              <p className="text-white/90 max-w-xl">
                Your page is being set up by our team. Once connected, the AI will handle customer inquiries 24/7 — in warm, friendly Taglish.
              </p>
            </div>
          </div>
        )}

        {/* MAIN GRID: Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SIDEBAR */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            {/* Page Selector */}
            <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Your Pages
              </h3>
              <PageSelector
                userId={user.id}
                activePageId={activePage?.id}
              />
            </section>

            {/* Subscription Status */}
            <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">💎 Subscription</h3>
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-xl font-bold bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] bg-clip-text text-transparent">
                  {planLabel}
                </p>
                {isSubActive ? (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Active — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Managed by AI Messenger
                  </p>
                )}
              </div>
            </section>

            {/* Quick Links — Admin only */}
            {isAdmin && (
              <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">🔗 Quick Links</h3>
                <div className="space-y-1.5">
                  <Link
                    href="/dashboard/leads"
                    className="block text-xs text-gray-600 hover:text-[#ff6b6b] transition-colors py-1.5 px-2 rounded-lg hover:bg-orange-50"
                  >
                    📋 View All Leads
                  </Link>
                  {activePage && (
                    <Link
                      href={`/dashboard/connect`}
                      className="block text-xs text-gray-600 hover:text-[#ff6b6b] transition-colors py-1.5 px-2 rounded-lg hover:bg-orange-50"
                    >
                      ➕ Connect Another Page
                    </Link>
                  )}
                </div>
              </section>
            )}

            {/* Client help note */}
            {!isAdmin && (
              <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-4">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-600 text-center">
                  Need a new page connected? Contact us and we'll set it up for you. 📩
                </div>
              </section>
            )}
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
            {/* Facebook Connect — Admin only */}
            {isAdmin && (
              <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📘</span> {hasPages ? 'Manage Pages' : 'Connect Your Facebook Page'}
                </h3>
                <FacebookConnect
                  userId={user.id}
                  existingPages={pages || []}
                />
                {(!pages || pages.length === 0) && (
                  <p className="mt-3 text-center text-xs text-gray-400">
                    <Link href="/dashboard/connect" className="hover:text-[#ff6b6b] underline">
                      Or connect manually with Page Token →
                    </Link>
                  </p>
                )}
              </section>
            )}

            {/* AI Toggle */}
            {activePage && (
              <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">🤖</span> AI Auto-Reply
                </h3>
                <AIToggle pageId={activePage.id} />
              </section>
            )}

            {/* Scheduling */}
            {activePage && (
              <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">🕐</span> Business Hours Schedule
                </h3>
                <SchedulingConfig pageId={activePage.id} />
              </section>
            )}

            {/* Knowledge Base */}
            {activePage && (
              <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📚</span> Knowledge Base
                </h3>
                <KnowledgeBaseManager pageId={activePage.id} />
              </section>
            )}

            {/* Recent Messages */}
            {activePage && (
              <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">💬</span> Recent Messages
                </h3>
                <MessageLogTable pageId={activePage.id} />
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
