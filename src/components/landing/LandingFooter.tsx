import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-orange-100 bg-white/60 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b6b] to-[#ffa94d] flex items-center justify-center text-white font-bold text-xs shadow-sm">AI</div>
              <span className="font-bold text-gray-800">AI Messenger</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
            AI auto-reply for Filipino businesses. Never miss a customer inquiry.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-gray-800 text-sm mb-3">Product</h4>
            <div className="space-y-2">
              <a href="#features" className="block text-xs text-gray-500 hover:text-[#ff6b6b] transition-colors">Features</a>
              <Link href="/pricing" className="block text-xs text-gray-500 hover:text-[#ff6b6b] transition-colors">Pricing</Link>
              <a href="#how-it-works" className="block text-xs text-gray-500 hover:text-[#ff6b6b] transition-colors">How It Works</a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-gray-800 text-sm mb-3">Resources</h4>
            <div className="space-y-2">
              <Link href="/login" className="block text-xs text-gray-500 hover:text-[#ff6b6b] transition-colors">Dashboard</Link>
              <span className="block text-xs text-gray-400">Help Center (soon)</span>
              <span className="block text-xs text-gray-400">API Docs (soon)</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-800 text-sm mb-3">Contact</h4>
            <div className="space-y-2">
              <span className="block text-xs text-gray-400">🇵🇭 Philippines</span>
              <span className="block text-xs text-gray-400">support@aimessenger.ph</span>
            </div>
          </div>
        </div>

        <div className="border-t border-orange-100 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} AI Messenger. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <Link href="/privacy" className="hover:text-[#ff6b6b] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#ff6b6b] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
