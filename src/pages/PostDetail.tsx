import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Post, Comment } from '../types';
import { PostCard } from '../components/PostCard';
import { Avatar } from '../components/Avatar';
import { ReportModal } from '../components/ReportModal';
import { PageContainer, LoadingSpinner, EmptyState } from '../components/Layout';
import { MessageCircle, Send, CornerDownRight, Trash2, Flag, Heart, Pencil } from 'lucide-react';

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const fetchPost = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_seed), post_media(*)')
      .eq('id', id)
      .maybeSingle();
    setPost(data as Post | null);

    if (data && user) {
      const [likeRes, saveRes] = await Promise.all([
        supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .eq('post_id', id)
          .maybeSingle(),
        supabase
          .from('saved_posts')
          .select('post_id')
          .eq('user_id', user.id)
          .eq('post_id', id)
          .maybeSingle(),
      ]);
      setPost({ ...data, is_liked: !!likeRes.data, is_saved: !!saveRes.data } as Post);
    }
    setLoading(false);
  }, [id, user]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_seed)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });
    const commentList = (data ?? []) as Comment[];
    if (!user || commentList.length === 0) {
      setComments(commentList);
      return;
    }

    const { data: likedRows } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', user.id)
      .in('comment_id', commentList.map(c => c.id));

    const likedIds = new Set((likedRows ?? []).map(row => row.comment_id));
    setComments(commentList.map(comment => ({ ...comment, is_liked: likedIds.has(comment.id) })));
  }, [id, user]);

  useEffect(() => { fetchPost(); fetchComments(); }, [fetchPost, fetchComments]);

  const handleSubmitComment = async () => {
    if (!user || !commentText.trim() || !id) return;
    setCommentError('');
    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      post_id: id,
      user_id: user.id,
      parent_comment_id: replyTo,
      content: commentText.trim(),
    });
    setSubmitting(false);

    if (error) {
      setCommentError(error.message);
      return;
    }

    setCommentText('');
    setReplyTo(null);
    fetchComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    setCommentError('');
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) {
      setCommentError(error.message);
      return;
    }
    fetchComments();
  };

  const handleEditComment = async () => {
    if (!editingCommentId || !editingCommentText.trim()) return;
    const { error } = await supabase.from('comments').update({ content: editingCommentText.trim() }).eq('id', editingCommentId);
    if (error) {
      setCommentError(error.message);
      return;
    }
    setEditingCommentId(null);
    setEditingCommentText('');
    fetchComments();
  };

  const handleToggleCommentLike = async (commentId: string, liked: boolean) => {
    if (!user) return;
    const previous = comments;
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? {
            ...comment,
            is_liked: liked,
            like_count: liked ? comment.like_count + 1 : Math.max(comment.like_count - 1, 0),
          }
        : comment
    ));

    const { error } = liked
      ? await supabase.from('comment_likes').insert({ user_id: user.id, comment_id: commentId })
      : await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', commentId);

    if (error) {
      setComments(previous);
    }
  };

  const nestedComments = (comments: Comment[]) => {
    const map = new Map<string, Comment[]>();
    const roots: Comment[] = [];
    comments.forEach(c => {
      if (c.parent_comment_id) {
        const arr = map.get(c.parent_comment_id) ?? [];
        arr.push(c);
        map.set(c.parent_comment_id, arr);
      } else {
        roots.push(c);
      }
    });
    return { roots, replies: map };
  };

  if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;
  if (!post) return <PageContainer><EmptyState icon={MessageCircle} title="Post not found" description="This post may have been deleted." /></PageContainer>;

  const { roots, replies } = nestedComments(comments);

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const isOwn = user?.id === comment.user_id;
    const commentReplies = replies.get(comment.id) ?? [];

    return (
      <div className={`${depth > 0 ? 'ml-8 border-l border-white/5 pl-4' : ''}`}>
        <div className="flex items-start gap-3 py-3">
          <Avatar seed={comment.profiles?.avatar_seed ?? comment.user_id} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{comment.profiles?.username ?? 'Anonymous'}</span>
              <span className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
            {editingCommentId === comment.id && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editingCommentText}
                  onChange={e => setEditingCommentText(e.target.value)}
                  className="w-full bg-surface-50 rounded-lg px-3 py-2 text-sm text-white border border-white/5"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }} className="text-xs text-gray-500">Cancel</button>
                  <button onClick={handleEditComment} className="text-xs text-primary">Save</button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => setReplyTo(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-secondary transition-colors"
              >
                <CornerDownRight className="w-3 h-3" /> Reply
              </button>
              <button
                onClick={() => handleToggleCommentLike(comment.id, !comment.is_liked)}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  comment.is_liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
                }`}
              >
                <Heart className={`w-3 h-3 ${comment.is_liked ? 'fill-current' : ''}`} />
                Like {comment.like_count}
              </button>
              {!isOwn && (
                <button
                  onClick={() => setReportCommentId(comment.id)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-danger transition-colors"
                >
                  <Flag className="w-3 h-3" /> Report
                </button>
              )}
              {isOwn && (
                <>
                  <button
                    onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.content); }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-danger transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {commentReplies.map(reply => (
          <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <PageContainer>
      <PostCard post={post} />

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Comments ({comments?.length ?? 0})
        </h2>

        <div className="bg-surface rounded-2xl p-4 mb-4">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-xs text-secondary">
              <CornerDownRight className="w-3 h-3" />
              Replying to comment
              <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white ml-auto">Cancel</button>
            </div>
          )}
          <div className="flex items-end gap-3">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              rows={2}
              className="flex-1 bg-surface-50 rounded-lg px-4 py-3 text-white placeholder-gray-500 border border-white/5 focus:border-primary focus:outline-none transition-colors resize-none text-sm"
            />
            <button
              onClick={handleSubmitComment}
              disabled={submitting || !commentText.trim()}
              className="p-3 bg-primary hover:bg-primary-200 disabled:opacity-40 rounded-lg text-white transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {commentError && (
            <p className="mt-3 text-xs text-danger-50">{commentError}</p>
          )}
        </div>

        <div className="divide-y divide-white/5">
          {roots.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>

        {roots.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">No comments yet. Be the first to share your thoughts.</p>
        )}
      </div>

      <ReportModal
        isOpen={!!reportCommentId}
        onClose={() => setReportCommentId(null)}
        targetType="comment"
        targetId={reportCommentId ?? ''}
      />
    </PageContainer>
  );
}
