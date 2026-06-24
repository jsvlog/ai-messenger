'use client';

// ============================================================
// Admin Dashboard — Client Management + Payments + Recovery
// ============================================================
// ONLY the admin (ADMIN_EMAIL) can access this page.
// Manages all clients, their payment status, and system recovery.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FacebookConnect } from '@/components/Dashboard/FacebookConnect';

// ============================================================
// Types
// ============================================================
type ClientRecord = {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  plan_expires_at: string | null;
  pages: { page_name: string; page_id: string; is_active: boolean }[];
  last_payment: { amount: number; date: string; plan: string } | null;
  created_at: string;
};

type PaymentRecord = {
  id: string;
  user_id: string;
  client_email: string;
  client_name: string;
  amount: number;
  plan: string;
  payment_date: string;
  payment_method: string;
  notes: string;
};

type RecoverResult = {
  success: boolean;
  summary?: {
    totalPagesFromMeta: number;
    pagesUpdated: number;
    webhooksSubscribed: number;
    webhooksFailed: number;
    elapsedMs: number;
  };
  details?: Array<{
    pageName: string;
    pageId: string;
    tokenUpdated: boolean;
    webhookSubscribed: boolean;
    error?: string;
  }>;
  error?: string;
};

type Tab = 'clients' | 'payments' | 'recovery';

