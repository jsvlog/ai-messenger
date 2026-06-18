'use client';

// ============================================================
// FacebookConnect — Uses FB JS SDK for page picker
// Advantage: browser-side API calls have full page access
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

interface Props {
  userId: string;
  existingPages: { id: string; page_id: string; page_name: string }[];
}

export function FacebookConnect({ userId, existingPages }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sdkReady, setSdkReady] = useState(false);
  const supabase = createClient();

  // Load Facebook JS SDK
  useEffect(() => {
    if (window.FB) { setSdkReady(true); return; }
    window.fbAsyncInit = () => { window.FB.init({ appId: process.env.NEXT_PUBLIC_META_APP_ID, cookie: true, xfbml: true, version: 'v25.0' }); setSdkReady(true); };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true; script.defer = true; script.crossOrigin = 'anonymous';
    script.onerror = () => setMessage('⚠️ Could not load Facebook SDK');
    document.body.appendChild(script);
  }, []);

  const handleConnect = useCallback(() => {
    if (!sdkReady || !window.FB) { setMessage('⚠️ Facebook SDK not ready. Refresh and try again.'); return; }
    setLoading(true);
    setMessage('');

    window.FB.login((response: any) => {
      if (response.status === 'connected') {
        fetchPages(response.authResponse.accessToken);
      } else {
        setMessage('❌ Facebook login was cancelled or failed.');
        setLoading(false);
      }
    }, { scope: 'pages_messaging,pages_show_list', return_scopes: true });
  }, [sdkReady]);

  const fetchPages = async (accessToken: string) => {
    setMessage('🔍 Finding your pages...');
    try {
      window.FB.api('/me/accounts', 'GET', { fields: 'id,name,access_token,category', limit: 100 }, async (fbRes: any) => {
        if (fbRes.error) {
          setMessage(`❌ Facebook error: ${fbRes.error.message}`);
          setLoading(false);
          return;
        }

        const pages = fbRes.data || [];
        if (pages.length === 0) {
          // Fallback: try alternate API
          window.FB.api('/me', 'GET', { fields: 'id' }, async (me: any) => {
            if (me?.id) {
              window.FB.api(`/${me.id}/accounts`, 'GET', { fields: 'id,name,access_token,category', limit: 100 }, async (altRes: any) => {
                savePages(altRes.data || []);
              });
            } else {
              setMessage('❌ No pages found. Make sure you manage at least one Facebook Page as admin.');
              setLoading(false);
            }
          });
        } else {
          savePages(pages);
        }
      });
    } catch (e: any) {
      setMessage(`❌ Error: ${e.message || 'Unknown'}`);
      setLoading(false);
    }
  };

  const savePages = async (pages: any[]) => {
    if (pages.length === 0) {
      setMessage('❌ No pages found. Are you an admin of any Facebook Page?');
      setLoading(false);
      return;
    }

    // Save all pages to Supabase
    const pageIds = new Set(existingPages.map((p) => p.page_id));
    let saved = 0;

    for (const page of pages) {
      if (pageIds.has(page.id)) continue; // already connected

      const { error } = await supabase.from('connected_pages').upsert({
        user_id: userId,
        page_id: page.id,
        page_name: page.name,
        page_access_token: page.access_token,
        page_category: page.category || 'Business',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,page_id' });

      if (!error) saved++;
    }

    if (saved > 0) {
      setMessage(`✅ Connected ${saved} page${saved > 1 ? 's' : ''}! Refreshing...`);
      setTimeout(() => window.location.reload(), 1500);
    } else if (pages.length > 0) {
      setMessage('ℹ️ All pages already connected.');
    } else {
      setMessage('❌ Could not save any pages.');
    }

    setLoading(false);
  };

  // Disconnect handler
  const handleDisconnect = async (pageId: string) => {
    setLoading(true);
    const { error } = await supabase.from('connected_pages').delete().eq('page_id', pageId).eq('user_id', userId);
    if (!error) window.location.reload();
    else setMessage(`❌ ${error.message}`);
    setLoading(false);
  };

  const existingPageIds = new Set(existingPages.map((p) => p.page_id));

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="relative z-10 space-y-3">
          <h3 className="text-lg font-bold">Connect Your Facebook Pages</h3>
          <p className="text-blue-100 text-sm">One click. All your pages. Instant setup.</p>
          <button
            onClick={handleConnect}
            disabled={loading || !sdkReady}
            className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl flex items-center gap-2 mx-auto hover:bg-blue-50 transition-all disabled:opacity-50 shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            {loading ? 'Connecting...' : 'Connect Your Facebook Pages'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm text-center ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : message.startsWith('❌') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
          {message}
        </div>
      )}

      {/* Existing pages list */}
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
