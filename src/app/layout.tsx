import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AI Messenger — Smart Facebook Auto-Replies for Rentals & Catering',
    template: '%s — AI Messenger',
  },
  description:
    'Never miss a customer inquiry again. AI Messenger auto-replies to your Facebook Page in warm Taglish, captures leads, and works 24/7. Built for Rentals & Catering businesses in the Philippines.',
  keywords: [
    'facebook messenger ai',
    'auto reply facebook',
    'ai chatbot messenger',
    'taglish ai',
    'rentals ai chatbot',
    'catering ai',
    'lead capture facebook',
    'pinoy ai assistant',
    'facebook page auto reply',
  ],
  authors: [{ name: 'AI Messenger' }],
  creator: 'AI Messenger',
  publisher: 'AI Messenger',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://aimessenger.ph'),
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    url: '/',
    siteName: 'AI Messenger',
    title: 'AI Messenger — Smart Facebook Auto-Replies',
    description:
      'Auto-reply to Facebook messages in natural Taglish. Capture leads 24/7. Built for Rentals & Catering businesses.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'AI Messenger — Smart Facebook Auto-Replies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Messenger — Smart Facebook Auto-Replies',
    description:
      'Auto-reply to Facebook messages in natural Taglish. Capture leads 24/7. Built for Filipino businesses.',
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="orb orb-coral" />
        <div className="orb orb-amber" />
        {children}
      </body>
    </html>
  );
}
