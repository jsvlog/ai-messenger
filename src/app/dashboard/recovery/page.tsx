'use client';

// ============================================================
// Admin Recovery Page — Reconnect all pages to a new Meta App
// ============================================================
// ONLY accessible to the admin (ADMIN_EMAIL).
// Use this when your Meta app gets banned/disabled and you
// create a new one. Point the new app's webhook here, then
// paste a user access token and click Recover All Pages.
// ============================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';

type RecoverResult = {
  success: boolean;
  summary?: {
    totalPagesFromMeta: number;
    pagesUpdated: number;
    pagesNotFound: number;
    webhooksSubscribed: number;
    webhooksFailed: number;
    elapsedMs: number;
    tokenExpiresIn: number | null;
  };
  details?: Array<{
    pageId: string;
    pageName: string;
    dbMatched: boolean;
    tokenUpdated: boolean;
    webhookSubscribed: boolean;
    error?: string;
  }>;
  nextSteps?: string[];
  error?: string;
  debug?: any;
};

export default function RecoveryPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RecoverResult | null>(null);
  const [error, setError] = useState('');

  // Check auth on mount
  useEffect(() => {
    (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        setUser(data?.user || null);

        // Admin check is also done server-side, but we gate the UI
        const adminEmail = 'sczyrynjohnson@gmail.com';
        setIsAdmin(data?.user?.email === adminEmail);
      } catch (e) {
        console.error('Auth error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRecover = async () => {
    if (!token.trim()) {
      setError('Please paste your user access token.');
      return;
    }
    setError('');
    setRunning(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/recover-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAccessToken: token.trim() }),
      });
      const data: RecoverResult = await res.json();
      setResult(data);
      if (!data.success && data.error) {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e?.message || 'Network error — try again.');
    } finally {
      setRunning(false);
    }
  };

  // ---- Loading ----
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

  // ---- Not logged in ----
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6] flex items-center justify-center">
        <div className="warm-card p-10 text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">🔒 Admin Access Only</h2>
          <p className="text-gray-500 text-sm mb-4">You must be logged in as the admin.</p>
          <Link href="/login" className="gradient-btn px-6 py-2 rounded-lg text-sm inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ---- Not admin ----
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6] flex items-center justify-center">
        <div className="warm-card p-10 text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">🚫 Access Denied</h2>
          <p className="text-gray-500 text-sm mb-1">
            Logged in as <strong>{user.email}</strong>
          </p>
          <p className="text-gray-400 text-xs mb-4">
            Only the admin account can run recovery.
          </p>
          <Link href="/dashboard" className="gradient-btn px-6 py-2 rounded-lg text-sm inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ---- Admin view ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
      {/* Orbs */}
      <div className="orb orb-coral" />
      <div className="orb orb-amber" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">
            🛠️ App Recovery
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Reconnect all pages to a new Meta app after the old one is disabled.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="warm-card p-5 mb-6 border-l-4 border-amber-400 bg-amber-50/50">
          <h3 className="font-semibold text-amber-800 text-sm mb-2">
            ⚠️ Read Before Running
          </h3>
          <ul className="text-xs text-amber-700 space-y-1.5 ml-4 list-decimal">
            <li>
              Create a <strong>new Meta app</strong> at{' '}
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                className="underline"
              >
                developers.facebook.com
              </a>
            </li>
            <li>
              Add <strong>Messenger</strong> product to the new app.
            </li>
            <li>
              Set the <strong>webhook callback URL</strong> to:{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">
                https://ai-messenger-pi.vercel.app/api/webhook/facebook
              </code>
            </li>
            <li>
              Set the <strong>verify token</strong> to:{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">
                hermes_ai_messenger_verify_2024
              </code>
            </li>
            <li>
              Go to Messenger &rarr; Webhooks &rarr; click{' '}
              <strong>Subscribe</strong> on the <strong>messages</strong> field.
            </li>
            <li>
              Get a <strong>User Access Token</strong> for the new app via{' '}
              <a
                href="https://developers.facebook.com/tools/explorer"
                target="_blank"
                className="underline"
              >
                Graph API Explorer
              </a>
              {' '}(select your new app, add permissions:{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded text-xs">pages_messaging</code>
              ,{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded text-xs">pages_show_list</code>
              ).
            </li>
          </ul>
        </div>

        {/* Token Input */}
        <div className="warm-card p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            User Access Token (from new Meta app)
          </label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your user access token here..."
            rows={3}
            className="w-full border border-orange-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 bg-white/60 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/50 resize-none"
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-400">
              Token is sent server-side and never stored.
            </span>
            <button
              onClick={handleRecover}
              disabled={running || !token.trim()}
              className="gradient-btn px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {running ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Recovering...
                </span>
              ) : (
                '🔄 Recover All Pages'
              )}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="fade-in space-y-4">
            {/* Summary Card */}
            {result.summary && (
              <div className="warm-card p-6">
                <h3 className="font-bold text-gray-800 mb-3">
                  {result.success ? '✅ Recovery Complete' : '⚠️ Recovery Finished (with issues)'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Stat label="Pages from Meta" value={result.summary.totalPagesFromMeta} />
                  <Stat label="Tokens Updated" value={result.summary.pagesUpdated} color="green" />
                  <Stat label="Not in DB" value={result.summary.pagesNotFound} color="yellow" />
                  <Stat label="Webhooks OK" value={result.summary.webhooksSubscribed} color="green" />
                  <Stat label="Webhooks Failed" value={result.summary.webhooksFailed} color="red" />
                  <Stat label="Elapsed" value={`${result.summary.elapsedMs}ms`} />
                </div>
                {result.summary.tokenExpiresIn && (
                  <p className="text-xs text-gray-400 mt-3">
                    Token expires in {Math.round(result.summary.tokenExpiresIn / 86400)} days
                  </p>
                )}
              </div>
            )}

            {/* Per-Page Details */}
            {result.details && result.details.length > 0 && (
              <div className="warm-card p-6">
                <h3 className="font-bold text-gray-800 mb-3">Page-by-Page Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-orange-100">
                        <th className="pb-2 pr-3">Page</th>
                        <th className="pb-2 pr-3">DB Match</th>
                        <th className="pb-2 pr-3">Token</th>
                        <th className="pb-2 pr-3">Webhook</th>
                        <th className="pb-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.details.map((d) => (
                        <tr key={d.pageId} className="border-b border-orange-50/50">
                          <td className="py-2 pr-3 font-medium text-gray-700">
                            {d.pageName}
                            <span className="text-xs text-gray-400 block">{d.pageId}</span>
                          </td>
                          <td className="py-2 pr-3">{d.dbMatched ? '✅' : '❌'}</td>
                          <td className="py-2 pr-3">{d.tokenUpdated ? '✅' : '—'}</td>
                          <td className="py-2 pr-3">{d.webhookSubscribed ? '✅' : '❌'}</td>
                          <td className="py-2 text-xs text-red-400 max-w-[150px] truncate">
                            {d.error || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Next Steps */}
            {result.nextSteps && (
              <div className="warm-card p-5 border-l-4 border-green-400 bg-green-50/50">
                <h3 className="font-semibold text-green-800 text-sm mb-2">📋 Remaining Manual Steps</h3>
                <ul className="text-xs text-green-700 space-y-1 ml-4 list-disc">
                  {result.nextSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Debug (for failures) */}
            {result.debug && (
              <details className="warm-card p-4">
                <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
                <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">
                  {JSON.stringify(result.debug, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-10">
          Admin only &bull; Logged in as {user.email}
        </p>
      </div>
    </div>
  );
}

// Mini stat component
function Stat({
  label,
  value,
  color = '',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  const colorClass =
    color === 'green'
      ? 'text-green-600'
      : color === 'red'
        ? 'text-red-500'
        : color === 'yellow'
          ? 'text-amber-500'
          : 'text-gray-700';
  return (
    <div className="bg-white/40 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}
