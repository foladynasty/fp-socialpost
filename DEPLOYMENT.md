# Deployment Guide - Vercel

## Quick Deploy (Recommended - 2 minutes)

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel**
   - Visit [https://vercel.com](https://vercel.com)
   - Sign up or log in (use GitHub account for easy integration)

2. **Import Your Repository**
   - Click "Add New..." → "Project"
   - Import your GitHub repository: `foladynasty/fp-socialpost`
   - Select the branch: `claude/project-setup-auth-011CUXJMnwLhX5mhAUjhnTjU`

3. **Configure Environment Variables**
   Before deploying, add these environment variables in Vercel:

   ```
   VITE_SUPABASE_URL=<your-supabase-project-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

   ⚠️ **IMPORTANT**: Add these in the Vercel project settings under "Environment Variables" tab.

4. **Deploy**
   - Framework Preset: Vite (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Click "Deploy"

5. **Done!** 🎉
   - Vercel will provide you with a live URL like: `https://fp-socialpost-xxx.vercel.app`
   - The app will auto-deploy on every git push

---

## Method 2: Deploy via Vercel CLI

### Install Vercel CLI
```bash
npm install -g vercel
```

### Deploy
```bash
# Login to Vercel
vercel login

# Deploy (first time will ask questions)
vercel

# For production deployment
vercel --prod
```

### Set Environment Variables via CLI
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

---

## Post-Deployment Steps

### 1. Configure Supabase Redirect URLs

After deployment, add your Vercel URL to Supabase:

1. Go to your Supabase project → Authentication → URL Configuration
2. Add to "Redirect URLs":
   ```
   https://your-app.vercel.app/**
   https://your-app.vercel.app
   ```

### 2. Test Your Deployment

Visit your Vercel URL and test:
- ✅ Sign up with email/password
- ✅ Sign in
- ✅ Navigate to Dashboard
- ✅ Visit Settings page
- ✅ Sign out

### 3. Set Up Custom Domain (Optional)

In Vercel Dashboard:
- Go to your project → Settings → Domains
- Add your custom domain
- Follow DNS configuration instructions

---

## Troubleshooting

### Build Fails
- Check that environment variables are set in Vercel
- Verify the build works locally: `npm run build`

### Authentication Not Working
- Check Supabase redirect URLs include your Vercel domain
- Verify environment variables are correct in Vercel

### Blank Page After Deploy
- Check browser console for errors
- Verify Supabase URL and keys are correct

---

## Continuous Deployment

Once connected to GitHub, Vercel will:
- ✅ Auto-deploy on every push to your branch
- ✅ Create preview deployments for pull requests
- ✅ Show deployment status in GitHub

---

## Your Current Setup

- **Repository**: foladynasty/fp-socialpost
- **Branch**: claude/project-setup-auth-011CUXJMnwLhX5mhAUjhnTjU
- **Build Command**: npm run build
- **Output Directory**: dist
- **Framework**: Vite

**Environment Variables Needed**:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

---

Need help? Check the deployment logs in Vercel dashboard or contact support!
