# ApprovalFeed - Social Post Scheduler MVP

A minimalist social media content approval workflow tool that enables teams to create, review, and schedule posts through a two-tier permission system (Creator/Admin).

## Features

- **Two-tier permission system**: Creators and Admins
- **Post workflow**: Draft → Pending → Approved/Rejected
- **Calendar view**: Visual scheduling interface
- **Approval feed**: Admin-only interface for reviewing posts
- **Image uploads**: Support for social media images
- **Real-time updates**: Powered by Supabase

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Backend**: Supabase (Auth, Database, Storage)
- **Calendar**: react-big-calendar
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

## Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd fp-socialpost
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Set Up Supabase

1. Create a new project at [https://supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key
4. Create a \`.env\` file in the project root:

\`\`\`env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
\`\`\`

### 4. Run Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and run the entire contents of \`supabase-setup.sql\`

This will create:
- \`profiles\` table with RLS policies
- \`posts\` table with RLS policies
- Storage bucket for images
- Automatic profile creation on signup

### 5. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:5173](http://localhost:5173)

## Project Structure

\`\`\`
fp-socialpost/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── calendar/      # Calendar components (TBD)
│   │   ├── layout/        # Layout components (AppLayout, Sidebar)
│   │   ├── posts/         # Post-related components (TBD)
│   │   └── ui/            # shadcn/ui components (Button, Input, Card, etc.)
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts     # Authentication hook
│   │   ├── useProfile.ts  # User profile hook
│   │   └── usePosts.ts    # Posts CRUD hook
│   ├── lib/
│   │   ├── supabase.ts    # Supabase client
│   │   ├── upload.ts      # File upload utilities
│   │   └── utils.ts       # Helper functions
│   ├── pages/             # Page components
│   │   ├── Login.tsx      # Login/Signup page
│   │   ├── Dashboard.tsx  # Main dashboard with calendar
│   │   ├── ApprovalFeed.tsx  # Admin approval interface
│   │   └── Settings.tsx   # User settings
│   ├── types/
│   │   └── index.ts       # TypeScript types
│   ├── App.tsx            # Main app with routing
│   ├── main.tsx          # App entry point
│   └── index.css         # Global styles
├── supabase-setup.sql    # Database schema
├── .env.example          # Environment variables template
└── package.json
\`\`\`

## User Roles

### Creator (Default)
- Create draft posts
- Submit posts for approval
- Edit draft and rejected posts
- View own posts in calendar
- Cannot edit pending or approved posts

### Admin
- All Creator permissions
- View all users' posts
- Approve or reject pending posts
- Provide rejection feedback
- Edit any post at any time

## Setting Up the First Admin

After your first user signs up, promote them to admin:

1. Go to Supabase Dashboard → Table Editor → profiles
2. Find the user by email
3. Change their \`role\` from \`creator\` to \`admin\`
4. Save

## Key Business Rules

1. **Status Flow**: Draft → Pending → Approved/Rejected
2. **Editing Permissions**:
   - Creators: Can only edit Draft and Rejected posts
   - Admins: Can edit any post
3. **Scheduling**: Posts must be scheduled at least 30 minutes in the future
4. **Content**: Max 500 characters
5. **Images**: Max 5MB, JPG/PNG/GIF only

## Available Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
\`\`\`

## Development Status

### ✅ Completed (Phase 1-2)
- Project setup with Vite + React + TypeScript
- Tailwind CSS + shadcn/ui configuration
- Supabase integration
- Authentication (email/password + Google OAuth)
- User profile management
- Protected routes with role checking
- Database schema with RLS policies
- File upload utilities
- Custom hooks (useAuth, useProfile, usePosts)

### 🚧 In Progress (Phase 3)
- Calendar component
- Post creation/editing modal
- Dashboard integration

### 📋 TODO (Phase 4-6)
- Approval feed for admins
- Approval/rejection workflow
- Toast notifications
- Error boundaries
- Loading states
- Form validation with Zod
- Testing
- Deployment

## Environment Variables

\`\`\`env
VITE_SUPABASE_URL=      # Your Supabase project URL
VITE_SUPABASE_ANON_KEY= # Your Supabase anon/public key
\`\`\`

## Deployment

### Option 1: Vercel (Recommended)

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Option 2: Netlify

\`\`\`bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
\`\`\`

### Environment Variables on Hosting

Don't forget to add your Supabase credentials to your hosting platform's environment variables!

## Troubleshooting

### Build errors
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Supabase connection issues
- Verify your .env file has the correct values
- Check that Supabase RLS policies are created
- Ensure the storage bucket exists

### Authentication not working
- Check Supabase Auth settings
- For Google OAuth, configure authorized redirect URLs in Google Cloud Console

## Contributing

This is a MVP project. Contributions welcome!

## License

MIT

## Support

For issues or questions, please open a GitHub issue.

---

**Built with Claude Code** 🤖
