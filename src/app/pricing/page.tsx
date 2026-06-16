'use client';

// ============================================================
// Pricing Page — 3-tier + Annual plans
// Free: 20 msgs/day | Starter: ₱499/mo | Pro: ₱999/mo | Annual: ₱7,999/yr
// ============================================================

import { useState } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import Link from 'next/link';

type BillingPeriod = 'monthly' | 'annually';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: '₱0',
    priceAnnually: '₱0',
    period: 'forever',
    desc: 'Try it out on one page',
    cta: 'Start Free',
    popular: false,
    features: [
      '1 Facebook Page',
      '20 messages/day',
      'Basic AI auto-reply',
      'Taglish responses',
      'Basic lead capture',
      'Standard support',
    ],
    missing: [
      'Multiple pages',
      'Knowledge base',
      'Lead export',
      'Business hours scheduling',
      'Priority support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: '₱499',
    priceAnnually: null,
    periodMonthly: '/month',
    originalMonthly: '₱749',
    desc: 'Best for growing businesses',
    cta: 'Start Monthly',
    popular: true,
    features: [
      'Up to 3 Facebook Pages',
      'Unlimited messages',
      'AI auto-reply 24/7',
      'Natural Taglish',
      'Full lead capture',
      'Lead export (CSV)',
      'Custom knowledge base',
      'Business hours scheduling',
      'Email support',
    ],
    missing: [],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: '₱999',
    priceAnnually: '₱7,999',
    periodMonthly: '/month',
    periodAnnually: '/year',
    originalMonthly: '₱1,499',
    desc: 'For serious business owners',
    cta: 'Start Monthly',
    popular: false,
    features: [
      'Unlimited Facebook Pages',
      'Unlimited messages',
      'AI auto-reply 24/7',
      'Natural Taglish',
      'Advanced lead capture',
      'Lead export (CSV + JSON)',
      'Custom knowledge base',
      'Business hours scheduling',
      'Priority support (Viber)',
      'Early access to new features',
    ],
    missing: [],
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = (planId: string, isAnnual: boolean) => {
    if (planId === 'free') {
      window.location.href = '/login';
      return;
    }
    setLoading(planId + (isAnnual ? '-annual' : '-monthly'));
    const checkoutPlan = isAnnual ? `${planId}-annual` : planId;
    window.location.href = `/api/checkout?plan=${checkoutPlan}`;
  };

  const formatPrice = (plan: typeof PLANS[number]) => {
    if (billing === 'annually' && plan.priceAnnually) {
      return plan.priceAnnually;
    }
    return plan.priceMonthly;
  };

  const formatPeriod = (plan: typeof PLANS[number]) => {
    if (billing === 'annually' && plan.periodAnnually) {
      return plan.periodAnnually;
    }
    if (plan.id === 'free') return plan.period;
    return plan.periodMonthly || '/month';
  };

  const monthlyEquivalent = (plan: typeof PLANS[number]) => {
    if (billing === 'annually' && plan.priceAnnually && plan.priceAnnually !== '₱0') {
      const annual = parseInt(plan.priceAnnually.replace(/[₱,]/g, ''));
      const monthly = Math.round(annual / 12);
      return `₱${monthly.toLocaleString()}/mo`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
      <LandingNav />

      {/* Header */}
      <section className="pt-20 pb-10 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4 mx-auto text-center">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto text-center">
          Start free. Upgrade when you're ready. Cancel anytime.
          No hidden fees. No lock-in contracts.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 mt-8 bg-white/80 border border-orange-200 rounded-full p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              billing === 'monthly'
                ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annually')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              billing === 'annually'
                ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Annually
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
              Save 33%
            </span>
          </button>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-14 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => {
            const price = formatPrice(plan);
            const period = formatPeriod(plan);
            const monthlyEq = monthlyEquivalent(plan);
            const isAnnual = billing === 'annually' && !!plan.priceAnnually && plan.id !== 'free';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 transition-all duration-300 ${
                  plan.popular
                    ? 'bg-white border-2 border-[#ffa94d] shadow-xl shadow-orange-200/50 scale-[1.03] z-10'
                    : 'bg-white/80 border border-orange-100 shadow-md hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white text-xs font-bold shadow-md">
                    MOST POPULAR
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-lg font-semibold text-gray-800">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-gray-800">{price}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{period}</p>
                  {monthlyEq && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      {monthlyEq} equivalent — save 33%
                    </p>
                  )}
                  {plan.originalMonthly && billing === 'monthly' && (
                    <p className="text-xs text-gray-400 line-through mt-1">
                      {plan.originalMonthly}/month regular
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">{plan.desc}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm opacity-50">
                      <span className="text-gray-300 mt-0.5 flex-shrink-0">✗</span>
                      <span className="text-gray-400">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleCheckout(plan.id, isAnnual)}
                    disabled={loading !== null}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 ${
                      plan.popular
                        ? 'gradient-btn shadow-lg shadow-orange-300/30'
                        : plan.id === 'free'
                          ? 'border-2 border-orange-200 text-orange-700 hover:bg-orange-50'
                          : 'border-2 border-orange-200 text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    {loading === plan.id + (isAnnual ? '-annual' : '-monthly')
                      ? 'Redirecting...'
                      : plan.cta}
                  </button>

                  {/* Annual upsell for Pro on monthly view */}
                  {plan.id === 'pro' && billing === 'monthly' && (
                    <button
                      onClick={() => { setBilling('annually'); }}
                      className="w-full py-2 rounded-xl text-xs text-green-600 font-medium hover:bg-green-50 transition-colors"
                    >
                      💡 Save ₱3,989 with annual billing
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Money-back */}
        <div className="text-center mt-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 text-sm text-green-700">
            🛡️ 7-day money-back guarantee on all paid plans
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 px-4 bg-white/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center mx-auto">
            Full Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Free</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Starter</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-orange-50">
                    <td className="py-3 px-4 text-gray-700">{row.feature}</td>
                    <td className="text-center py-3 px-4">{row.free}</td>
                    <td className="text-center py-3 px-4">{row.starter}</td>
                    <td className="text-center py-3 px-4">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-10">
            <p className="text-sm text-gray-500 mb-4">Not sure which plan? Start free and upgrade anytime.</p>
            <Link href="/login" className="gradient-btn px-8 py-3 rounded-xl font-semibold inline-block">
              Start Free Trial →
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

const COMPARISON_ROWS = [
  { feature: 'Facebook Pages', free: '1', starter: 'Up to 3', pro: 'Unlimited' },
  { feature: 'Messages / Day', free: '20', starter: 'Unlimited', pro: 'Unlimited' },
  { feature: 'AI Auto-Reply', free: '✓', starter: '✓', pro: '✓' },
  { feature: 'Taglish Support', free: '✓', starter: '✓', pro: '✓' },
  { feature: 'Lead Capture', free: 'Basic', starter: 'Full', pro: 'Advanced' },
  { feature: 'Knowledge Base', free: '✗', starter: '✓', pro: '✓' },
  { feature: 'Business Hours Scheduling', free: '✗', starter: '✓', pro: '✓' },
  { feature: 'Lead Export (CSV)', free: '✗', starter: '✓', pro: '✓' },
  { feature: 'Lead Export (JSON)', free: '✗', starter: '✗', pro: '✓' },
  { feature: 'Support', free: 'Standard', starter: 'Email', pro: 'Priority + Viber' },
  { feature: 'Early Access Features', free: '✗', starter: '✗', pro: '✓' },
  { feature: 'Price (Monthly)', free: '₱0', starter: '₱499', pro: '₱999' },
  { feature: 'Annual Price', free: '₱0', starter: '—', pro: '₱7,999/yr (₱667/mo)' },
];
