// ============================================================
// Dashboard — Main multi-tenant control panel
// ============================================================
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FacebookConnect } from '@/components/Dashboard/FacebookConnect';
import { ManualPageConnect } from '@/components/Dashboard/ManualPageConnect';
import { AIToggle } from '@/components/Dashboard/AIToggle';
import { KnowledgeBaseUploader } from '@/components/Dashboard/KnowledgeBaseUploader';
import { SchedulingConfig } from '@/components/Dashboard/SchedulingConfig';
import { SubscriptionCard } from '@/components/Dashboard/SubscriptionCard';
import { MessageLogTable } from '@/components/Dashboard/MessageLogTable';
import { PageSelector } from '@/components/Dashboard/PageSelector';
import { OnboardingWizard } from '@/components/Dashboard/OnboardingWizard';

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

  const params = await searchParams;
  const statusMessage = params.success
    ? { type: 'success' as const, text: `✅ Connected ${params.count || ''} page(s) successfully!` }
    : params.error
      ? { type: 'error' as const, text: `❌ Connection failed: ${params.error}` }
      : null;
  const selectedPageId = params.page;

  // Fetch tenant's connected pages (with error fallback)
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
  const hasSubscription = !!subscription;

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
            <Link
              href="/dashboard/leads"
              className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 font-medium hover:shadow-sm transition-all"
            >
              📋 Leads
            </Link>
            <span className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 font-medium border border-orange-200">
              {subscription
                ? `${subscription.plan.replace('week', ' Week')} Plan`
                : 'Free Plan'}
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ============ ONBOARDING WIZARD ============ */}
        {(!hasPages || !hasKb || !hasSubscription) && (
          <div className="mb-8">
            <OnboardingWizard
              hasPages={hasPages}
              hasKb={hasKb}
              hasSubscription={hasSubscription}
            />
          </div>
        )}

        {/* ============ WELCOME BANNER ============ */}
        {!hasPages && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff6b6b] via-[#f77f5d] to-[#ffa94d] p-8 text-white shadow-xl shadow-orange-300/30 mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">
                🚀 Let&apos;s get your Facebook Page connected!
              </h2>
              <p className="text-white/90 max-w-xl">
                Connect your Facebook page below and let AI handle customer inquiries 24/7 — in warm, friendly Taglish.
              </p>
            </div>
          </div>
        )}

        {/* ============ MAIN GRID: Sidebar + Content ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SIDEBAR */}
          <div className="lg:col-span-1 space-y-6">
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

            {/* Subscription Card */}
            <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">💎 Plan</h3>
              <SubscriptionCard
                currentPlan={profile?.plan || 'free'}
                subscription={subscription}
              />
            </section>

            {/* Quick Links */}
            <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">🔗 Quick Links</h3>
              <div className="space-y-1.5">
                <Link
                  href="/dashboard/leads"
                  className="block text-xs text-gray-600 hover:text-[#ff6b6b] transition-colors py-1.5 px-2 rounded-lg hover:bg-orange-50"
                >
                  📋 View All Leads
                </Link>
                <Link
                  href="/pricing"
                  className="block text-xs text-gray-600 hover:text-[#ff6b6b] transition-colors py-1.5 px-2 rounded-lg hover:bg-orange-50"
                >
                  💎 Upgrade Plan
                </Link>
              </div>
            </section>

            {/* Setup Checklist */}
            <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">✅ Setup</h3>
              <SetupChecklist
                hasPages={hasPages}
                hasKb={hasKb}
                hasSubscription={hasSubscription}
                webhookConfigured={false}
              />
            </section>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3 space-y-6">
            {/* Facebook Connect */}
            <section className="rounded-2xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-lg shadow-orange-100/50 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">📘</span> {hasPages ? 'Manage Pages' : 'Connect Your Facebook Page'}
              </h3>
              <FacebookConnect
                userId={user.id}
                existingPages={pages || []}
              />

              {/* Manual connect — hidden behind toggle for power users */}
              {(!pages || pages.length === 0) && (
                <details className="mt-4">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                    Having trouble? Connect manually →
                  </summary>
                  <div className="mt-3">
                    <ManualPageConnect userId={user.id} onSuccess={() => {}} />
                  </div>
                </details>
              )}
            </section>

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
                <KnowledgeBaseUploader pageId={activePage.id} />
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

function SetupChecklist({
  hasPages,
  hasKb,
  hasSubscription,
  webhookConfigured,
}: {
  hasPages: boolean;
  hasKb: boolean;
  hasSubscription: boolean;
  webhookConfigured: boolean;
}) {
  const steps = [
    { label: 'Facebook Page', done: hasPages },
    { label: 'Knowledge Base', done: hasKb },
    { label: 'Choose Plan', done: hasSubscription },
    { label: 'Webhook Config', done: webhookConfigured },
  ];

  return (
    <div className="space-y-1.5">
      {steps.map((step) => (
        <div key={step.label} className="flex items-center gap-2 text-xs">
          <span className={step.done ? 'text-green-500' : 'text-gray-300'}>
            {step.done ? '✅' : '⬜'}
          </span>
          <span className={step.done ? 'text-gray-700' : 'text-gray-400'}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
