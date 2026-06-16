'use client';

// ============================================================
// AIToggle — ON/OFF switch for AI auto-reply with cooldown info
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  pageId: string;
}

export function AIToggle({ pageId }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [pausedUntil, setPausedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  // Load current settings
  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from('page_settings')
      .select('*')
      .eq('page_id', pageId)
      .single();

    if (data) {
      setEnabled(data.ai_enabled);
      setPausedUntil(data.ai_paused_until);
    }
    setLoading(false);
  }, [supabase, pageId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Toggle AI
  const handleToggle = async () => {
    const newState = !enabled;
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('page_settings')
      .upsert(
        {
          page_id: pageId,
          ai_enabled: newState,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'page_id' }
      );

    if (error) {
      setMessage(`❌ Failed to update: ${error.message}`);
    } else {
      setEnabled(newState);
      setMessage(
        newState
          ? '✅ AI auto-reply is now ON — your page will respond automatically'
          : '🔕 AI auto-reply is now OFF — messages will come to you directly'
      );
    }

    setSaving(false);
  };

  // Clear cooldown
  const handleClearCooldown = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('page_settings')
      .upsert(
        {
          page_id: pageId,
          ai_paused_until: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'page_id' }
      );

    if (!error) {
      setPausedUntil(null);
      setMessage('✅ Cooldown cleared — AI will respond immediately');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-8 bg-orange-100 rounded-lg w-32" />
        <div className="h-4 bg-orange-50 rounded w-64" />
      </div>
    );
  }

  const isCooldownActive = pausedUntil && new Date(pausedUntil) > new Date();
  const cooldownRemaining = isCooldownActive
    ? Math.ceil((new Date(pausedUntil!).getTime() - Date.now()) / 60000)
    : 0;

  return (
    <div className="space-y-4">
      {/* Toggle Switch */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
            enabled
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-md shadow-green-300/30'
              : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
              enabled ? 'left-7' : 'left-1'
            }`}
          />
        </button>
        <div>
          <p className="font-medium text-gray-800">
            {enabled ? '🟢 AI is Active' : '🔴 AI is Off'}
          </p>
          <p className="text-xs text-gray-500">
            {enabled
              ? 'Your page will auto-reply to customer messages'
              : 'Messages will not receive auto-replies'}
          </p>
        </div>
      </div>

      {/* Cooldown Status */}
      {isCooldownActive && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">
                ⏸️ AI Paused — Admin Handover Mode
              </p>
              <p className="text-xs text-amber-600">
                A page admin sent a message. AI will resume in ~{cooldownRemaining} minute
                {cooldownRemaining !== 1 ? 's' : ''}.
              </p>
            </div>
            <button
              onClick={handleClearCooldown}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-200 text-amber-800 hover:bg-amber-300 transition-colors whitespace-nowrap"
            >
              Resume Now
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.startsWith('✅') ? 'text-green-600' : message.startsWith('🔕') ? 'text-gray-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
