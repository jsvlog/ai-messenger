'use client';

// ============================================================
// ManualPageConnect — Paste page ID + token from Meta dashboard
// Used as primary method since FB /me/accounts is deprecated for new apps
// ============================================================

import { useState } from 'react';

interface Props {
  userId: string;
  onSuccess: () => void;
}

export function ManualPageConnect({ userId, onSuccess }: Props) {
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleConnect = async () => {
    if (!pageId || !pageName || !accessToken) {
      setMessage('❌ Please fill in all fields.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Dynamically import Supabase client to avoid SSR crashes
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase.from('connected_pages').upsert({
        user_id: userId,
        page_id: pageId,
        page_name: pageName,
        page_access_token: accessToken,
        page_category: 'Business',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,page_id' });

      if (error) {
        setMessage(`❌ Failed: ${error.message}`);
      } else {
        setMessage('✅ Page connected! Refreshing...');
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (e: any) {
      setMessage(`❌ Error: ${e?.message || 'Unknown error'}`);
    }

    setLoading(false);
  };

  return (
    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
      <p className="text-sm font-medium text-amber-800">
        🔧 Connect Your Page
      </p>
      <p className="text-xs text-amber-600">
        Go to{' '}
        <a
          href="https://developers.facebook.com/apps/2093101957935499/messenger"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          Meta Dashboard → Messenger
        </a>
        {' '}→ under "Generate access tokens", select your page, then copy the Page ID, name, and token below.
      </p>

      <input
        type="text"
        value={pageName}
        onChange={(e) => setPageName(e.target.value)}
        placeholder="Page Name (e.g. EJS Prints & Crafts Co.)"
        className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
      />

      <input
        type="text"
        value={pageId}
        onChange={(e) => setPageId(e.target.value)}
        placeholder="Page ID (e.g. 362708643591426)"
        className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
      />

      <textarea
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
        placeholder="Page Access Token (long string from Meta)"
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-y"
      />

      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Connecting...' : 'Connect Page'}
      </button>

      {message && (
        <p className={`text-xs ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
