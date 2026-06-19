import Link from 'next/link';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { INDUSTRIES } from '@/lib/industries';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <LandingNav />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-sm text-orange-700 font-medium mb-6">
            🤖 AI that knows your business
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
            Never miss a{' '}
            <span className="bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] bg-clip-text text-transparent">customer inquiry</span>
            {' '}again
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            CaterAI auto-replies to your Facebook Messenger in warm Taglish — captures leads, answers questions,
            and books customers 24/7. Built for Filipino businesses of all kinds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="gradient-btn px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
              Start Free — No Credit Card 🚀
            </Link>
            <Link href="#industries" className="px-8 py-4 rounded-xl bg-white border border-orange-200 text-gray-700 font-semibold text-lg hover:bg-orange-50 transition-all">
              See If Your Business Fits ↓
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">Free forever for 20 messages/day · Setup in 3 minutes</p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 px-4 bg-white/50">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">Sound familiar?</h2>
          <p className="text-center text-gray-500 mb-10">Every Filipino business owner knows this struggle:</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '😤', text: '"Sir dami ko natatanggap na messages, di na makasagot"' },
              { icon: '💔', text: 'Customer messaged at 10am. You replied at 8pm. They went somewhere else.' },
              { icon: '📋', text: 'Same questions every day: "Magkano? Available ba? Pwede ba?"' },
              { icon: '😴', text: '3am inquiries from balikbayans in different time zones' },
              { icon: '🤦', text: 'You forgot to ask their number. Now you can\'t follow up.' },
              { icon: '💸', text: 'One missed customer = thousands of pesos lost forever' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-4">Built for your business</h2>
          <p className="text-center text-gray-500 mb-10">The AI adapts to your industry — asks the right questions, captures the right details</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INDUSTRIES.map((ind) => (
              <div key={ind.id} className="warm-card p-5 hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">{ind.icon}</div>
                <h3 className="font-bold text-gray-800 mb-1">{ind.label}</h3>
                <p className="text-xs text-gray-500 mb-3">{ind.tagline}</p>
                <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-100 space-y-2">
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase">Customer asks:</p>
                    <p className="text-xs text-gray-700 italic">"{ind.exampleCustomer}"</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase">AI replies:</p>
                    <p className="text-xs text-gray-700">{ind.exampleAI}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white/50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-10">Everything you need</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🤖', title: 'Taglish AI Replies', desc: 'Replies in natural Filipino-English. Knows your industry — catering terms, salon services, rental items.' },
              { icon: '📅', title: 'Captures Lead Details', desc: 'Automatically asks the right questions based on your business type. No more forgotten details.' },
              { icon: '📋', title: 'Smart KB Builder', desc: 'Fill in a simple form — packages, services, prices, policies. AI learns your business instantly.' },
              { icon: '🔔', title: 'Lead Notifications', desc: 'Get notified when a hot lead is captured — name, phone, event details, ready to call.' },
              { icon: '🕐', title: 'Business Hours', desc: 'AI works 24/7 or set specific hours. Balikbayans can inquire at 3am and still get a reply.' },
              { icon: '🔒', title: 'Admin Takeover', desc: 'Reply manually and AI steps aside for 30 minutes. Seamless handover.' },
              { icon: '📊', title: 'Analytics Dashboard', desc: 'See all inquiries, response rate, lead stats. Filter, search, export to CSV.' },
              { icon: '💬', title: 'Conversation History', desc: 'Full chat thread per customer. AI remembers previous conversations.' },
              { icon: '💰', title: 'Affordable', desc: 'Free for 20 msgs/day. ₱499/mo for unlimited. Less than one missed customer.' },
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
              { step: '1', title: 'Connect your Facebook Page', desc: 'One click. Pick the page where customers message you.' },
              { step: '2', title: 'Add your business info', desc: 'Fill in a simple form — pick your industry, add your products/services, prices, and policies. No technical stuff.' },
              { step: '3', title: 'Turn it on & relax', desc: 'CaterAI starts replying immediately. Check your dashboard for captured leads and customer details.' },
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
          <h2 className="text-3xl font-bold mb-4">Ready to never miss a customer?</h2>
          <p className="text-gray-500 mb-6">Join Filipino businesses who let AI handle the messages while they handle the business.</p>
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
