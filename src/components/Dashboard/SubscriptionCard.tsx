'use client';

import { useState } from 'react';

interface Props {
  currentPlan: string;
  subscription: {
    id: string; user_id: string; lemon_squeezy_id: string; variant_id: string;
    plan: string; status: string; expires_at: string; started_at: string;
    created_at: string; updated_at: string;
  } | null;
  dailyMsgCount?: number;
}

const PLANS = [
  { id: 'starter', name: 'Starter', price: '₱499', period: '/month', popular: true, features: ['3 pages', 'Unlimited msgs', 'Knowledge base', 'Lead export', 'Email support'] },
  { id: 'pro', name: 'Pro', price: '₱999', period: '/month', savings: 'Or ₱7,999/year (save 33%)', popular: false, features: ['Unlimited pages', 'Unlimited msgs', 'Knowledge base', 'Lead export + JSON', 'Priority Viber', 'Early features'] },
];

export function SubscriptionCard({ currentPlan, subscription, dailyMsgCount = 0 }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = (planId: string) => { setLoading(planId); window.location.href = `/api/checkout?plan=${planId}`; };

  const isActive = subscription && subscription.status === 'active';
  const daysLeft = isActive ? Math.max(0, Math.ceil((new Date(subscription!.expires_at).getTime() - Date.now()) / 86400000)) : 0;
  const freeLimit = 20;
  const countDisplay = isActive ? '∞' : `${dailyMsgCount}/${freeLimit}`;
  const pct = isActive ? 100 : Math.min(100, (dailyMsgCount / freeLimit) * 100);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
        <p className="text-sm text-gray-600">Current Plan</p>
        <p className="text-xl font-bold bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] bg-clip-text text-transparent">
          {isActive ? subscription!.plan.charAt(0).toUpperCase() + subscription!.plan.slice(1) : 'Free'}
        </p>
        {isActive ? (
          <p className="text-xs text-green-600 mt-1">✅ Active — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</p>
        ) : (
          <div>
            <p className="text-xs text-gray-500 mt-1">1 page · {freeLimit} msgs/day · Basic replies</p>
            <div className="mt-2 bg-white/60 rounded-lg p-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Messages today</span><span>{countDisplay}</span></div>
              <div className="h-1.5 bg-orange-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {!isActive && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Upgrade Plan</p>
          {PLANS.map((plan) => (
            <div key={plan.id} className={`relative p-3 rounded-xl border transition-all ${plan.popular ? 'border-[#ffa94d] bg-gradient-to-r from-orange-50 to-amber-50 shadow-md' : 'border-orange-100 bg-white hover:shadow-md'}`}>
              {plan.popular && <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white text-[10px] font-bold">BEST VALUE</div>}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{plan.name}</p>
                  <div className="flex items-baseline gap-1"><span className="text-lg font-bold text-gray-800">{plan.price}</span><span className="text-xs text-gray-400">{plan.period}</span></div>
                  {plan.savings && <p className="text-[10px] text-green-600 mt-0.5">{plan.savings}</p>}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {plan.features.slice(0, 3).map((f) => <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">{f}</span>)}
                    {plan.features.length > 3 && <span className="text-[10px] text-gray-400">+{plan.features.length - 3} more</span>}
                  </div>
                </div>
                <button onClick={() => handleUpgrade(plan.id)} disabled={loading !== null} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${plan.popular ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white hover:shadow-md' : 'border border-orange-200 text-gray-600 hover:bg-orange-50'}`}>
                  {loading === plan.id ? '...' : 'Upgrade'}
                </button>
              </div>
            </div>
          ))}
          <a href="/pricing" className="block text-center text-xs text-gray-400 hover:text-[#ff6b6b] py-1">View full feature comparison →</a>
        </div>
      )}

      {isActive && subscription!.plan === 'starter' && (
        <div className="pt-2 border-t border-orange-100">
          <p className="text-xs text-gray-500 mb-2">Upgrade to Pro:</p>
          <button onClick={() => handleUpgrade('pro')} disabled={loading !== null} className="w-full text-left p-3 rounded-xl border border-orange-100 hover:bg-orange-50 transition-all">
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-800">⬆️ Pro Plan</p><p className="text-xs text-gray-500">₱999/month — unlimited pages, priority support</p></div><span className="text-xs text-[#ff6b6b] font-medium">Upgrade →</span></div>
          </button>
        </div>
      )}

      {isActive && subscription!.plan === 'pro' && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-100">
          <p className="text-xs text-green-700">💡 You're on monthly Pro. Save 33% with annual — ₱7,999/year (₱667/mo).</p>
          <button onClick={() => handleUpgrade('pro-annual')} disabled={loading !== null} className="mt-2 w-full text-xs py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium">Switch to Annual →</button>
        </div>
      )}
    </div>
  );
}
