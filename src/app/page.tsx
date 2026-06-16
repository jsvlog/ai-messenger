export const dynamic = 'force-static';

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Messenger — Smart Facebook Auto-Replies for Rentals & Catering',
  description:
    'Never miss a customer inquiry. Auto-reply in Taglish, capture leads 24/7. Built for Filipino Rentals & Catering businesses. Start free.',
};
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
      <LandingNav />

      {/* ============ HERO ============ */}
      <section className="w-full pt-20 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-orange-200 text-sm text-orange-700 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Now serving 500+ businesses in the Philippines
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-center mx-auto">
            Your Facebook Page,
            <br />
            <span className="gradient-text">Auto-Replying 24/7</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto text-center mb-8 leading-relaxed">
            Never miss a customer inquiry again. Our AI responds to messages in warm, natural
            <strong className="text-orange-600"> Taglish</strong> —
            capturing names, phone numbers, event dates, and budgets while you sleep.
            Built for <strong className="text-orange-600">Rentals & Catering</strong> businesses.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="gradient-btn px-8 py-4 rounded-xl text-lg font-bold inline-flex items-center gap-2"
            >
              Start Free Trial 🚀
              <span className="text-sm font-normal opacity-80">No credit card</span>
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-xl border-2 border-orange-200 text-orange-700 font-semibold text-lg hover:bg-orange-50 transition-colors"
            >
              See How It Works ↓
            </a>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-10 pt-6 border-t border-orange-100">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['👩', '👨', '👩‍💼', '👨‍💼'].map((emoji, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-white flex items-center justify-center text-xs shadow-sm">
                    {emoji}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-500">Trusted by 500+ businesses</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-500 text-sm">
              {'★★★★★'}
              <span className="text-gray-500 ml-1">4.9 rating</span>
            </div>
            <span className="text-sm text-gray-400">🇵🇭 Made for Pinoy businesses</span>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="w-full py-16" id="features">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center mx-auto">
              Everything Your Page Needs
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-center">
              Stop losing leads to slow replies. Our AI handles conversations end-to-end.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="warm-card p-6 hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="w-full py-16 bg-white/40" id="how-it-works">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center mx-auto">
              Set Up in 3 Minutes
            </h2>
            <p className="text-gray-500 mx-auto text-center">
              No coding. No complicated setup. Just connect and go.
            </p>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="flex gap-5 items-start p-6 rounded-2xl bg-white/80 border border-orange-100 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b6b] to-[#ffa94d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md shadow-orange-300/30">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center mx-auto">
              Loved by Business Owners
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="warm-card p-6">
                <div className="flex gap-1 text-yellow-400 mb-3">{'★'.repeat(t.stars)}</div>
                <p className="text-sm text-gray-600 italic leading-relaxed mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#ffa94d] flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING CTA ============ */}
      <section className="w-full py-16 bg-gradient-to-r from-[#ff6b6b]/5 via-[#ffa94d]/5 to-[#ff6b6b]/5">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center mx-auto">
            Start Free, Upgrade When Ready
          </h2>
          <p className="text-gray-500 mb-8 mx-auto text-center max-w-lg">
            Free plan includes 1 page and 20 AI replies per day. Upgrade for unlimited pages, lead exports, and priority support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="gradient-btn px-8 py-4 rounded-xl text-lg font-bold"
            >
              Start Free → No Card Needed
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-xl border-2 border-orange-200 text-orange-700 font-semibold text-lg hover:bg-orange-50 transition-colors"
            >
              View Plans & Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-10 text-center mx-auto">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.q} className="warm-card p-5 group cursor-pointer">
                <summary className="font-medium text-gray-800 group-open:text-[#ff6b6b] transition-colors list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-orange-400 group-open:rotate-45 transition-transform text-lg flex-shrink-0 ml-2">+</span>
                </summary>
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="w-full py-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 rounded-3xl bg-white/80 backdrop-blur-sm border border-orange-100 shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center mx-auto">
              Ready to Never Miss a Lead Again?
            </h2>
            <p className="text-gray-500 mb-8 mx-auto text-center">
              Join 500+ Pinoy businesses already using AI Messenger to auto-reply, capture leads, and close more bookings.
            </p>
            <Link
              href="/login"
              className="gradient-btn px-10 py-4 rounded-xl text-lg font-bold inline-block"
            >
              Get Started Free 🚀
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

