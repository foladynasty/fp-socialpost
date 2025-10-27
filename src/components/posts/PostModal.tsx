import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Post, Platform } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { uploadImage, deleteImage } from '../../lib/upload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Upload, X, Calendar as CalendarIcon } from 'lucide-react';

interface PostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PostFormData) => Promise<void>;
  post?: Post | null;
  defaultDate?: Date;
}

interface PostFormData {
  content: string;
  image_url?: string | null;
  scheduled_date: Date;
  status?: 'draft' | 'pending';
  platforms?: Platform[];
}

export function PostModal({ open, onClose, onSubmit, post, defaultDate }: PostModalProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const isAdmin = profile?.role === 'admin';
  const isEditing = !!post;

  // Form state
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>(['linkedin']);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Character count
  const charCount = content.length;
  const maxChars = 500;

  // Check if user can edit this post
  const canEdit = !isEditing || isAdmin || ['draft', 'rejected'].includes(post?.status || '');

  // Initialize form with post data or default date
  useEffect(() => {
    if (post) {
      setContent(post.content);
      setImageUrl(post.image_url);
      setPlatforms(post.platforms || ['linkedin']);
      const date = new Date(post.scheduled_date);
      setScheduledDate(format(date, 'yyyy-MM-dd'));
      setScheduledTime(format(date, 'HH:mm'));
    } else if (defaultDate) {
      const date = new Date(defaultDate);
      setScheduledDate(format(date, 'yyyy-MM-dd'));
      setPlatforms(['linkedin']);
      // Default to 9 AM
      setScheduledTime('09:00');
    } else {
      // Default to tomorrow at 9 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setScheduledDate(format(tomorrow, 'yyyy-MM-dd'));
      setScheduledTime('09:00');
      setPlatforms(['linkedin']);
    }
  }, [post, defaultDate, open]);

  // Reset form on close
  const handleClose = () => {
    setContent('');
    setImageUrl(null);
    setScheduledDate('');
    setScheduledTime('');
    setPlatforms(['linkedin']);
    setError(null);
    onClose();
  };

  // Handle platform toggle
  const handlePlatformToggle = (platform: Platform) => {
    setPlatforms(prev => {
      if (prev.includes(platform)) {
        // Don't allow removing all platforms
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadImage(file, user.id);
      if (result.error) {
        setError(result.error.message);
      } else if (result.url) {
        // Delete old image if replacing
        if (imageUrl) {
          await deleteImage(imageUrl);
        }
        setImageUrl(result.url);
      }
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Remove image
  const handleRemoveImage = async () => {
    if (imageUrl) {
      await deleteImage(imageUrl);
      setImageUrl(null);
    }
  };

  // Validate and submit
  const handleSubmit = async (status: 'draft' | 'pending') => {
    setError(null);

    // Validation
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    if (content.length > maxChars) {
      setError(`Content must be ${maxChars} characters or less`);
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setError('Scheduled date and time are required');
      return;
    }

    // Combine date and time
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

    // Check if at least 30 minutes in the future
    const now = new Date();
    const minTime = new Date(now.getTime() + 30 * 60 * 1000);

    if (scheduledDateTime < minTime) {
      setError('Post must be scheduled at least 30 minutes in the future');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        content: content.trim(),
        image_url: imageUrl,
        scheduled_date: scheduledDateTime,
        status,
        platforms,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Post' : 'Create New Post'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editing ${post?.status} post`
              : 'Create a new social media post for approval'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show rejection reason if post was rejected */}
          {post?.status === 'rejected' && post.rejection_reason && (
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Rejection Reason:</strong> {post.rejection_reason}
              </AlertDescription>
            </Alert>
          )}

          {/* Show published URLs if post was successfully published */}
          {post?.status === 'published' && post.published_urls && (
            <Alert className="border-green-600 bg-green-50">
              <AlertDescription>
                <strong className="text-green-900">Published Successfully!</strong>
                <div className="mt-2 space-y-1">
                  {post.published_urls.linkedin && (
                    <div>
                      <span className="text-sm text-green-800">LinkedIn: </span>
                      <a
                        href={post.published_urls.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Post
                      </a>
                    </div>
                  )}
                  {post.published_urls.facebook && (
                    <div>
                      <span className="text-sm text-green-800">Facebook: </span>
                      <a
                        href={post.published_urls.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Post
                      </a>
                    </div>
                  )}
                  {post.published_urls.instagram && (
                    <div>
                      <span className="text-sm text-green-800">Instagram: </span>
                      <a
                        href={post.published_urls.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Post
                      </a>
                    </div>
                  )}
                </div>
                {post.published_at && (
                  <p className="mt-2 text-xs text-green-700">
                    Published on {format(new Date(post.published_at), 'PPpp')}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Show error message if post failed to publish */}
          {post?.status === 'failed' && post.publish_error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Publishing Failed:</strong> {post.publish_error}
              </AlertDescription>
            </Alert>
          )}

          {/* Status badge */}
          {isEditing && post && (
            <div>
              <Badge variant={post.status as any}>{post.status.toUpperCase()}</Badge>
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Write your post content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!canEdit || loading}
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Max {maxChars} characters</span>
              <span className={charCount > maxChars ? 'text-destructive' : 'text-muted-foreground'}>
                {charCount} / {maxChars}
              </span>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Image (Optional)</Label>
            {imageUrl ? (
              <div className="relative inline-block">
                <img
                  src={imageUrl}
                  alt="Post"
                  className="h-40 w-auto rounded-lg border object-cover"
                />
                {canEdit && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveImage}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleImageUpload}
                  disabled={!canEdit || loading || uploading}
                  className="hidden"
                />
                <Label
                  htmlFor="image"
                  className={`flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                    canEdit && !loading && !uploading
                      ? 'hover:border-primary hover:bg-accent'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {uploading ? 'Uploading...' : 'Click to upload image'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, GIF (max 5MB)
                    </p>
                  </div>
                </Label>
              </div>
            )}
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>
              Publish to Platforms <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-3">
              {(['linkedin', 'facebook', 'instagram'] as Platform[]).map((platform) => (
                <label
                  key={platform}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 transition-colors ${
                    platforms.includes(platform)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  } ${!canEdit || loading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={platforms.includes(platform)}
                    onChange={() => handlePlatformToggle(platform)}
                    disabled={!canEdit || loading}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm font-medium capitalize">{platform}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select at least one platform (LinkedIn, Facebook, or Instagram)
            </p>
          </div>

          {/* Scheduled Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={!canEdit || loading}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">
                Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={!canEdit || loading}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            <CalendarIcon className="inline h-3 w-3" /> Posts must be scheduled at least 30 minutes in the future
          </p>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>

          {canEdit && (
            <>
              <Button
                variant="secondary"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                onClick={() => handleSubmit('pending')}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </>
          )}

          {!canEdit && (
            <p className="text-sm text-muted-foreground">
              This post cannot be edited (status: {post?.status})
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
