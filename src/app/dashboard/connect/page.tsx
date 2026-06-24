'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_EMAILS = ['sczyrynjohnson@gmail.com'];

export default function ConnectPage() {
  const [step, setStep] = useState(1);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/dashboard'); return; }
      const isAdmin = ADMIN_EMAILS.includes(user.email || '');
      if (!isAdmin) { router.replace('/dashboard?error=admin_only'); return; }
      setAuthorized(true);
    })();
  }, [router]);

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6] flex items-center justify-center">
        <div className="text-sm text-gray-400 animate-pulse">Checking access...</div>
      </div>
    );
  }

  const handleConnect = async () => {
    if (!pageId || !pageName || !accessToken) {
      setMessage('❌ All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { error } = await supabase.from('connected_pages').upsert({
        user_id: user.id,
        page_id: pageId,
        page_name: pageName,
        page_access_token: accessToken,
        page_category: 'Business',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,page_id' });

      if (error) throw error;

      // Subscribe the page to our webhook so Meta sends us message events
      setMessage('⏳ Subscribing page to webhook...');
      const { subscribePageToWebhook } = await import('@/lib/facebook');
      const subscribed = await subscribePageToWebhook(accessToken);
      if (!subscribed) {
        console.warn('[Connect] Webhook subscription may have failed — check Meta dashboard');
      }

      setMessage('✅ Connected! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (e: any) {
      setMessage(`❌ ${e?.message || 'Failed'}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
      <header className="border-b border-orange-200/50 bg-white/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-[#ff6b6b]">← Back to Dashboard</Link>
          <div className="flex items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-[#ffa94d]' : 'bg-gray-200'}`} />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
            <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-[#ffa94d]' : 'bg-gray-200'}`} />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white' : 'bg-gray-200 text-gray-400'}`}>3</div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Step 1: Open Meta Dashboard */}
        {step === 1 && (
          <div className="warm-card p-6 fade-in">
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl mb-3">🔗</div>
              <h2 className="text-lg font-bold text-gray-800">Step 1: Open Facebook Developer</h2>
              <p className="text-sm text-gray-500 mt-1">Click the button below to open Facebook's page token generator in a new tab.</p>
            </div>

            <a
              href="https://developers.facebook.com/apps/2093101957935499/messenger"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-xl bg-[#1877f2] text-white font-semibold text-center text-sm hover:bg-[#1465d8] transition-colors mb-3"
            >
              🔓 Open Facebook Token Page →
            </a>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700 space-y-1.5">
              <p className="font-medium">On that page:</p>
              <p>1. Scroll to <strong>"Generate access tokens"</strong></p>
              <p>2. Click <strong>"Add or Remove Pages"</strong></p>
              <p>3. Select your Facebook Page</p>
              <p>4. Click <strong>"Generate Token"</strong></p>
              <p>5. Copy the token (long text)</p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white font-semibold text-sm hover:shadow-lg transition-all"
            >
              I've opened it — Next →
            </button>
          </div>
        )}

        {/* Step 2: Copy Page ID + Token */}
        {step === 2 && (
          <div className="warm-card p-6 fade-in">
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl mb-3">📋</div>
              <h2 className="text-lg font-bold text-gray-800">Step 2: Copy Your Page Info</h2>
              <p className="text-sm text-gray-500 mt-1">You need 3 things from the Facebook page you just opened.</p>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-[#ff6b6b] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                <div className="text-xs text-gray-600">
                  <p className="font-medium text-gray-800">Page Name</p>
                  <p>The name of your Facebook Page (e.g. "JS Money Vlog")</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-[#ffa94d] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                <div className="text-xs text-gray-600">
                  <p className="font-medium text-gray-800">Page ID</p>
                  <p>A number like "362708643591426" — shown next to your page name</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                <div className="text-xs text-gray-600">
                  <p className="font-medium text-gray-800">Page Access Token</p>
                  <p>Click "Generate Token" → copy the long string that appears</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium hover:bg-gray-200">← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white font-semibold text-sm hover:shadow-lg transition-all">
                I have all 3 — Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Paste and Connect */}
        {step === 3 && (
          <div className="warm-card p-6 fade-in">
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-2xl mb-3">✅</div>
              <h2 className="text-lg font-bold text-gray-800">Step 3: Paste & Connect</h2>
              <p className="text-sm text-gray-500 mt-1">Almost done! Paste your page info below.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">📄 Page Name</label>
                <input type="text" value={pageName} onChange={(e) => setPageName(e.target.value)} placeholder="e.g. JS Money Vlog" className="w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">🔢 Page ID</label>
                <input type="text" value={pageId} onChange={(e) => setPageId(e.target.value)} placeholder="e.g. 362708643591426" className="w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">🔑 Access Token</label>
                <textarea value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="Paste the long token here..." rows={3} className="w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-y" />
              </div>
            </div>

            {message && <p className={`mt-3 text-sm text-center ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}

            <div className="flex gap-2 mt-5">
              <button onClick={() => setStep(2)} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium hover:bg-gray-200">← Back</button>
              <button onClick={handleConnect} disabled={loading} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                {loading ? 'Connecting...' : '🔗 Connect My Page'}
              </button>
            </div>
          </div>
        )}

        {/* Help text */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Need help? The blue "Connect" button on the dashboard works for most pages.<br/>
          This guide is for pages that don't appear automatically.
        </p>
      </main>
    </div>
  );
}
