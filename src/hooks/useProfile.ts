import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getUserProfile } from '../lib/supabase';
import type { ProfileUpdateData } from '../types';
import { useAuth } from './useAuth';

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => {
      if (!user) throw new Error('No user found');
      return getUserProfile(user.id);
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      if (!user) throw new Error('No user found');

      const { data: updated, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  };
}
