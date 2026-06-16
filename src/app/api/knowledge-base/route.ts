// ============================================================
// Knowledge Base API — Upload markdown & generate embeddings
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, getServiceClient } from '@/lib/supabase/server';
import { generateEmbedding, chunkMarkdown } from '@/lib/ai-engine';

// POST: Upload/update knowledge base markdown for a page
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

    // 1. Upsert knowledge base entry
    const { data: kb, error: kbError } = await serviceClient
      .from('knowledge_bases')
      .upsert(
        {
          page_id: pageId,
          title,
          content_md: contentMd,
          content_type: contentType || 'general',
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'page_id,title' }
      )
      .select('id')
      .single();

    if (kbError || !kb) {
      console.error('[KB] Upsert error:', kbError);
      return NextResponse.json({ error: 'Failed to save knowledge base' }, { status: 500 });
    }

    // 2. Delete old chunks for this knowledge base
    await serviceClient
      .from('knowledge_chunks')
      .delete()
      .eq('knowledge_id', kb.id);

    // 3. Chunk the markdown
    const chunks = chunkMarkdown(contentMd);
    console.log(`[KB] Generated ${chunks.length} chunks from "${title}"`);

    // 4. Generate embeddings and insert chunks (process in batches to avoid rate limits)
    const BATCH_SIZE = 5;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      const chunkRows = await Promise.all(
        batch.map(async (content, batchIdx) => {
          const embedding = await generateEmbedding(content);
          return {
            knowledge_id: kb.id,
            page_id: pageId,
            chunk_index: i + batchIdx,
            content,
            embedding,
            token_count: Math.ceil(content.length / 4), // rough estimate
          };
        })
      );

      // Filter out chunks that failed embedding
      const validChunks = chunkRows.filter((c) => c.embedding.length > 0);

      if (validChunks.length > 0) {
        const { error: insertError } = await serviceClient
          .from('knowledge_chunks')
          .insert(validChunks);

        if (insertError) {
          console.error('[KB] Chunk insert error:', insertError);
        }
      }

      // Small delay between batches to respect API rate limits
      if (i + BATCH_SIZE < chunks.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return NextResponse.json({
      success: true,
      knowledgeId: kb.id,
      chunksCreated: chunks.length,
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
