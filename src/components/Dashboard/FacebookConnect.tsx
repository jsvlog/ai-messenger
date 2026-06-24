'use client';

// ============================================================
// FacebookConnect — Server-side OAuth (worked for 5/9 pages)
// + helpful fallback for pages that don't appear
// ============================================================

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Props {
  userId: string;
  existingPages: { id: string; page_id: string; page_name: string }[];
  targetUserId?: string; // When admin connects on behalf of a client
  targetUserName?: string; // Client name for display
  compact?: boolean; // Smaller layout for modal use
}

export function FacebookConnect({ userId, existingPages, targetUserId, targetUserName, compact }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  const handleConnect = () => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    if (!appId) { setMessage('❌ Meta App ID not configured'); return; }
    const redirectUri = 'https://ai-messenger-pi.vercel.app/api/auth/facebook/callback';
    const scope = 'pages_messaging,pages_show_list';
    // state = target user_id (the client whose page we're connecting)
    const stateUserId = targetUserId || userId;
    const url = `https://www.facebook.com/v25.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${stateUserId}&response_type=code`;
    window.location.href = url;
  };

  const handleDisconnect = async (pageId: string) => {
    setLoading(true);
    const deleteUserId = targetUserId || userId;
    const { error } = await supabase.from('connected_pages').delete().eq('page_id', pageId).eq('user_id', deleteUserId);
    if (!error) window.location.reload();
    else setMessage(`❌ ${error.message}`);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="relative z-10 space-y-3">
          <h3 className="text-lg font-bold">Connect Your Facebook Pages</h3>
          <p className="text-blue-100 text-sm">One click. All your pages. Instant setup.</p>
          <button onClick={handleConnect} disabled={loading} className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl flex items-center gap-2 mx-auto hover:bg-blue-50 transition-all disabled:opacity-50 shadow-lg">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            {loading ? 'Connecting...' : 'Connect Your Facebook Pages'}
          </button>
        </div>
      </div>

      {/* Helpful note */}
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
        <p className="font-medium">💡 Can't see all your pages?</p>
        <p className="mt-1">Some pages may not appear due to Facebook's development restrictions. If your page doesn't show up, <Link href="/dashboard/connect" className="underline font-medium text-amber-800">connect it manually here →</Link></p>
      </div>

      {message && <div className={`p-3 rounded-xl text-sm text-center ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>}

      {existingPages.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Connected Pages</p>
          {existingPages.map((page) => (
            <div key={page.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-orange-100">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{page.page_name}</p>
                <p className="text-[10px] text-gray-400">ID: {page.page_id?.slice(0, 12)}...</p>
              </div>
              <button onClick={() => handleDisconnect(page.page_id)} className="text-[10px] text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">Disconnect</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
