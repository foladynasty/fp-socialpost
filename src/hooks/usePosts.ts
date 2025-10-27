import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Post, PostFormData, PostStatus } from '../types';
import { useAuth } from './useAuth';

export function usePosts(filterStatus?: PostStatus | PostStatus[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch posts
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts', user?.id, filterStatus],
    queryFn: async () => {
      if (!user) throw new Error('No user found');

      let query = supabase
        .from('posts')
        .select('*, profiles(*)')
        .order('scheduled_date', { ascending: true });

      if (filterStatus) {
        if (Array.isArray(filterStatus)) {
          query = query.in('status', filterStatus);
        } else {
          query = query.eq('status', filterStatus);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
      return data as Post[];
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  // Create post
  const createPost = useMutation({
    mutationFn: async (postData: PostFormData) => {
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          creator_id: user.id,
          content: postData.content,
          image_url: postData.image_url,
          scheduled_date: postData.scheduled_date.toISOString(),
          status: postData.status || 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Update post
  const updatePost = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PostFormData> }) => {
      const updateData: any = { ...data };
      if (data.scheduled_date) {
        updateData.scheduled_date = data.scheduled_date.toISOString();
      }

      const { data: updated, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Delete post
  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Approve post (admin only)
  const approvePost = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('posts')
        .update({ status: 'approved', rejection_reason: null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Reject post (admin only)
  const rejectPost = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase
        .from('posts')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return {
    posts,
    isLoading,
    error,
    createPost,
    updatePost,
    deletePost,
    approvePost,
    rejectPost,
  };
}
