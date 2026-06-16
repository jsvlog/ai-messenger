'use client';

// ============================================================
// SchedulingConfig — Days + hours for AI auto-reply
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  pageId: string;
}

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

export function SchedulingConfig({ pageId }: Props) {
  const [scheduleActive, setScheduleActive] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [offHoursMsg, setOffHoursMsg] = useState(
    'Hi po! Pasensya na, office hours namin ay 8AM-6PM. Babalikan ko po kayo agad bukas! 😊'
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from('page_settings')
      .select('*')
      .eq('page_id', pageId)
      .single();

    if (data) {
      setScheduleActive(data.schedule_active || false);
      setStartTime(data.schedule_start || '08:00');
      setEndTime(data.schedule_end || '18:00');
      setDays(data.schedule_days || [1, 2, 3, 4, 5]);
      setOffHoursMsg(
        data.auto_reply_off_hours ||
          'Hi po! Pasensya na, office hours namin ay 8AM-6PM. Babalikan ko po kayo agad bukas! 😊'
      );
    }
    setLoading(false);
  }, [supabase, pageId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('page_settings')
      .upsert(
        {
          page_id: pageId,
          schedule_active: scheduleActive,
          schedule_start: startTime,
          schedule_end: endTime,
          schedule_days: days,
          auto_reply_off_hours: offHoursMsg,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'page_id' }
      );

    if (error) {
      setMessage(`❌ Failed to save: ${error.message}`);
    } else {
      setMessage('✅ Schedule saved!');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-orange-100 rounded w-48" />
        <div className="h-20 bg-orange-50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Enable scheduling toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setScheduleActive(!scheduleActive)}
          className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
            scheduleActive
              ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] shadow-md shadow-orange-300/30'
              : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
              scheduleActive ? 'left-7' : 'left-1'
            }`}
          />
        </button>
        <div>
          <p className="font-medium text-gray-800">
            {scheduleActive ? '🕐 Scheduled Hours' : '24/7 Auto-Reply'}
          </p>
          <p className="text-xs text-gray-500">
            {scheduleActive
              ? 'AI responds only during business hours'
              : 'AI responds to all messages anytime'}
          </p>
        </div>
      </div>

      {scheduleActive && (
        <>
          {/* Day selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Active Days</p>
            <div className="flex gap-1.5">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`w-12 h-10 rounded-lg text-xs font-medium transition-all ${
                    days.includes(day.value)
                      ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white shadow-md shadow-orange-200/50'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="px-3 py-2 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              />
            </div>
            <span className="text-gray-400 mt-5">to</span>
            <div>
              <label className="text-xs text-gray-500 block mb-1">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="px-3 py-2 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              />
            </div>
          </div>

          {/* Off-hours auto-reply message */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Off-Hours Auto-Reply
            </label>
            <textarea
              value={offHoursMsg}
              onChange={(e) => setOffHoursMsg(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition-all resize-y"
            />
          </div>
        </>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white font-medium text-sm hover:shadow-lg hover:shadow-orange-300/40 transition-all duration-200 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Schedule'}
      </button>

      {message && (
        <p className={`text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
