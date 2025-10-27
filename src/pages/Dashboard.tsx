import { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { ScheduleCalendar } from '../components/calendar/ScheduleCalendar';
import { PostModal } from '../components/posts/PostModal';
import { usePosts } from '../hooks/usePosts';
import { useProfile } from '../hooks/useProfile';
import type { Post } from '../types';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Plus, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const { profile } = useProfile();
  const isAdmin = profile?.role === 'admin';

  // Fetch posts - admins see all posts, creators see only their own
  const { posts, isLoading, error, createPost, updatePost } = usePosts();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();

  // Handle clicking on an empty date slot
  const handleSelectSlot = (date: Date) => {
    setSelectedPost(null);
    setDefaultDate(date);
    setModalOpen(true);
  };

  // Handle clicking on an existing post
  const handleSelectEvent = (post: Post) => {
    setSelectedPost(post);
    setDefaultDate(undefined);
    setModalOpen(true);
  };

  // Handle creating new post
  const handleCreatePost = () => {
    setSelectedPost(null);
    setDefaultDate(undefined);
    setModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPost(null);
    setDefaultDate(undefined);
  };

  // Handle form submission
  const handleSubmit = async (data: any) => {
    if (selectedPost) {
      // Update existing post
      await updatePost.mutateAsync({
        id: selectedPost.id,
        data,
      });
    } else {
      // Create new post
      await createPost.mutateAsync(data);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isAdmin
                ? 'View and manage all scheduled posts'
                : 'Manage your scheduled posts'}
            </p>
          </div>
          <Button onClick={handleCreatePost}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load posts: {error instanceof Error ? error.message : 'Unknown error'}
              <br />
              <span className="text-xs mt-2 block">
                If you're an admin, you may need to run the RLS fix script. Check the console for details.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Calendar */}
        {isLoading ? (
          <div className="flex h-96 items-center justify-center rounded-lg border">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-4 text-sm text-muted-foreground">Loading posts...</p>
            </div>
          </div>
        ) : (
          <ScheduleCalendar
            posts={posts || []}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {/* Post Modal */}
        <PostModal
          open={modalOpen}
          onClose={handleModalClose}
          onSubmit={handleSubmit}
          post={selectedPost}
          defaultDate={defaultDate}
        />
      </div>
    </AppLayout>
  );
}
