# n8n Integration Guide

This guide explains how to set up automated social media posting using n8n workflows with ApprovalFeed.

## Overview

ApprovalFeed uses n8n as an automation platform to handle actual posting to social media platforms (LinkedIn, Facebook, Instagram). The approval workflow remains in the app, but the publishing is delegated to n8n for flexibility and reliability.

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│   ApprovalFeed  │────────>│     n8n      │────────>│  Social Media   │
│  (Supabase)     │ Webhook │  Workflows   │   API   │   Platforms     │
└─────────────────┘         └──────────────┘         └─────────────────┘
         ^                          │
         │        Callback          │
         └──────────────────────────┘
```

### Flow:
1. **Scheduling**: Supabase Edge Function `post-scheduler` runs every minute (cron job)
2. **Trigger**: Finds approved posts that are due to be published
3. **Webhook**: Sends post data to n8n webhook endpoint
4. **Publishing**: n8n workflow posts to selected platforms
5. **Callback**: n8n reports status back to `post-status-update` webhook

## Database Schema Changes

### New Fields in `posts` Table:

```sql
-- Platform selection (array of: linkedin, facebook, instagram)
platforms text[] DEFAULT ARRAY['linkedin']

-- Publishing timestamps
published_at timestamp with time zone

-- Platform-specific post URLs
published_urls jsonb
-- Example: {"linkedin": "https://linkedin.com/...", "facebook": "https://..."}

-- Error message if publishing fails
publish_error text
```

### New Post Statuses:

- `publishing` - Post is currently being published by n8n
- `published` - Successfully published to all platforms
- `failed` - Publishing failed (see `publish_error` for details)

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```bash
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/publish-post
```

Replace with your actual n8n webhook URL.

### 2. Database Migration

Run the SQL migration to add new fields:

```bash
psql -h your-db-host -U postgres -d your-db-name -f supabase-migration-n8n.sql
```

Or run the SQL commands directly in Supabase SQL Editor:
- Open Supabase Dashboard → SQL Editor
- Copy contents of `supabase-migration-n8n.sql`
- Execute the SQL

### 3. Deploy Supabase Edge Functions

#### Deploy post-scheduler (Cron Job)

```bash
# Deploy the function
supabase functions deploy post-scheduler

# Set environment variable
supabase secrets set N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/publish-post

