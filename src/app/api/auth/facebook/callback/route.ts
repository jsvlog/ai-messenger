// ============================================================
// Facebook OAuth Callback — Exchange code for page tokens
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient, getServiceClient } from '@/lib/supabase/server';
import { exchangeForLongLivedToken, getUserPages, subscribePageToWebhook } from '@/lib/facebook';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard?error=no_fb_code', request.url).toString()
    );
  }

  // Admin-only guard: only authorized admins can connect new pages
  const ADMIN_EMAILS = ['sczyrynjohnson@gmail.com'];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL('/dashboard?error=no_user', request.url).toString()
    );
  }
  const isAdmin = ADMIN_EMAILS.includes(user.email || '');
  if (!isAdmin) {
    return NextResponse.redirect(
      new URL('/dashboard?error=admin_only', request.url).toString()
    );
  }

  try {
    // Step 1: Exchange code for short-lived user token
    const appId = process.env.NEXT_PUBLIC_META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    const redirectUri = 'https://ai-messenger-pi.vercel.app/api/auth/facebook/callback';

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
        `?client_id=${appId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${appSecret}` +
        `&code=${code}`
    );

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('[FB Auth] Token error:', JSON.stringify(tokenData.error));
      const errorMsg = tokenData.error.message || tokenData.error.type || 'unknown';
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent('fb_token: ' + errorMsg)}`, request.url).toString()
      );
    }

    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange for long-lived token
    const longLivedData = await exchangeForLongLivedToken(shortLivedToken);
    if (!longLivedData) {
      return NextResponse.redirect(
        new URL('/dashboard?error=fb_long_token', request.url).toString()
      );
    }

    const longLivedToken = longLivedData.access_token;

    // Step 3: Fetch user's pages
    const { pages, rawResponse } = await getUserPages(longLivedToken);

    if (pages.length === 0) {
      // Try short-lived token
      const { pages: pages2, rawResponse: raw2 } = await getUserPages(shortLivedToken);
      if (pages2.length > 0) {
        pages.push(...pages2);
      } else {
        // Show raw Facebook response in error
        const fbMsg = rawResponse.slice(0, 200) || raw2.slice(0, 200) || 'empty';
        return NextResponse.redirect(
          new URL(`/dashboard?error=${encodeURIComponent('no_pages: ' + fbMsg)}`, request.url).toString()
        );
      }
    }

    // Step 4: Save connected pages to DB (user already verified as admin above)
    const serviceClient = getServiceClient();
    const userId = user.id || state;

    if (!userId) {
      return NextResponse.redirect(
        new URL('/dashboard?error=no_user', request.url).toString()
      );
    }

    let connectedCount = 0;

    for (const page of pages) {
      // Upsert page connection (use type assertion since we're using service client without generated types)
      const { error: upsertError } = await (serviceClient
        .from('connected_pages') as any)
        .upsert(
          {
            user_id: userId,
            page_id: page.id,
            page_name: page.name,
            page_access_token: page.access_token,
            page_category: page.category,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,page_id' }
        );

      if (upsertError) {
        console.error('[FB Auth] Page upsert error:', upsertError);
        continue;
      }

      // Step 5: Subscribe page to webhook
      const subscribed = await subscribePageToWebhook(page.access_token);

      if (subscribed) {
        console.log(`[FB Auth] ✓ Page "${page.name}" subscribed to webhook`);
        connectedCount++;
      } else {
        console.log(`[FB Auth] ⚠ Page "${page.name}" webhook subscription failed`);
      }
    }

    return NextResponse.redirect(
      new URL(
        `/dashboard?success=connected&count=${connectedCount}`,
        request.url
      ).toString()
    );
  } catch (err) {
    console.error('[FB Auth] Fatal error:', err);
    return NextResponse.redirect(
      new URL('/dashboard?error=fb_exception', request.url).toString()
    );
  }
}
