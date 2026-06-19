import type { Metadata } from 'next';
import './globals.css';
import { WebsiteAssistant } from '@/components/WebsiteAssistant';

export const metadata: Metadata = {
  title: {
    default: 'CaterAI — AI Auto-Reply for Filipino Businesses',
    template: '%s — CaterAI',
  },
  description:
    'Never miss a customer inquiry again. CaterAI auto-replies to your Facebook Messenger in warm Taglish, captures leads, and books customers 24/7. Built for Filipino businesses — catering, rentals, salons, clinics, and more.',
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
        <WebsiteAssistant />
      </body>
    </html>
  );
}
