'use client';

import Link from 'next/link';
import { useState } from 'react';

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-orange-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6b6b] to-[#ffa94d] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-300/30">
            AI
          </div>
          <span className="font-bold text-gray-800 text-lg">AI Messenger</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-gray-600 hover:text-[#ff6b6b] transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-gray-600 hover:text-[#ff6b6b] transition-colors">How It Works</a>
          <Link href="/login" className="gradient-btn px-5 py-2 rounded-lg text-sm">Client Login</Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 text-gray-600" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-orange-100 bg-white/95 backdrop-blur-md">
          <div className="mx-auto px-4 sm:px-6 py-4 space-y-3">
            <a href="#features" className="block text-sm text-gray-600 py-2" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-sm text-gray-600 py-2" onClick={() => setMenuOpen(false)}>How It Works</a>
            <Link href="/login" className="gradient-btn w-full text-center py-2.5 rounded-lg text-sm block">Client Login</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
