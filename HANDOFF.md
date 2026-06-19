# CaterAI (AI Messenger) — Handoff Prompt for New Session

## CRITICAL: Load the skill first
In the new session, say: **"load the ai-messenger skill"** — it has full project context, DB schema, common fixes, and credentials.

---

## What We've Built (Complete)

An industry-aware AI auto-reply SaaS for Facebook Messenger. Catering, Rentals, Salon, Clinic, Photography, Real Estate, and General business types.

### Live URLs
- **Production**: https://ai-messenger-pi.vercel.app
- **GitHub**: https://github.com/jsvlog/ai-messenger
- **Vercel**: johnson-s-projects9/ai-messenger
- **Supabase**: ouabxcplvxhiiqmkknss
- **Meta App**: 2093101957935499 (Development mode, App Review submitted — pending)
- **Lemon Squeezy**: Store 408886, variants: Starter 1797119, Pro 1797134, Annual 1797135

### Test Account
- Email: sczyrynjohnson@gmail.com / Password: 12345678
- Plan: Pro (manual DB upgrade, bypasses LS)
- Connected page: JS Money Vlog

---

## Features Completed

| Feature | Status |
|---|---|
| Taglish AI auto-reply (OpenRouter Gemini Flash) | ✅ |
| Facebook Messenger webhook + Send API | ✅ |
| Industry-aware system (7 business types) | ✅ |
| KB Builder — form-based, dynamic per industry | ✅ |
| Industry-aware AI prompts (different questions per business) | ✅ |
| Floating website AI assistant (chat bubble) | ✅ |
| Conversation viewer (full thread modal) | ✅ |
| Message search & filter | ✅ |
| Analytics panel (5 stats) | ✅ |
| Lead capture & CSV export | ✅ |
| Multi-tenant dashboard | ✅ |
| Supabase auth (email + Google) | ✅ |
| Lemon Squeezy payments (3 plans) | ✅ |
| waitUntil() for async AI processing | ✅ |
| Mobile responsive layout | ✅ |
| Free tier (20 msgs/day) | ✅ |
| Business hours scheduling (PH timezone) | ✅ |
| Admin handover (30-min cooldown) | ✅ |
| Onboarding wizard (3 steps) | ✅ |
| Manual connect wizard (3 steps) | ✅ |
| Landing page (multi-industry) | ✅ |
| Pricing page | ✅ |
| Privacy & Terms pages | ✅ |

---

## Known Issues & Fixes

### Facebook OAuth "no_pages" error
**Root cause**: "New Pages Experience" pages managed through Business Portfolios don't appear in `/me/accounts` API without `business_management` permission.

**Current state**: 5/9 of founder's pages work via OAuth. Rest use manual connect.

**Fix options**:
- User switches page to Classic mode (Settings → Switch to Classic Pages)
- Manual connect at `/dashboard/connect` (3-step wizard)
- App Review → get `business_management` → all pages work

### Facebook App Review
Submitted, pending. Permissions: pages_messaging, pages_show_list. Business verification under review ("Johnson Lizardo's business"). When approved → switch to Live → all pages should appear in one-click OAuth.

### DB constraints (run once in Supabase SQL Editor)
```sql
ALTER TABLE public.knowledge_bases ADD CONSTRAINT IF NOT EXISTS knowledge_bases_page_id_title_unique UNIQUE (page_id, title);
ALTER TABLE public.page_settings ADD CONSTRAINT IF NOT EXISTS page_settings_page_id_unique UNIQUE (page_id);
```

### AI schedule timezone
Fixed — `should_ai_respond` function now uses `Asia/Manila` timezone.

### Upsert pattern
ALL upserts into `connected_pages` MUST use `onConflict: 'user_id,page_id'` AND include `user_id` in the data payload.

---

## What's Left to Build

### High Priority (Next Sprint)
1. **Lead notification email** — Email when hot lead captured (name, phone, event details)
2. **FB Page connection UX improvement** — auto-detect New Pages Experience and guide users smarter
3. **Message counter fix** — pass dailyMsgCount to SubscriptionCard (shows ?/20 for some states)

### Medium Priority
4. **Conversation search across all senders**
5. **AI response quality dashboard** — flag good/bad replies
6. **Quick-reply canned responses** — let owners jump in with templates
7. **Custom domain** — aimessenger.ph or caterai.ph

### Low Priority / Future
8. **Multi-language** — pure Tagalog option, pure English
9. **Facebook Ad integration** — create ads from dashboard
10. **Slack/Viber notification channel**

---

## Key Architecture

- Webhook: `/api/webhook/facebook` — `waitUntil()` keeps function alive
- AI: `/api/process-ai` — vector search → OpenRouter → Meta Send
- Industry config: `src/lib/industries.ts` — 7 business types, all prompts/fields
- AI engine: `src/lib/ai-engine.ts` — `buildTaglishPrompt()` is industry-aware
- KB Builder: `src/components/Dashboard/KnowledgeBaseManager.tsx` — dynamic forms
- Website Assistant: `src/components/WebsiteAssistant.tsx` + `/api/website-assistant`

## Build & Deploy
```bash
cd "D:\hermes project\AI Messenger"
git push  # Auto-deploys to Vercel
```

## User Preferences
- Autonomous execution — build, fix, deploy without asking
- Co-founder mindset — think about customer UX and business value
- Prioritizes end-user simplicity (one-click flows, minimal friction)
- Comfortable sharing credentials
- Reactive iteration over planning
- Design: warm sunset (coral #ff6b6b, amber #ffa94d), gradients, rounded corners
