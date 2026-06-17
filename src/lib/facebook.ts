// ============================================================
// Facebook (Meta) Graph API helpers
// ============================================================

const META_API_BASE = 'https://graph.facebook.com/v25.0';

/**
 * Verify a webhook challenge from Meta (GET request)
 */
export function verifyWebhook(
  mode: string,
  token: string,
  challenge: string
): { valid: boolean; challenge?: string } {
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'hermes_ai_messenger_verify_2024';
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return { valid: true, challenge };
  }
  return { valid: false };
}

/**
 * Check if the sender is a Page Admin by querying the page's admin roles.
 * We check if sender_psid matches any admin of the page.
 */
export async function isPageAdmin(
  pageAccessToken: string,
  pageId: string,
  senderPsid: string
): Promise<boolean> {
  try {
    // Query page admins via the /{page-id}/roles edge
    const url = `${META_API_BASE}/${pageId}/roles?access_token=${pageAccessToken}&fields=id,name`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('[Meta] Error checking page roles:', data.error);
      return false;
    }

    const admins = data.data || [];
    return admins.some((admin: { id: string }) => admin.id === senderPsid);
  } catch (err) {
    console.error('[Meta] Failed to check admin status:', err);
    return false;
  }
}

/**
 * Send a message via the Meta Send API
 */
export async function sendMessage(
  pageAccessToken: string,
  recipientPsid: string,
  messageText: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const url = `${META_API_BASE}/me/messages?access_token=${pageAccessToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        message: { text: messageText },
        messaging_type: 'RESPONSE',
      }),
    });

    const data = await res.json();

    if (data.error) {
      console.error('[Meta] Send API error:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, messageId: data.message_id };
  } catch (err) {
    console.error('[Meta] Failed to send message:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Exchange a short-lived user access token for a long-lived page access token.
 * Called after the user connects their Facebook page via Login dialog.
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ access_token: string; expires_in?: number } | null> {
  try {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    const url =
      `${META_API_BASE}/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&fb_exchange_token=${shortLivedToken}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('[Meta] Token exchange error:', data.error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[Meta] Token exchange failed:', err);
    return null;
  }
}

/**
 * Fetch the pages that a user manages (for the page selector after login)
 */
export async function getUserPages(
  userAccessToken: string
): Promise<{ pages: { id: string; name: string; category: string; access_token: string }[]; rawResponse: string }> {
  try {
    const url = `${META_API_BASE}/me/accounts?access_token=${userAccessToken}&fields=id,name,category,access_token&limit=100`;
    const res = await fetch(url);
    const data = await res.json();
    const raw = JSON.stringify(data);

    // If empty, try alternate endpoint syntax
    if (!data.error && (!data.data || data.data.length === 0)) {
      const altUrl = `${META_API_BASE}/me?fields=accounts{id,name,category,access_token}&access_token=${userAccessToken}`;
      const altRes = await fetch(altUrl);
      const altData = await altRes.json();
      if (altData.accounts?.data?.length > 0) {
        return {
          pages: altData.accounts.data.map((p: any) => ({ id: p.id, name: p.name, category: p.category || 'Unknown', access_token: p.access_token })),
          rawResponse: JSON.stringify(altData)
        };
      }
    }

    if (data.error) {
      return { pages: [], rawResponse: raw };
    }

    const pages = (data.data || []).map(
      (p: { id: string; name: string; category: string; access_token: string }) => ({
        id: p.id,
        name: p.name,
        category: p.category || 'Unknown',
        access_token: p.access_token,
      })
    );

    return { pages, rawResponse: raw };
  } catch (err) {
    return { pages: [], rawResponse: String(err) };
  }
}

/**
 * Subscribe the page to the Messenger webhook
 */
export async function subscribePageToWebhook(
  pageAccessToken: string
): Promise<boolean> {
  try {
    const url = `${META_API_BASE}/me/subscribed_apps?access_token=${pageAccessToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscribed_fields: ['messages', 'messaging_postbacks'],
      }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('[Meta] Failed to subscribe page:', err);
    return false;
  }
}

/**
 * Get sender profile info (name, profile pic) for personalization
 */
export async function getSenderProfile(
  pageAccessToken: string,
  senderPsid: string
): Promise<{ first_name: string; last_name: string; profile_pic: string } | null> {
  try {
    const url =
      `${META_API_BASE}/${senderPsid}` +
      `?fields=first_name,last_name,profile_pic` +
      `&access_token=${pageAccessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) return null;
    return data;
  } catch {
    return null;
  }
}