# Create cron trigger (run every minute)
# In Supabase Dashboard → Database → Extensions → pg_cron
SELECT cron.schedule(
  'post-scheduler-cron',
  '* * * * *',  -- Every minute
  $$
  SELECT
    net.http_post(
      url:='https://your-project.supabase.co/functions/v1/post-scheduler',
      headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

#### Deploy post-status-update (Webhook Receiver)

```bash
supabase functions deploy post-status-update
```

Note the webhook URL - you'll need this for n8n callbacks:
```
https://your-project.supabase.co/functions/v1/post-status-update
```

### 4. Create n8n Workflow

Create a new workflow in n8n with the following nodes:

#### Node 1: Webhook Trigger
- **Type**: Webhook
- **HTTP Method**: POST
- **Path**: `publish-post`
- **Authentication**: None (use query param or header token if needed)

#### Node 2: Switch (Platform Router)
- **Mode**: Rules
- **Rules**:
  - If `platforms` contains `linkedin` → LinkedIn node
  - If `platforms` contains `facebook` → Facebook node
  - If `platforms` contains `instagram` → Instagram node

#### Node 3-5: Social Media Nodes

**LinkedIn Node:**
- **Type**: LinkedIn API
- **Operation**: Create Post
- **Authentication**: OAuth2 (configure LinkedIn app)
- **Fields**:
  - Content: `{{ $json.content }}`
  - Image URL: `{{ $json.image_url }}` (if present)

**Facebook Node:**
- **Type**: Facebook Graph API
- **Operation**: Create Post
- **Authentication**: OAuth2 (configure Facebook app)
- **Fields**:
  - Message: `{{ $json.content }}`
  - Image URL: `{{ $json.image_url }}` (if present)

**Instagram Node:**
- **Type**: Instagram Graph API
- **Operation**: Create Media Post
- **Authentication**: OAuth2 (configure Instagram app)
- **Fields**:
  - Caption: `{{ $json.content }}`
  - Image URL: `{{ $json.image_url }}` (required for Instagram)

#### Node 6: Aggregate Results
- **Type**: Merge
- **Mode**: Append
- Combine results from all platform nodes

#### Node 7: Callback to ApprovalFeed
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `{{ $json.callback_url }}`
- **Authentication**: Bearer Token (from webhook payload)
- **Body**:
  ```json
  {
    "post_id": "{{ $json.post_id }}",
    "status": "{{ $json.success ? 'published' : 'failed' }}",
    "published_urls": {
      "linkedin": "{{ $json.linkedin_url }}",
      "facebook": "{{ $json.facebook_url }}",
      "instagram": "{{ $json.instagram_url }}"
    },
    "error": "{{ $json.error }}"
  }
  ```

#### Node 8: Error Handler
- **Type**: Error Trigger
- **Trigger on**: All errors
- **Action**: Send callback with `status: 'failed'` and error message

## Webhook Payloads

### From ApprovalFeed to n8n

```json
{
  "post_id": "uuid",
  "creator_id": "uuid",
  "content": "Post content here...",
  "image_url": "https://storage.supabase.co/...",
  "platforms": ["linkedin", "facebook", "instagram"],
  "scheduled_date": "2025-01-15T14:30:00Z",
  "creator_email": "creator@example.com",
  "creator_name": "John Doe",
  "callback_url": "https://your-project.supabase.co/functions/v1/post-status-update",
  "callback_token": "service_role_key_or_jwt"
}
```

### From n8n to ApprovalFeed (Callback)

**Success:**
```json
{
  "post_id": "uuid",
  "status": "published",
  "published_urls": {
    "linkedin": "https://linkedin.com/feed/update/...",
    "facebook": "https://facebook.com/posts/...",
    "instagram": "https://instagram.com/p/..."
  }
}
```

**Failure:**
```json
{
  "post_id": "uuid",
  "status": "failed",
  "error": "LinkedIn API error: Invalid token"
}
```

## UI Features

### Platform Selection
- Creators can select which platforms to publish to when creating/editing posts
- At least one platform must be selected
- Default: LinkedIn

### Status Indicators
- **Draft** (Gray) - Not submitted for approval
- **Pending** (Yellow) - Awaiting admin approval
- **Approved** (Green) - Approved, waiting for scheduled time
- **Rejected** (Red) - Rejected by admin with reason
- **Publishing** (Blue) - Currently being published by n8n
- **Published** (Dark Green) - Successfully published with clickable URLs
- **Failed** (Dark Red) - Publishing failed with error message

### Published Post Details
When a post is successfully published, the modal displays:
- Success alert with green background
- Clickable links to each platform's published post
- Published timestamp

### Failed Post Details
When publishing fails, the modal displays:
- Error alert with red background
- Detailed error message from n8n
- Admin can investigate and potentially retry

## Monitoring

### Check Scheduler Logs
```bash
# View post-scheduler logs
supabase functions logs post-scheduler --tail

# View post-status-update logs
supabase functions logs post-status-update --tail
```

### Database Queries

**Posts ready for publishing:**
```sql
SELECT * FROM posts
WHERE status = 'approved'
  AND scheduled_date <= NOW()
  AND published_at IS NULL
ORDER BY scheduled_date;
```

**Posts currently publishing:**
```sql
SELECT * FROM posts
WHERE status = 'publishing'
ORDER BY scheduled_date DESC;
```

**Published posts:**
```sql
SELECT * FROM posts
WHERE status = 'published'
ORDER BY published_at DESC;
```

**Failed posts:**
```sql
SELECT * FROM posts
WHERE status = 'failed'
ORDER BY scheduled_date DESC;
```

## Troubleshooting

### Posts stuck in "publishing" status
- Check n8n workflow execution history
- Verify callback webhook is working
- Manually update status if needed:
  ```sql
  UPDATE posts
  SET status = 'approved'
  WHERE id = 'post-uuid' AND status = 'publishing';
  ```

### Webhook not receiving posts
1. Verify `N8N_WEBHOOK_URL` environment variable
2. Check if cron job is running (query `cron.job_run_details`)
3. Test webhook manually:
   ```bash
   curl -X POST https://your-n8n-instance.com/webhook/publish-post \
     -H "Content-Type: application/json" \
     -d '{"post_id": "test", "content": "Test post"}'
   ```

### Platform authentication issues
- Refresh OAuth tokens in n8n
- Check API rate limits
- Verify app permissions for each platform

### Callback not working
- Check `post-status-update` function logs
- Verify callback URL in Edge Function
- Ensure service role key has proper permissions

## Security Considerations

1. **Service Role Key**: Store securely in Supabase secrets, never commit to git
2. **Webhook Authentication**: Consider adding HMAC signature verification
3. **Rate Limiting**: Implement rate limits on callback webhook
4. **OAuth Tokens**: Rotate regularly and store securely in n8n
5. **Error Messages**: Sanitize before storing in database

## Testing

### Manual Test Flow

1. Create a test post with scheduled time 2 minutes in future
2. Submit for approval (as creator)
3. Approve the post (as admin)
4. Wait for scheduled time
5. Verify post appears in n8n workflow execution
6. Check social media platforms for published posts
7. Verify status updates to "published" in ApprovalFeed
8. Check published URLs are clickable in post modal

### Test Failure Scenario

1. Temporarily break n8n workflow (disable platform node)
2. Create and approve a test post
3. Wait for publishing attempt
4. Verify status updates to "failed"
5. Check error message displays correctly
6. Re-enable workflow and retry

## Next Steps

1. **Analytics**: Track publishing success rates, platform performance
2. **Retries**: Implement automatic retry logic for failed posts
3. **Scheduling**: Add timezone support for scheduled posts
4. **Templates**: Create reusable post templates
5. **Media Library**: Centralize image management
6. **Multi-account**: Support multiple accounts per platform

## Support

For issues with:
- **ApprovalFeed**: Check application logs and Supabase dashboard
- **n8n Workflow**: Review n8n execution history and logs
- **Social Media APIs**: Consult platform-specific API documentation

## Resources

- [n8n Documentation](https://docs.n8n.io)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api/)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/)
