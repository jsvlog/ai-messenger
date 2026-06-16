// ============================================================
// Supabase Server Client (for server components & API routes)
// ============================================================
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Cookie setting can fail in certain contexts — safe to ignore
          }
        },
      },
    }
  );
}

// Service-role client (bypasses RLS — for webhooks & background jobs)
import { createClient as createSupaClient } from '@supabase/supabase-js';

let _serviceClient: ReturnType<typeof createSupaClient> | null = null;

export function getServiceClient() {
  if (!_serviceClient) {
    _serviceClient = createSupaClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _serviceClient;
}
