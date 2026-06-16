'use client';

// ============================================================
// PageSelector — Sidebar dropdown for multi-page tenants
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Page {
  id: string;
  page_id: string;
  page_name: string;
  page_category: string | null;
  is_active: boolean;
}

interface Props {
  userId: string;
  activePageId?: string;
}

export function PageSelector({ userId, activePageId }: Props) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadPages = useCallback(async () => {
    const { data } = await supabase
      .from('connected_pages')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    setPages(data || []);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-orange-100 rounded-xl w-full" />
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700">
          No pages connected yet. Connect one below to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pages.map((page) => {
        const isActive = page.id === activePageId;
        return (
          <Link
            key={page.id}
            href={`/dashboard?page=${page.id}`}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 shadow-sm'
                : 'hover:bg-orange-50/50 border border-transparent'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0 ${
                isActive
                  ? 'bg-gradient-to-br from-[#ff6b6b] to-[#ffa94d]'
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}
            >
              {page.page_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">
                {page.page_name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {page.page_category || 'Business Page'}
              </p>
            </div>
            {isActive && (
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            )}
          </Link>
        );
      })}

      {pages.length > 1 && (
        <p className="text-[10px] text-gray-400 text-center pt-1">
          {pages.length} page{pages.length !== 1 ? 's' : ''} connected
        </p>
      )}
    </div>
  );
}
