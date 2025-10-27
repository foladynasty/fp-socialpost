// Supabase Edge Function: Post Status Update
// Webhook receiver for n8n to update post status after publishing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdatePayload {
  post_id: string
  status: 'published' | 'failed'
  published_urls?: {
    linkedin?: string
    facebook?: string
    instagram?: string
  }
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    )
  }

  try {
    // Parse request body
    const payload: UpdatePayload = await req.json()

    // Validate payload
    if (!payload.post_id) {
      return new Response(
        JSON.stringify({ error: 'post_id is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    if (!payload.status || !['published', 'failed'].includes(payload.status)) {
      return new Response(
        JSON.stringify({ error: 'status must be "published" or "failed"' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Prepare update data
    const updateData: any = {
      status: payload.status,
    }

    if (payload.status === 'published') {
      updateData.published_at = new Date().toISOString()
      if (payload.published_urls) {
        updateData.published_urls = payload.published_urls
      }
      updateData.publish_error = null // Clear any previous errors
    } else if (payload.status === 'failed') {
      updateData.publish_error = payload.error || 'Publishing failed'
    }

    // Update the post
    const { data, error } = await supabaseClient
      .from('posts')
      .update(updateData)
      .eq('id', payload.post_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating post:', error)
      throw error
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Post ${payload.post_id} updated to ${payload.status}`,
        data: {
          id: data.id,
          status: data.status,
          published_at: data.published_at,
          published_urls: data.published_urls,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Update webhook error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
