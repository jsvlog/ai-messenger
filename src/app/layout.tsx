import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'CaterAI — AI Auto-Reply for Filipino Catering Businesses',
    template: '%s — CaterAI',
  },
  description:
    'Never miss a catering inquiry again. CaterAI auto-replies to your Facebook Messenger in warm Taglish, captures event details (date, pax, venue, budget), and books events while you\'re in the kitchen. Built specifically for Filipino caterers.',
  keywords: [
    'catering ai',
    'catering chatbot',
    'facebook messenger auto reply',
    'catering business philippines',
    'taglish ai chatbot',
    'catering lead capture',
    'pinoy catering assistant',
    'facebook page auto reply catering',
    'event booking ai',
  ],
  authors: [{ name: 'CaterAI' }],
  creator: 'CaterAI',
  publisher: 'CaterAI',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ai-messenger-pi.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    url: '/',
    siteName: 'CaterAI',
    title: 'CaterAI — AI Auto-Reply for Filipino Catering Businesses',
    description:
      'Never miss a catering inquiry. AI replies in Taglish, captures date/pax/venue/budget, books events 24/7.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'CaterAI — AI Auto-Reply for Filipino Catering Businesses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CaterAI — AI Auto-Reply for Filipino Caterers',
    description:
      'Never miss a catering inquiry. AI replies in Taglish, captures event details, books events 24/7.',
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