// ============================================================
// Main Component
// ============================================================
export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('clients');

  // Client data
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  // Payment data
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Add payment modal
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentPlan, setPaymentPlan] = useState('starter');
  const [paymentDays, setPaymentDays] = useState('28');
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [addPaymentLoading, setAddPaymentLoading] = useState(false);
  const [addPaymentMsg, setAddPaymentMsg] = useState('');

  // Connect page modal (admin connects FB page on behalf of a client)
  const [showConnectPage, setShowConnectPage] = useState(false);
  const [connectClient, setConnectClient] = useState<ClientRecord | null>(null);

  // Recovery
  const [recoveryToken, setRecoveryToken] = useState('');
  const [recoveryRunning, setRecoveryRunning] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<RecoverResult | null>(null);
  const [recoveryError, setRecoveryError] = useState('');

  const ADMIN_EMAIL = 'sczyrynjohnson@gmail.com';

  // ---- Auth check ----
  useEffect(() => {
    (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        setUser(data?.user || null);
        if (data?.user?.email === ADMIN_EMAIL) {
          setIsAdmin(true);
          loadClients();
          loadPayments();
        }
      } catch (e) {
        console.error('Auth error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- Load clients ----
  const loadClients = async () => {
    setClientsLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_admin_clients');
      if (error) {
        console.error('Load clients error:', error);
        // Fallback: load manually
        await loadClientsFallback();
      } else if (data) {
        setClients(data as ClientRecord[]);
      }
    } catch (e) {
      console.error('Load clients exception:', e);
      await loadClientsFallback();
    } finally {
      setClientsLoading(false);
    }
  };

  const loadClientsFallback = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profiles) { setClients([]); return; }

      const enriched: ClientRecord[] = [];
      for (const p of profiles) {
        // Get connected pages
        const { data: pages } = await supabase
          .from('connected_pages')
          .select('page_name, page_id, is_active')
          .eq('user_id', p.id);

        // Get last subscription
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', p.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const sub = subs?.[0];

        // Get last payment
        const { data: pays } = await supabase
          .from('payment_logs')
          .select('*')
          .eq('user_id', p.id)
          .order('payment_date', { ascending: false })
          .limit(1);

        const pay = pays?.[0];

        enriched.push({
          id: p.id,
          email: p.email || '',
          full_name: p.full_name || p.email?.split('@')[0] || 'Unknown',
          plan: p.plan || sub?.plan || 'free',
          plan_expires_at: sub?.expires_at || null,
          pages: (pages || []).map((pg: any) => ({
            page_name: pg.page_name,
            page_id: pg.page_id,
            is_active: pg.is_active,
          })),
          last_payment: pay ? {
            amount: pay.amount,
            date: pay.payment_date,
            plan: pay.plan,
          } : null,
          created_at: p.created_at,
        });
      }
      setClients(enriched);
    } catch (e) {
      console.error('Fallback load error:', e);
      setClients([]);
    }
  };

  // ---- Load payments ----
  const loadPayments = async () => {
    setPaymentsLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('payment_logs')
        .select('*')
        .order('payment_date', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Load payments error:', error);
        setPayments([]);
      } else if (data) {
        // Enrich with client info
        const enriched: PaymentRecord[] = [];
        for (const p of data) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', p.user_id)
            .single();

          enriched.push({
            id: p.id,
            user_id: p.user_id,
            client_email: profile?.email || 'unknown',
            client_name: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
            amount: p.amount,
            plan: p.plan,
            payment_date: p.payment_date,
            payment_method: p.payment_method || 'manual',
            notes: p.notes || '',
          });
        }
        setPayments(enriched);
      }
    } catch (e) {
      console.error('Load payments error:', e);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  // ---- Add payment ----
  const handleAddPayment = async () => {
    if (!selectedClient || !paymentAmount) {
      setAddPaymentMsg('Please select a client and enter an amount.');
      return;
    }
    setAddPaymentLoading(true);
    setAddPaymentMsg('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Insert payment
      const { error: payError } = await supabase.from('payment_logs').insert({
        user_id: selectedClient,
        amount: parseFloat(paymentAmount),
        plan: paymentPlan,
        plan_duration_days: parseInt(paymentDays),
        payment_method: paymentMethod,
        notes: paymentNotes || null,
      });

      if (payError) {
        setAddPaymentMsg(`Error: ${payError.message}`);
        setAddPaymentLoading(false);
        return;
      }

      // Update subscription
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(paymentDays));

      const { error: subError } = await supabase.from('subscriptions').upsert({
        user_id: selectedClient,
        plan: paymentPlan,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'user_id' });

      if (subError) {
        console.error('Sub update error:', subError);
      }

      // Update profile plan
      await supabase
        .from('profiles')
        .update({ plan: paymentPlan })
        .eq('id', selectedClient);

      setAddPaymentMsg('✅ Payment recorded! Plan updated.');
      setShowAddPayment(false);
      setPaymentAmount('');
      setPaymentNotes('');
      setSelectedClient('');

      // Refresh data
      await loadClients();
      await loadPayments();
    } catch (e: any) {
      setAddPaymentMsg(`Error: ${e.message}`);
    } finally {
      setAddPaymentLoading(false);
    }
  };

  // ---- Recovery ----
  const handleRecover = async () => {
    if (!recoveryToken.trim()) {
      setRecoveryError('Please paste your user access token.');
      return;
    }
    setRecoveryError('');
    setRecoveryRunning(true);
    setRecoveryResult(null);

    try {
      const res = await fetch('/api/admin/recover-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAccessToken: recoveryToken.trim() }),
      });
      const data = await res.json();
      setRecoveryResult(data);
      if (!data.success && data.error) {
        setRecoveryError(data.error);
      }
    } catch (e: any) {
      setRecoveryError(e?.message || 'Network error');
    } finally {
      setRecoveryRunning(false);
    }
  };

  // ---- Helper ----
  const getPlanColor = (plan: string) => {
    if (plan === 'pro') return 'text-purple-600 bg-purple-50';
    if (plan === 'starter') return 'text-amber-600 bg-amber-50';
    return 'text-gray-500 bg-gray-100';
  };

  const isPlanActive = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) > new Date();
  };

  const daysUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 0;
    return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  };

  // ---- Loading / Auth Gates ----
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6] flex items-center justify-center">
        <div className="warm-card p-10 text-center">
          <div className="skeleton w-48 h-6 rounded mx-auto mb-4" />
          <div className="skeleton w-32 h-4 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6] flex items-center justify-center">
        <div className="warm-card p-10 text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">🔒 Admin Only</h2>
          <p className="text-gray-500 text-sm mb-4">You must be logged in.</p>
          <Link href="/login" className="gradient-btn px-6 py-2 rounded-lg text-sm inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6] flex items-center justify-center">
        <div className="warm-card p-10 text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">🚫 Access Denied</h2>
          <p className="text-gray-500 text-sm">
            {user.email} is not the admin.
          </p>
          <Link href="/dashboard" className="gradient-btn px-6 py-2 rounded-lg text-sm inline-block mt-4">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
      <div className="orb orb-coral" />
      <div className="orb orb-amber" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">
              &larr; Customer Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mt-1">🛠️ Admin Panel</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Managed Service — {clients.length} clients
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 block">{user.email}</span>
            <Link href="/dashboard/recovery" className="text-xs text-amber-600 hover:text-amber-700">
              recovery page (standalone) →
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'clients' as Tab, label: '👥 Clients', count: clients.length },
            { key: 'payments' as Tab, label: '💰 Payments', count: payments.length },
            { key: 'recovery' as Tab, label: '🔄 Recovery' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'gradient-btn text-white shadow-md'
                  : 'bg-white/60 text-gray-600 hover:bg-white border border-orange-100'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* =========================================== */}
        {/* TAB 1: Clients */}
        {/* =========================================== */}
        {activeTab === 'clients' && (
          <div className="space-y-4 fade-in">
            {clientsLoading ? (
              <div className="warm-card p-10 text-center text-gray-400">Loading clients...</div>
            ) : clients.length === 0 ? (
              <div className="warm-card p-10 text-center">
                <p className="text-gray-400 text-sm">No clients yet.</p>
                <p className="text-gray-300 text-xs mt-1">
                  Clients appear when they sign up at /login
                </p>
              </div>
            ) : (
              clients.map((client) => {
                const active = isPlanActive(client.plan_expires_at);
                const daysLeft = daysUntilExpiry(client.plan_expires_at);
                return (
                  <div key={client.id} className="warm-card p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* Client info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {client.full_name}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getPlanColor(client.plan)}`}>
                            {client.plan.toUpperCase()}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                          }`}>
                            {active ? `Active · ${daysLeft}d left` : 'Expired'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{client.email}</p>
                        {/* Connected pages */}
                        {client.pages.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {client.pages.map((pg) => (
                              <span
                                key={pg.page_id}
                                className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  pg.is_active
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {pg.page_name}
                              </span>
                            ))}
                          </div>
                        )}
                        {client.pages.length === 0 && (
                          <p className="text-xs text-gray-300 mt-1">No pages connected</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {client.last_payment && (
                          <div className="text-right mr-2">
                            <p className="text-xs text-gray-400">Last payment</p>
                            <p className="text-sm font-semibold text-gray-700">
                              ₱{client.last_payment.amount} · {client.last_payment.plan}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(client.last_payment.date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setConnectClient(client);
                            setShowConnectPage(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          + Connect Page
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClient(client.id);
                            setShowAddPayment(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        >
                          + Payment
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* =========================================== */}
        {/* TAB 2: Payments */}
        {/* =========================================== */}
        {activeTab === 'payments' && (
          <div className="space-y-4 fade-in">
            {/* Add Payment Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-600">
                Payment History
              </h3>
              <button
                onClick={() => setShowAddPayment(true)}
                className="gradient-btn px-4 py-2 rounded-lg text-sm"
              >
                + Record Payment
              </button>
            </div>

            {paymentsLoading ? (
              <div className="warm-card p-10 text-center text-gray-400">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="warm-card p-10 text-center">
                <p className="text-gray-400 text-sm">No payments recorded yet.</p>
                <p className="text-gray-300 text-xs mt-1">
                  Record payments manually when clients pay via GCash, bank transfer, or cash.
                </p>
              </div>
            ) : (
              <div className="warm-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-orange-100">
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Plan</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-orange-50/50 hover:bg-orange-50/30">
                          <td className="py-2.5 px-4">
                            <span className="font-medium text-gray-700">{p.client_name}</span>
                            <span className="text-xs text-gray-400 block">{p.client_email}</span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-gray-700">
                            ₱{p.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getPlanColor(p.plan)}`}>
                              {p.plan.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-500">
                            {p.payment_method === 'gcash' ? 'GCash' :
                             p.payment_method === 'bank_transfer' ? 'Bank Transfer' :
                             p.payment_method === 'cash' ? 'Cash' : p.payment_method}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-500">
                            {new Date(p.payment_date).toLocaleDateString('en-PH', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-400 max-w-[150px] truncate">
                            {p.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================== */}
        {/* TAB 3: Recovery */}
        {/* =========================================== */}
        {activeTab === 'recovery' && (
          <div className="space-y-4 fade-in">
            {/* Warning */}
            <div className="warm-card p-5 border-l-4 border-amber-400 bg-amber-50/50">
              <h3 className="font-semibold text-amber-800 text-sm mb-2">⚠️ Before Running Recovery</h3>
              <ol className="text-xs text-amber-700 space-y-1 ml-4 list-decimal">
                <li>Create a new Meta app at <a href="https://developers.facebook.com/apps" target="_blank" className="underline">developers.facebook.com</a></li>
                <li>Add Messenger product, set webhook URL + verify token</li>
                <li>Subscribe to <strong>messages</strong> field in Meta dashboard</li>
                <li>Get a User Access Token from Graph API Explorer (new app, with pages_messaging + pages_show_list)</li>
                <li>Paste token below and click Recover</li>
              </ol>
            </div>

            {/* Token Input */}
            <div className="warm-card p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                User Access Token (new Meta app)
              </label>
              <textarea
                value={recoveryToken}
                onChange={(e) => setRecoveryToken(e.target.value)}
                placeholder="Paste token here..."
                rows={3}
                className="w-full border border-orange-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 bg-white/60 focus:outline-none focus:ring-2 focus:ring-coral/30 resize-none"
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-400">Token is never stored.</span>
                <button
                  onClick={handleRecover}
                  disabled={recoveryRunning || !recoveryToken.trim()}
                  className="gradient-btn px-6 py-2.5 rounded-xl text-sm disabled:opacity-50"
                >
                  {recoveryRunning ? 'Running...' : '🔄 Recover All Pages'}
                </button>
              </div>
              {recoveryError && (
                <p className="mt-3 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{recoveryError}</p>
              )}
            </div>

            {/* Results */}
            {recoveryResult && (
              <div className="fade-in space-y-3">
                {recoveryResult.summary && (
                  <div className="warm-card p-5">
                    <h3 className={`font-bold text-sm mb-3 ${recoveryResult.success ? 'text-green-700' : 'text-amber-700'}`}>
                      {recoveryResult.success ? '✅ Recovery Complete' : '⚠️ Recovery Finished (issues)'}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <MiniStat label="Pages from Meta" value={recoveryResult.summary.totalPagesFromMeta} />
                      <MiniStat label="Updated" value={recoveryResult.summary.pagesUpdated} color="green" />
                      <MiniStat label="Webhooks OK" value={recoveryResult.summary.webhooksSubscribed} color="green" />
                      <MiniStat label="Failed" value={recoveryResult.summary.webhooksFailed} color="red" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{recoveryResult.summary.elapsedMs}ms elapsed</p>
                  </div>
                )}
                {recoveryResult.details && (
                  <div className="warm-card p-5">
                    <h3 className="font-bold text-sm text-gray-700 mb-2">Details</h3>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {recoveryResult.details.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 py-1 border-b border-orange-50">
                          <span className="font-medium truncate flex-1">{d.pageName}</span>
                          <span>{d.tokenUpdated ? '✅' : '❌'}</span>
                          <span>{d.webhookSubscribed ? '✅' : '❌'}</span>
                          {d.error && <span className="text-red-400 text-[10px] truncate max-w-[120px]">{d.error}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================== */}
        {/* Add Payment Modal */}
        {/* =========================================== */}
        {showAddPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="warm-card p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="font-bold text-gray-800 mb-4">Record Payment</h3>

              {/* Client selector */}
              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">Client</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-orange-200 text-sm bg-white/60 focus:outline-none focus:ring-2 focus:ring-coral/30"
                >
                  <option value="">Select client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">Amount (₱)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 499"
                  className="w-full px-3 py-2 rounded-xl border border-orange-200 text-sm bg-white/60 focus:outline-none focus:ring-2 focus:ring-coral/30"
                />
              </div>

              {/* Plan + Duration row */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Plan</label>
                  <select
                    value={paymentPlan}
                    onChange={(e) => setPaymentPlan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-orange-200 text-sm bg-white/60 focus:outline-none focus:ring-2 focus:ring-coral/30"
                  >
                    <option value="starter">Starter (₱499)</option>
                    <option value="pro">Pro (₱999)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Duration (days)</label>
                  <select
                    value={paymentDays}
                    onChange={(e) => setPaymentDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-orange-200 text-sm bg-white/60 focus:outline-none focus:ring-2 focus:ring-coral/30"
                  >
                    <option value="14">14 days (2 weeks)</option>
                    <option value="28">28 days (4 weeks)</option>
                    <option value="30">30 days</option>
                    <option value="84">84 days (12 weeks)</option>
                    <option value="365">365 days (1 year)</option>
                  </select>
                </div>
              </div>

              {/* Method */}
              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-orange-200 text-sm bg-white/60 focus:outline-none focus:ring-2 focus:ring-coral/30"
                >
                  <option value="gcash">GCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="maya">Maya</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. GCash ref #, bank details"
                  className="w-full px-3 py-2 rounded-xl border border-orange-200 text-sm bg-white/60 focus:outline-none focus:ring-2 focus:ring-coral/30"
                />
              </div>

              {addPaymentMsg && (
                <p className={`text-xs mb-3 px-3 py-2 rounded-lg ${
                  addPaymentMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
                }`}>
                  {addPaymentMsg}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddPayment(false); setAddPaymentMsg(''); }}
                  className="flex-1 px-4 py-2 rounded-xl text-sm border border-orange-200 text-gray-600 hover:bg-orange-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={addPaymentLoading}
                  className="flex-1 gradient-btn px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                >
                  {addPaymentLoading ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================== */}
        {/* Connect Page Modal (Admin → Client) */}
        {/* =========================================== */}
        {showConnectPage && connectClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="warm-card p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="font-bold text-gray-800 mb-1">Connect Facebook Page</h3>
              <p className="text-xs text-gray-500 mb-4">
                for <span className="font-medium text-gray-700">{connectClient.full_name}</span> ({connectClient.email})
              </p>

              <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 space-y-1.5">
                <p className="font-medium text-blue-700">How this works:</p>
                <ol className="list-decimal ml-4 space-y-1 text-blue-600">
                  <li>Ask the client to make you admin of their Facebook Page</li>
                  <li>Click "Connect Pages" below — Facebook will ask you to approve pages</li>
                  <li>Pages get assigned directly to {connectClient.full_name.split(' ')[0]}'s account</li>
                  <li>The client can then manage KB, AI toggle, and schedules</li>
                </ol>
              </div>

              <FacebookConnect
                userId={user.id}
                existingPages={connectClient.pages.map(p => ({ id: p.page_id, page_id: p.page_id, page_name: p.page_name }))}
                targetUserId={connectClient.id}
                targetUserName={connectClient.full_name}
              />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => { setShowConnectPage(false); setConnectClient(null); }}
                  className="px-4 py-2 rounded-xl text-sm border border-orange-200 text-gray-600 hover:bg-orange-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mini stat for recovery
function MiniStat({ label, value, color = '' }: { label: string; value: string | number; color?: string }) {
  const clr = color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-500' : 'text-gray-700';
  return (
    <div className="bg-white/50 rounded-xl px-3 py-2 text-center">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${clr}`}>{value}</p>
    </div>
  );
}
