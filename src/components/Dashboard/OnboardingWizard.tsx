'use client';

// ============================================================
// OnboardingWizard — Guided 3-step setup for new tenants
// ============================================================

import { useState } from 'react';

interface Props {
  hasPages: boolean;
  hasKb: boolean;
  hasSubscription: boolean;
}

type Step = 1 | 2 | 3;

export function OnboardingWizard({ hasPages, hasKb, hasSubscription }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>(1);

  const steps = [
    {
      num: 1 as Step,
      title: 'Connect Your Facebook Page',
      desc: 'Click "Connect Your Facebook Page" below to link your business page. This lets our AI read and reply to your messages.',
      done: hasPages,
      action: 'Scroll down to the "Connected Pages" section',
      actionLabel: 'Connect Page ↓',
    },
    {
      num: 2 as Step,
      title: 'Add Your Business Knowledge',
      desc: 'Paste your pricing, menu, FAQs, and policies into the Knowledge Base. The AI uses this to answer customer questions accurately.',
      done: hasKb,
      action: 'Scroll to "Knowledge Base" and paste your business info',
      actionLabel: 'Add Knowledge ↓',
    },
    {
      num: 3 as Step,
      title: 'Activate & Upgrade (Optional)',
      desc: 'Turn on AI auto-reply and you\'re live! The free plan gives you 20 messages/day. Upgrade anytime for unlimited messages and more features.',
      done: hasSubscription,
      action: hasSubscription
        ? 'You\'re all set! 🎉'
        : 'Consider upgrading for unlimited messages and more pages.',
      actionLabel: hasSubscription ? 'Done ✓' : 'View Plans →',
    },
  ];

  const allDone = steps.every((s) => s.done);
  const completedCount = steps.filter((s) => s.done).length;

  if (allDone) return null; // Hide wizard when everything is set up

  return (
    <div className="rounded-2xl bg-white border-2 border-[#ffa94d]/30 shadow-xl shadow-orange-200/30 p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ff6b6b]/10 to-[#ffa94d]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-semibold text-gray-700">
          🚀 Setup Progress
        </span>
        <span className="text-xs text-gray-400">
          {completedCount}/3 complete
        </span>
        <div className="flex-1 h-2 bg-orange-100 rounded-full ml-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex gap-1 mb-4">
        {steps.map((step) => (
          <button
            key={step.num}
            onClick={() => setCurrentStep(step.num)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              currentStep === step.num
                ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white shadow-sm'
                : step.done
                  ? 'bg-green-50 text-green-600 border border-green-100'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            {step.done ? '✓' : step.num}. {step.title.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Current step detail */}
      {(() => {
        const step = steps[currentStep - 1];
        return (
          <div className="relative">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              {step.desc}
            </p>
            {!step.done && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{step.action}</p>
                {currentStep < 3 && (
                  <button
                    onClick={() =>
                      setCurrentStep(
                        (currentStep + 1) as Step
                      )
                    }
                    className="text-xs text-[#ff6b6b] hover:text-[#ffa94d] font-medium transition-colors"
                  >
                    Skip for now →
                  </button>
                )}
              </div>
            )}
            {step.done && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
                <span className="text-green-500">✅</span>
                <span className="text-sm text-green-700">Completed!</span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
