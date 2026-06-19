import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy — CaterAI',
  description: 'How CaterAI collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
      <LandingNav />
      <main className="w-full py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center mx-auto">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8 text-center">Last updated: {new Date().toISOString().slice(0, 10)}</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <Section title="1. Information We Collect">
              <p>When you use CaterAI, we collect:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                <li><strong>Account Information:</strong> Your name, email address, and profile picture when you sign up via email or Google.</li>
                <li><strong>Facebook Page Data:</strong> When you connect your Facebook Page, we access your Page name, category, and Messenger conversations. We use this solely to provide the AI auto-reply service.</li>
                <li><strong>Customer Messages:</strong> Messages sent to your Facebook Page by customers are processed by our AI to generate replies. These messages are stored securely in our database.</li>
                <li><strong>Usage Data:</strong> Message counts, AI response times, and feature usage to improve our service.</li>
              </ul>
            </Section>

            <Section title="2. How We Use Your Data">
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>To provide the AI auto-reply service on your Facebook Page</li>
                <li>To capture and organize customer lead information (names, phone numbers, event details)</li>
                <li>To enforce usage limits on free plans</li>
                <li>To process payments via Lemon Squeezy</li>
                <li>To send you important service updates and billing notifications</li>
              </ul>
            </Section>

            <Section title="3. Data Storage & Security">
              <p className="text-sm text-gray-600">
                All data is stored in Supabase (PostgreSQL) with encryption at rest and in transit. 
                Your Facebook Page access tokens are encrypted and never exposed to third parties.
                We implement Row Level Security (RLS) to ensure you can only access your own data.
                We never share, sell, or rent your customer data to anyone.
              </p>
            </Section>

            <Section title="4. Third-Party Services">
              <p className="text-sm text-gray-600">
                We rely on the following third-party services to operate:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                <li><strong>Supabase</strong> — Database hosting and authentication</li>
                <li><strong>Meta (Facebook)</strong> — Messenger API for sending/receiving messages</li>
                <li><strong>OpenRouter / Google</strong> — AI model hosting for generating replies</li>
                <li><strong>Vercel</strong> — Application hosting and serverless functions</li>
                <li><strong>Lemon Squeezy</strong> — Payment processing (Merchant of Record)</li>
              </ul>
            </Section>

            <Section title="5. Data Retention">
              <p className="text-sm text-gray-600">
                We retain your account information and message logs for as long as your account is active. 
                If you disconnect your Facebook Page or delete your account, your data is permanently 
                deleted within 30 days. You may request immediate deletion by contacting us.
              </p>
            </Section>

            <Section title="6. Your Rights">
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>You can disconnect your Facebook Page at any time from the dashboard</li>
                <li>You can delete your account and all associated data</li>
                <li>You can export your lead data in CSV format from the dashboard</li>
                <li>You can request a copy of all data we hold about you</li>
              </ul>
            </Section>

            <Section title="7. Contact Us">
              <p className="text-sm text-gray-600">
                If you have questions about this Privacy Policy, contact us at:
                <br />
                <strong>Email:</strong> support@caterai.ph
                <br />
                <strong>Location:</strong> Philippines
              </p>
            </Section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="warm-card p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{title}</h2>
      {children}
    </section>
  );
}
