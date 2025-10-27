// Supabase Edge Function: Post Scheduler
// Runs on a schedule to publish approved posts at their scheduled time
// Sends posts to n8n webhook for actual platform publishing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Post {
  id: string
  creator_id: string
  content: string
  image_url: string | null
  platforms: string[]
  scheduled_date: string
  profiles: {
    email: string
    full_name: string
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
    if (!n8nWebhookUrl) {
      throw new Error('N8N_WEBHOOK_URL environment variable not set')
    }

    // Query posts ready for publishing
    const { data: posts, error: queryError } = await supabaseClient
      .from('posts')
      .select(`
        id,
        creator_id,
        content,
        image_url,
        platforms,
        scheduled_date,
        profiles (
          email,
          full_name
        )
      `)
      .eq('status', 'approved')
      .lte('scheduled_date', new Date().toISOString())
      .is('published_at', null)
      .limit(10) // Process max 10 posts per run

    if (queryError) {
      console.error('Error querying posts:', queryError)
      throw queryError
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No posts ready for publishing',
          processed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const results = []

    // Process each post
    for (const post of posts as Post[]) {
      try {
        // Update status to 'publishing'
        const { error: updateError } = await supabaseClient
          .from('posts')
          .update({ status: 'publishing' })
          .eq('id', post.id)

        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError)
          results.push({ id: post.id, success: false, error: updateError.message })
          continue
        }

        // Send to n8n webhook
        const webhookPayload = {
          post_id: post.id,
          content: post.content,
          image_url: post.image_url,
          platforms: post.platforms,
          creator: {
            id: post.creator_id,
            email: post.profiles.email,
            name: post.profiles.full_name,
          },
          scheduled_date: post.scheduled_date,
          callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/post-status-update`
        }

        const webhookResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        })

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text()
          throw new Error(`n8n webhook failed: ${errorText}`)
        }

        results.push({ id: post.id, success: true })

      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error)

        // Update post status to 'failed' with error message
        await supabaseClient
          .from('posts')
          .update({
            status: 'failed',
            publish_error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', post.id)

        results.push({ id: post.id, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${posts.length} posts`,
        successful: successCount,
        failed: failureCount,
        details: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Scheduler error:', error)
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
