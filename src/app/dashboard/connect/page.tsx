'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ConnectPage() {
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleConnect = async () => {
    if (!pageId || !pageName || !accessToken) {
      setMessage('❌ All fields required.');
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
      setMessage('✅ Connected! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (e: any) {
      setMessage(`❌ ${e?.message || 'Failed'}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
      <header className="border-b border-orange-200/50 bg-white/70 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-[#ff6b6b]">← Dashboard</Link>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="warm-card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Connect Facebook Page</h2>
          <p className="text-xs text-gray-500 mb-5">
            Get your Page ID and Access Token from{' '}
            <a href="https://developers.facebook.com/apps/2093101957935499/messenger" target="_blank" rel="noopener noreferrer" className="text-[#ff6b6b] underline">Meta Dashboard → Messenger → Generate Access Tokens</a>
          </p>
          <div className="space-y-3">
            <input type="text" value={pageName} onChange={(e) => setPageName(e.target.value)} placeholder="Page Name" className="w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
            <input type="text" value={pageId} onChange={(e) => setPageId(e.target.value)} placeholder="Page ID (numbers)" className="w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
            <textarea value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="Page Access Token" rows={3} className="w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-y" />
            <button onClick={handleConnect} disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? 'Connecting...' : 'Connect Page'}
            </button>
          </div>
          {message && <p className={`mt-4 text-sm text-center ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}
        </div>
      </main>
    </div>
  );
}
