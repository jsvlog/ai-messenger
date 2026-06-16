'use client';

// ============================================================
// FacebookConnect — Login with Facebook + Page selector
// ============================================================

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  userId: string;
  existingPages: {
    id: string;
    page_id: string;
    page_name: string;
    page_category: string | null;
    is_active: boolean;
    created_at: string;
  }[];
}

export function FacebookConnect({ userId, existingPages }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDisconnect, setShowDisconnect] = useState<string | null>(null);

  // Step 1: Initiate Facebook Login dialog
  const handleConnect = () => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    if (!appId) {
      setMessage('❌ Meta App ID not configured. Add NEXT_PUBLIC_META_APP_ID to .env.local');
      return;
    }

    const redirectUri = `${window.location.origin}/api/auth/facebook/callback`;
    const scope = 'pages_messaging,pages_show_list,pages_read_engagement';
    const url =
      `https://www.facebook.com/v19.0/dialog/oauth` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${userId}` +
      `&response_type=code`;

    window.location.href = url;
  };

  // Disconnect a page
  const handleDisconnect = async (pageId: string) => {
    setLoading(true);
    setMessage('');

    const supabase = createClient();

    const { error } = await supabase
      .from('connected_pages')
      .delete()
      .eq('id', pageId);

    if (error) {
      setMessage(`❌ Failed to disconnect: ${error.message}`);
    } else {
      setMessage('✅ Page disconnected successfully');
      setTimeout(() => window.location.reload(), 1500);
    }

    setLoading(false);
    setShowDisconnect(null);
  };

  return (
    <div>
      {/* Existing pages */}
      {existingPages.length > 0 && (
        <div className="space-y-3 mb-6">
          {existingPages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {page.page_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{page.page_name}</p>
                  <p className="text-xs text-gray-500">
                    {page.page_category || 'Business Page'} · Connected{' '}
                    {new Date(page.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    page.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {page.is_active ? 'Active' : 'Paused'}
                </span>
                {showDisconnect === page.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDisconnect(page.id)}
                      disabled={loading}
                      className="text-xs px-2 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowDisconnect(null)}
                      className="text-xs px-2 py-1 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDisconnect(page.id)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect new page button */}
      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#166fe5] text-white font-semibold hover:shadow-lg hover:shadow-blue-300/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {existingPages.length > 0
              ? 'Connect Another Page'
              : 'Connect Your Facebook Page'}
          </>
        )}
      </button>

      {message && (
        <p className={`mt-3 text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
