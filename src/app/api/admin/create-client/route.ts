// ============================================================
// Admin: Create Client Account
// Uses service role to create a new user + profile via Supabase Auth
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient, getServiceClient } from '@/lib/supabase/server';

const ADMIN_EMAIL = 'sczyrynjohnson@gmail.com';

export async function POST(request: NextRequest) {
  // Verify caller is admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const { email, fullName, password } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, fullName, password' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const serviceClient = getServiceClient();

    // Create the auth user
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm so client can log in immediately
    });

    if (authError) {
      console.error('[Create Client] Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    const newUserId = authData.user.id;

    // Create the profile record
    const { error: profileError } = await (serviceClient
      .from('profiles') as any)
      .upsert({
        id: newUserId,
        email: email.toLowerCase().trim(),
        full_name: fullName,
        plan: 'free',
      });

    if (profileError) {
      console.error('[Create Client] Profile error:', profileError);
      // User was created but profile failed — still report success
      // the profile can be created later
    }

    console.log(`[Create Client] Created account for ${fullName} (${email}) -> ${newUserId}`);

    return NextResponse.json({
      success: true,
      userId: newUserId,
      email: email.toLowerCase().trim(),
      fullName,
    });
  } catch (err) {
    console.error('[Create Client] Error:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
