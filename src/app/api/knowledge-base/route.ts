// ============================================================
// Knowledge Base API — Save AI context markdown
// No embeddings needed — full KB text is passed directly to LLM
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, getServiceClient } from '@/lib/supabase/server';

// POST: Save AI context markdown for a page
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { pageId, title, contentMd, contentType } = await request.json();

    if (!pageId || !title || !contentMd) {
      return NextResponse.json(
        { error: 'Missing required fields: pageId, title, contentMd' },
        { status: 400 }
      );
    }

    // Verify the user owns this page
    const { data: page } = await supabase
      .from('connected_pages')
      .select('id')
      .eq('id', pageId)
      .eq('user_id', user.id)
      .single();

    if (!page) {
      return NextResponse.json({ error: 'Page not found or not owned by you' }, { status: 403 });
    }

    const serviceClient = getServiceClient();

    // Save the AI context record with a distinct title so it does NOT overwrite
    // the form data JSON record (which has the raw title).
    const contextTitle = title + ' (AI Context)';
    const contextType = (contentType || 'general') + '_context';

    const { error: ctxError } = await serviceClient
      .from('knowledge_bases')
      .upsert(
        {
          page_id: pageId,
          title: contextTitle,
          content_md: contentMd,
          content_type: contextType,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'page_id,title' }
      );

    if (ctxError) {
      console.error('[KB] Context upsert error:', ctxError);
      return NextResponse.json({ error: 'Failed to save AI context: ' + ctxError.message }, { status: 500 });
    }

    console.log(`[KB] AI context saved for page ${pageId}: ${contentMd.length} chars`);

    return NextResponse.json({
      success: true,
      chunksCreated: 1, // We pass full KB text now — "1 chunk" = the whole KB
    });
  } catch (err) {
    console.error('[KB] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET: List knowledge bases for a page
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const pageId = searchParams.get('pageId');

  if (!pageId) {
    return NextResponse.json({ error: 'Missing pageId parameter' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('knowledge_bases')
    .select('*')
    .eq('page_id', pageId)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch knowledge bases' }, { status: 500 });
  }

  return NextResponse.json({ knowledgeBases: data });
}

// DELETE: Remove a knowledge base
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const kbId = searchParams.get('id');

  if (!kbId) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  const { error } = await supabase
    .from('knowledge_bases')
    .delete()
    .eq('id', kbId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}