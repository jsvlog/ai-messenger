import Link from 'next/link';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <LandingNav />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-sm text-orange-700 font-medium mb-6">
            🍽️ Built specifically for Filipino caterers
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
            Never miss a{' '}
            <span className="bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] bg-clip-text text-transparent">catering inquiry</span>
            {' '}again
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            While you're in the kitchen, CaterAI replies to every Facebook Messenger inquiry in warm Taglish —
            captures the date, pax, venue, and budget — and books the event for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="gradient-btn px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
              Start Free — No Credit Card 🚀
            </Link>
            <Link href="#how" className="px-8 py-4 rounded-xl bg-white border border-orange-200 text-gray-700 font-semibold text-lg hover:bg-orange-50 transition-all">
              See How It Works ↓
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">Free forever for 20 messages/day · Setup in 3 minutes</p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 px-4 bg-white/50">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">Sound familiar?</h2>
          <p className="text-center text-gray-500 mb-10">Every Filipino caterer knows this struggle:</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '😤', text: '"Sir dami ko natatanggap na messages, di na makasagot"' },
              { icon: '💔', text: 'Customer messaged at 10am. You replied at 8pm. They booked someone else.' },
              { icon: '📋', text: 'Same questions every day: "Magkano? Available sa [date]? Ilan pax minimum?"' },
              { icon: '😴', text: '3am inquiries from balikbayans in different time zones' },
              { icon: '🤦', text: 'You forgot to ask the date. Now you\'re chasing them for info.' },
              { icon: '💸', text: 'One missed booking = ₱20,000-200,000 lost forever' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">Meet CaterAI</h2>
          <p className="text-center text-gray-500 mb-10">Your AI assistant that never sleeps, never forgets, and always asks the right questions</p>

          {/* Demo conversation */}
          <div className="warm-card p-6 mb-10 max-w-2xl mx-auto">
            <p className="text-xs text-gray-400 mb-4 text-center">👇 Real example of how CaterAI handles an inquiry</p>
            <div className="space-y-3">
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-white border border-orange-100 text-sm text-gray-800 shadow-sm">
                  Hi po! Pa-quote naman for 150 pax, December 15, sa Pasig. Wedding po.
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white text-sm shadow-sm">
                  Hi po! Congratulations on your wedding! 🎉 Yes, available kami sa December 15! For 150 pax, our Premium Wedding Package is ₱450/head = ₱67,500. Includes 6 viands, rice, dessert, drinks, centerpiece, and full service with waiters. May I know your venue po sa Pasig? And do you have a budget in mind?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-white border border-orange-100 text-sm text-gray-800 shadow-sm">
                  Sa Crown Regency Pasig. Budget is around 70k.
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white text-sm shadow-sm">
                  Perfect po! Within budget yung Premium Package. Crown Regency is one of our partner venues din! 😊 Can I get your name and contact number po para ma-send ko yung full quotation and menu? Also, may preferred Filipino or international dishes kayo?
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-100">
              <p className="text-xs text-green-700 font-medium">✅ Lead captured: Maria Santos · 0917 123 4567 · Wedding · Dec 15 · 150 pax · Crown Regency Pasig · ₱70k budget</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white/50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-10">Everything a caterer needs</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🤖', title: 'Taglish AI Replies', desc: 'Replies in natural Filipino-English. Knows catering terms — pax, viands, set-up, full service.' },
              { icon: '📅', title: 'Captures Event Details', desc: 'Automatically asks for date, pax, venue, budget, food preference. No more forgotten details.' },
              { icon: '📋', title: 'Menu & Package Builder', desc: 'Add your packages, prices, and menus in a simple form. AI knows exactly what to offer.' },
              { icon: '🔔', title: 'Lead Notifications', desc: 'Get notified when a hot lead is captured — name, phone, event details, ready to call.' },
              { icon: '🕐', title: 'Business Hours', desc: 'AI works 24/7 or set specific hours. Balikbayans can inquire at 3am and still get a reply.' },
              { icon: '🔒', title: 'Admin Takeover', desc: 'Reply manually and AI steps aside for 30 minutes. Seamless handover.' },
              { icon: '📊', title: 'Event Pipeline', desc: 'See all inquiries in one dashboard. Filter by date, status, budget. Export to CSV.' },
              { icon: '💬', title: 'Conversation History', desc: 'Full chat thread per customer. AI remembers previous conversations.' },
              { icon: '💰', title: 'Affordable', desc: 'Free for 20 msgs/day. ₱499/mo for unlimited. Less than one missed booking.' },
            ].map((f, i) => (
              <div key={i} className="warm-card p-5">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-16 px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-10">Set up in 3 minutes</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Connect your Facebook Page', desc: 'One click. Pick the page where customers message you. Works with any catering Facebook page.' },
              { step: '2', title: 'Add your packages & menu', desc: 'Fill in a simple form — your packages, prices, minimum pax, inclusions. No technical stuff.' },
              { step: '3', title: 'Turn it on & relax', desc: 'CaterAI starts replying immediately. Check your dashboard for captured leads and event details.' },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white font-bold flex items-center justify-center flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{s.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/login" className="gradient-btn px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
              Start Free Now →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-2xl text-center warm-card p-10">
          <h2 className="text-3xl font-bold mb-4">Ready to never miss a booking?</h2>
          <p className="text-gray-500 mb-6">Join Filipino caterers who let AI handle the messages while they handle the food.</p>
          <Link href="/login" className="gradient-btn px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
            Get Started Free 🚀
          </Link>
          <p className="text-sm text-gray-400 mt-3">No credit card · Free forever plan · Cancel anytime</p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
