'use client';

// Force dynamic rendering — uses browser Supabase client
export const dynamic = 'force-dynamic';

// ============================================================
// Login Page — Email/Password only (no signup)
// Admin creates accounts manually via /dashboard/admin
// ============================================================

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      router.push('/dashboard');
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6] px-4">
      {/* Background orbs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-orange-200/30 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="fixed bottom-0 right-0 w-[30rem] h-[30rem] bg-amber-200/30 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#ff6b6b] to-[#ffa94d] flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-orange-300/40 mb-4">
            AI
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] bg-clip-text text-transparent">
            AI Messenger
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Smart auto-replies for your Facebook page
          </p>
        </div>

        {/* Auth card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl shadow-orange-100/50 border border-orange-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
            Welcome Back
          </h2>

          {/* Email/Password form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white font-semibold hover:shadow-lg hover:shadow-orange-300/40 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </button>
          </form>

          {/* Get account info */}
          <div className="mt-6 p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
            <p className="text-xs text-blue-600">
              Don't have an account? Message our official Facebook page to get one.
            </p>
            <a
              href=""
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-[#1877f2] hover:underline"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Visit our Facebook page
            </a>
          </div>

          {message && (
            <p className={`mt-4 text-sm text-center ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}