// ============ DATA ============

const FEATURES = [
  { icon: '🤖', title: 'AI Auto-Reply 24/7', desc: 'Never miss a message — even at 3AM. Our AI responds instantly in warm, natural Taglish that feels like a real person.' },
  { icon: '📋', title: 'Smart Lead Capture', desc: 'Automatically collects names, phone numbers, event dates, and budgets from conversations. No forms needed.' },
  { icon: '📚', title: 'Custom Knowledge Base', desc: 'Upload your pricing, menu, FAQs, and availability. The AI uses it to answer customer questions accurately.' },
  { icon: '🕐', title: 'Business Hours Scheduling', desc: 'Set your operating hours. Outside those times, the AI sends a friendly away message and follows up later.' },
  { icon: '📊', title: 'Lead Dashboard', desc: 'View all captured leads in one place. Export to CSV. See which conversations turned into hot prospects.' },
  { icon: '🔒', title: 'Admin Handover Mode', desc: 'When you reply to a customer manually, the AI automatically pauses for 30 minutes so you can take over.' },
];

const STEPS = [
  { title: 'Connect Your Facebook Page', desc: 'Click "Login with Facebook" and grant permission. We securely connect your page in seconds — no code required.' },
  { title: 'Add Your Business Info', desc: 'Paste your pricing, menu, FAQs, and policies in our simple markdown editor. The AI learns everything about your business instantly.' },
  { title: 'Turn It On & Relax', desc: 'Flip the switch. Your AI starts auto-replying to every customer message — capturing leads, answering questions, and booking inquiries.' },
];

const TESTIMONIALS = [
  { name: 'Maria Santos', role: 'Owner, M&J Catering Services', stars: 5, quote: 'Dati ang dami naming na-miss na inquiries kasi tulog na kami. Ngayon, yung AI na ang sumasagot! Naka-book kami ng 3 events habang nasa bakasyon kami. Sobrang laking tulong!' },
  { name: 'Jun Reyes', role: 'Owner, Party Needs Rentals', stars: 5, quote: 'Napaka-natural ng replies — akala ng mga customer tao talaga kausap nila. Yung lead capture feature, dun kami nakakuha ng maraming bookings. Worth every peso.' },
  { name: 'Liza Cruz', role: 'Manager, L&L Events Place', stars: 5, quote: 'Ang dali i-setup! In 10 minutes, nagre-reply na yung AI sa mga inquiries namin. The Taglish is so natural — minsan nga mas magaling pa sakin mag-Tagalog!' },
];

const FAQS = [
  { q: 'Pwede ba ito sa kahit anong Facebook Page?', a: 'Yes! Kahit anong Facebook business page — rentals, catering, events, retail, services. Basta may Messenger ang page mo, gagana ang AI Messenger.' },
  { q: 'Kailangan ba ng technical skills para i-setup?', a: 'Hindi po! Connect mo lang ang Facebook page mo, paste your business info, and turn it on. Wala pong coding na kailangan.' },
  { q: 'Paano kung may tanong ang customer na hindi kayang sagutin ng AI?', a: 'The AI will politely tell the customer na iche-check sa team and will note the question. You can review unanswered questions sa dashboard and follow up manually.' },
  { q: 'May free trial ba?', a: 'Yes! Our free plan includes 1 Facebook page and 20 AI replies per day. No credit card needed. Upgrade anytime for unlimited messages.' },
  { q: 'Secure ba ang data namin?', a: 'Absolutely. All data is encrypted, stored in Supabase with Row Level Security, and we never share your customer data with anyone.' },
  { q: 'Pwede ba mag-Tagalog lang? Or English?', a: 'The AI speaks natural Taglish — a mix of Tagalog and English that feels warm and authentic. It matches the customers language naturally.' },
];
