<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Share2, Flag, MoreHorizontal, Pencil, Trash2, Link2 } from 'lucide-react';
=======
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Share2, Flag, MoreHorizontal } from 'lucide-react';
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
import type { Post } from '../types';
import { Avatar } from './Avatar';
import { MoodBadge } from './MoodBadge';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ReportModal } from './ReportModal';

interface PostCardProps {
  post: Post;
  onLikeToggle?: (postId: string, liked: boolean) => void;
  onSaveToggle?: (postId: string, saved: boolean) => void;
<<<<<<< HEAD
  onDeleted?: (postId: string) => void;
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  compact?: boolean;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

<<<<<<< HEAD
function MediaGallery({ post }: { post: Post }) {
  const media = post.media ?? post.post_media ?? [];
  if (media.length === 0) return null;
  return (
    <div className="mt-4 grid gap-2">
      {media.map(media => (
        <div key={media.id} className="rounded-xl overflow-hidden border border-white/5 bg-black/30">
          {media.media_type === 'video' ? (
            <video src={media.media_url} controls className="w-full max-h-[420px] object-contain" />
          ) : media.media_type === 'voice' ? (
            <audio src={media.media_url} controls className="w-full p-3" />
          ) : (
            <img src={media.media_url} alt="" className="w-full max-h-[420px] object-contain" />
          )}
        </div>
      ))}
    </div>
  );
}

export function PostCard({ post, onLikeToggle, onSaveToggle, onDeleted, compact }: PostCardProps) {
=======
export function PostCard({ post, onLikeToggle, onSaveToggle, compact }: PostCardProps) {
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [saved, setSaved] = useState(post.is_saved ?? false);
  const [showMenu, setShowMenu] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
<<<<<<< HEAD
  const [submittingLike, setSubmittingLike] = useState(false);
  const [submittingSave, setSubmittingSave] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setLiked(post.is_liked ?? false);
    setLikeCount(post.like_count);
    setSaved(post.is_saved ?? false);
  }, [post.id, post.is_liked, post.like_count, post.is_saved]);

  const handleLike = async () => {
    if (!user || submittingLike) return;
    const previousLiked = liked;
    const previousLikeCount = likeCount;
    const newLiked = !previousLiked;

    setActionError('');
    setSubmittingLike(true);
    setLiked(newLiked);
    setLikeCount(newLiked ? previousLikeCount + 1 : Math.max(previousLikeCount - 1, 0));
    onLikeToggle?.(post.id, newLiked);

    try {
      if (newLiked) {
        const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: post.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', post.id);
        if (error) throw error;
      }
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousLikeCount);
      onLikeToggle?.(post.id, previousLiked);
      setActionError('Unable to update your like right now.');
    } finally {
      setSubmittingLike(false);
=======

  const handleLike = async () => {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => newLiked ? c + 1 : c - 1);
    onLikeToggle?.(post.id, newLiked);

    if (newLiked) {
      await supabase.from('likes').insert({ user_id: user.id, post_id: post.id });
    } else {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', post.id);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    }
  };

  const handleSave = async () => {
<<<<<<< HEAD
    if (!user || submittingSave) return;
    const previousSaved = saved;
    const newSaved = !previousSaved;

    setActionError('');
    setSubmittingSave(true);
    setSaved(newSaved);
    onSaveToggle?.(post.id, newSaved);

    try {
      if (newSaved) {
        const { error } = await supabase.from('saved_posts').insert({ user_id: user.id, post_id: post.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', post.id);
        if (error) throw error;
      }
    } catch {
      setSaved(previousSaved);
      onSaveToggle?.(post.id, previousSaved);
      setActionError('Unable to update your saved posts right now.');
    } finally {
      setSubmittingSave(false);
=======
    if (!user) return;
    const newSaved = !saved;
    setSaved(newSaved);
    onSaveToggle?.(post.id, newSaved);

    if (newSaved) {
      await supabase.from('saved_posts').insert({ user_id: user.id, post_id: post.id });
    } else {
      await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', post.id);
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      await navigator.share({ title: post.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

<<<<<<< HEAD
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (!error) onDeleted?.(post.id);
  };

=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
  return (
    <>
      <article className="bg-surface rounded-2xl p-5 hover:bg-surface-50/50 transition-colors animate-fade-in">
        <div className="flex items-start gap-3">
<<<<<<< HEAD
          <Link to={`/profile/${post.user_id}`} title="Open profile">
            <Avatar seed={post.profiles?.avatar_seed ?? post.user_id} size="md" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${post.user_id}`} className="text-sm font-medium text-white hover:text-primary-50">
                {post.profiles?.username ?? 'Anonymous'}
              </Link>
=======
          <Avatar seed={post.profiles?.avatar_seed ?? post.user_id} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-white">
                {post.profiles?.username ?? 'Anonymous'}
              </span>
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
              <MoodBadge mood={post.mood} size="sm" />
              <span className="text-xs text-gray-500">{timeAgo(post.created_at)}</span>
            </div>
            <Link to={`/post/${post.id}`} className="block mt-2 group">
              <h3 className="font-semibold text-white group-hover:text-primary-50 transition-colors">
                {post.title}
              </h3>
              {!compact && (
                <p className="text-sm text-gray-300 mt-1 line-clamp-3 whitespace-pre-wrap">
                  {post.content}
                </p>
              )}
            </Link>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 bg-surface-50 border border-white/10 rounded-xl shadow-xl py-1 min-w-[160px] animate-scale-in">
<<<<<<< HEAD
                  {user?.id === post.user_id && (
                    <>
                      <button
                        onClick={() => window.location.assign(`/create?edit=${post.id}`)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </>
                  )}
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
                  <button
                    onClick={() => { setReportOpen(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <Flag className="w-4 h-4" /> Report
                  </button>
<<<<<<< HEAD
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <Link2 className="w-4 h-4" /> Copy link
                  </button>
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
                </div>
              </>
            )}
          </div>
        </div>

<<<<<<< HEAD
        <MediaGallery post={post} />

        <div className="flex items-center gap-5 mt-4 pt-3 border-t border-white/5">
          <button
            onClick={handleLike}
            disabled={submittingLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
            } ${submittingLike ? 'opacity-60' : ''}`}
=======
        <div className="flex items-center gap-5 mt-4 pt-3 border-t border-white/5">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
            }`}
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </button>

          <Link
            to={`/post/${post.id}`}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-secondary transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.comment_count}</span>
          </Link>

          <button
            onClick={handleSave}
<<<<<<< HEAD
            disabled={submittingSave}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              saved ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
            } ${submittingSave ? 'opacity-60' : ''}`}
=======
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              saved ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
            }`}
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-50 transition-colors ml-auto"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
<<<<<<< HEAD

        {actionError && (
          <p className="mt-3 text-xs text-danger-50">{actionError}</p>
        )}
=======
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
      </article>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={post.id}
      />
    </>
  );
}
