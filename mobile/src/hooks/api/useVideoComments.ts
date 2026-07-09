import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchVideoComments,
  postVideoComment,
  toggleCommentLike,
} from '@/lib/api/comments';

export function useVideoComments(videoId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['video', videoId, 'comments'];

  const query = useQuery({
    queryKey,
    enabled: Boolean(videoId),
    queryFn: () => fetchVideoComments(videoId!),
  });

  const postMutation = useMutation({
    mutationFn: ({ body, parentId }: { body: string; parentId?: string }) =>
      postVideoComment(videoId!, body, parentId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
  });

  const likeMutation = useMutation({
    mutationFn: (commentId: string) => toggleCommentLike(commentId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, postComment: postMutation, likeComment: likeMutation };
}
