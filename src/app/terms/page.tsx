import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using CaterAI.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
      <LandingNav />
      <main className="w-full py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center mx-auto">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8 text-center">Last updated: {new Date().toISOString().slice(0, 10)}</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <Section title="1. Acceptance of Terms">
              <p className="text-sm text-gray-600">
                By accessing or using CaterAI (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service.
                If you do not agree, do not use the Service. We reserve the right to update these terms at any time.
                Continued use after changes constitutes acceptance.
              </p>
            </Section>

            <Section title="2. Description of Service">
              <p className="text-sm text-gray-600">
                CaterAI provides an AI-powered auto-reply service for Facebook Messenger.
                The Service reads incoming messages to your connected Facebook Page, generates responses
                using artificial intelligence, and sends replies automatically. The Service also captures
                lead information from conversations for your review.
              </p>
            </Section>

            <Section title="3. Account & Facebook Connection">
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>You must provide accurate account information and keep it updated.</li>
                <li>You grant us permission to access your connected Facebook Pages for the purpose of reading and replying to messages.</li>
                <li>You may disconnect any Facebook Page at any time from your dashboard.</li>
                <li>You are responsible for complying with Meta&apos;s Platform Policies and Terms of Service.</li>
              </ul>
            </Section>

            <Section title="4. AI Responses & Limitations">
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>AI-generated responses may not always be accurate or appropriate.</li>
                <li>You are responsible for reviewing AI responses and monitoring conversations.</li>
                <li>We do not guarantee that the AI will capture all lead information correctly.</li>
                <li>The Service includes an &ldquo;Admin Handover Mode&rdquo; that pauses AI when you reply manually.</li>
              </ul>
            </Section>

            <Section title="5. Payments & Billing">
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>Paid plans are processed through Lemon Squeezy, our Merchant of Record.</li>
                <li>Monthly plans renew automatically until cancelled.</li>
                <li>Annual plans are billed once per year.</li>
                <li>Refunds: 7-day money-back guarantee on all paid plans.</li>
                <li>Free plan is limited to 20 AI replies per day and 1 Facebook Page.</li>
              </ul>
            </Section>

            <Section title="6. Prohibited Use">
              <p className="text-sm text-gray-600">You agree not to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                <li>Use the Service for spam, scams, or illegal activities</li>
                <li>Attempt to reverse engineer or exploit the AI engine</li>
                <li>Use the Service to send harassing or abusive messages</li>
                <li>Resell or white-label the Service without permission</li>
                <li>Violate Meta&apos;s Platform Policies through the Service</li>
              </ul>
            </Section>

            <Section title="7. Limitation of Liability">
              <p className="text-sm text-gray-600">
                CaterAI is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable
                for any damages arising from the use of the Service, including but not limited to
                lost revenue, missed leads, or inaccurate AI responses. Our total liability is
                limited to the amount you paid us in the last 3 months.
              </p>
            </Section>

            <Section title="8. Termination">
              <p className="text-sm text-gray-600">
                You may stop using the Service at any time. We reserve the right to suspend or terminate
                accounts that violate these terms. Upon termination, your data will be deleted within 30 days.
              </p>
            </Section>

            <Section title="9. Contact">
              <p className="text-sm text-gray-600">
                Questions about these terms? Contact us at:
                <br />
                <strong>Email:</strong> support@caterai.ph
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
