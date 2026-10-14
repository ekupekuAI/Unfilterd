import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartHandshake, Loader2, MessageCircle, Check, X, Clock, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { PageContainer, EmptyState, LoadingSpinner } from '../components/Layout';
import { Avatar } from '../components/Avatar';
import { chatAlias, requestVibeMatch, respondToVibeMatch, tagLabel } from '../lib/vibe';
import type { Conversation, Message, VibeMatch } from '../types';

type FindState =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'found' }
  | { status: 'none' }
  | { status: 'error'; message: string };

type ConversationRow = Conversation & { closed_at: string | null };

function timeAgo(dateStr: string) {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tags.map(tag => (
        <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] bg-primary/15 text-primary-50">#{tagLabel(tag)}</span>
      ))}
    </div>
  );
}

export function MatchesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const findPostId = searchParams.get('find');
  const startedFor = useRef<string | null>(null);

  const [find, setFind] = useState<FindState>({ status: 'idle' });
  const [incoming, setIncoming] = useState<VibeMatch[]>([]);
  const [outgoing, setOutgoing] = useState<VibeMatch[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError('');
    const matchSelect = '*, post:posts!vibe_matches_post_id_fkey(id, title, content, mood, vibe_tags)';
    const [inRes, outRes, convRes] = await Promise.all([
      supabase.from('vibe_matches').select(matchSelect)
        .eq('matched_user_id', user.id).eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase.from('vibe_matches').select(matchSelect)
        .eq('requester_id', user.id).eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase.from('conversations').select('*')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('last_message_at', { ascending: false }),
    ]);

    const firstError = inRes.error ?? outRes.error ?? convRes.error;
    if (firstError) setError(firstError.message);

    setIncoming((inRes.data ?? []) as VibeMatch[]);
    setOutgoing((outRes.data ?? []) as VibeMatch[]);

    const convs = (convRes.data ?? []) as ConversationRow[];
    if (convs.length) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', convs.map(c => c.id))
        .order('created_at', { ascending: false })
        .limit(300);
      const list = (msgs ?? []) as Message[];
      for (const conv of convs) {
        const mine = list.filter(m => m.conversation_id === conv.id);
        conv.last_message = mine[0] ?? null;
        conv.unread_count = mine.filter(m => m.sender_id !== user.id && !m.read_at).length;
      }
    }
    setConversations(convs);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  // Coming from the composer: look for someone who feels the same as this post.
  useEffect(() => {
    if (!findPostId || startedFor.current === findPostId) return;
    startedFor.current = findPostId;
    setFind({ status: 'searching' });
    requestVibeMatch(findPostId).then(({ match, error: matchError }) => {
      if (matchError) setFind({ status: 'error', message: matchError });
      else setFind({ status: match ? 'found' : 'none' });
      const next = new URLSearchParams(searchParams);
      next.delete('find');
      setSearchParams(next, { replace: true });
      void load();
    });
  }, [findPostId, load, searchParams, setSearchParams]);

  const respond = async (match: VibeMatch, accept: boolean) => {
    setBusyId(match.id);
    const { conversationId, error: respondError } = await respondToVibeMatch(match.id, accept);
    setBusyId(null);
    if (respondError) {
      setError(respondError);
      return;
    }
    if (accept && conversationId) {
      navigate(`/chat/${conversationId}`);
      return;
    }
    setIncoming(prev => prev.filter(m => m.id !== match.id));
  };

  if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

  const nothingYet = !incoming.length && !outgoing.length && !conversations.length && find.status === 'idle';

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-white flex items-center gap-2">
          <HeartHandshake className="w-6 h-6 text-secondary" /> Vibe matches
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          People who feel what you feel. Everything here is anonymous, and you can leave any chat at any time.
        </p>
      </div>

      {find.status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mb-6 rounded-2xl border border-secondary/25 bg-gradient-to-br from-secondary/15 to-primary/10 p-4 flex items-start gap-3"
        >
          {find.status === 'searching'
            ? <Loader2 className="w-5 h-5 text-secondary animate-spin shrink-0" />
            : <Sparkles className="w-5 h-5 text-secondary shrink-0" />}
          <div className="text-sm">
            {find.status === 'searching' && <p className="text-white">Looking for someone who feels the same way…</p>}
            {find.status === 'found' && (
              <>
                <p className="text-white font-medium">We found someone who shares your vibe.</p>
                <p className="text-gray-400 text-xs mt-1">They got an anonymous request. You'll be notified when they answer.</p>
              </>
            )}
            {find.status === 'none' && (
              <>
                <p className="text-white font-medium">Nobody matches right now.</p>
                <p className="text-gray-400 text-xs mt-1">
                  Your post is live, and anyone filtering by its tags will see it in their feed. When someone with the same vibe asks for a match, you may be the one they meet.
                </p>
              </>
            )}
            {find.status === 'error' && <p className="text-danger-50">{find.message}</p>}
          </div>
        </motion.div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3">
          <p className="text-sm text-danger-50">{error}</p>
        </div>
      )}

      {nothingYet && (
        <EmptyState
          icon={HeartHandshake}
          title="No matches yet"
          description="Write a post and tick “Match me with someone who feels this too”. We'll look for someone going through the same thing."
          action={<Link to="/create" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">Write a post</Link>}
        />
      )}

      {incoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Someone feels like you</h2>
          <div className="space-y-3">
            <AnimatePresence initial={false}>
            {incoming.map(match => (
              <motion.div
                key={match.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                className="card-soft rounded-2xl p-4"
              >
                <p className="text-xs text-gray-500">{timeAgo(match.created_at)} ago · they wrote</p>
                {match.post && (
                  <>
                    <p className="text-white font-medium mt-1">{match.post.title}</p>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-3">{match.post.content}</p>
                  </>
                )}
                <TagChips tags={match.shared_tags} />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => respond(match, true)}
                    disabled={busyId === match.id}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {busyId === match.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Talk anonymously
                  </button>
                  <button
                    onClick={() => respond(match, false)}
                    disabled={busyId === match.id}
                    className="px-4 py-2.5 rounded-lg bg-surface-50 text-gray-300 text-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Not now
                  </button>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {conversations.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Your chats</h2>
          <div className="space-y-2">
            {conversations.map(conv => {
              const otherId = conv.user_a === user?.id ? conv.user_b : conv.user_a;
              const alias = chatAlias(`${conv.id}:${otherId}`);
              return (
                <Link
                  key={conv.id}
                  to={`/chat/${conv.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-surface-50/60 transition-colors"
                >
                  <Avatar seed={alias} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">{alias}</p>
                      <span className="text-xs text-gray-500 shrink-0">{timeAgo(conv.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {conv.closed_at ? 'Chat ended' : conv.last_message?.content ?? 'Say hi. You both chose to talk.'}
                    </p>
                  </div>
                  {(conv.unread_count ?? 0) > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                  {!conv.unread_count && <MessageCircle className="w-4 h-4 text-gray-600" />}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Waiting for an answer</h2>
          <div className="space-y-2">
            {outgoing.map(match => (
              <div key={match.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface/60">
                <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-300 truncate">{match.post?.title ?? 'Your post'}</p>
                  <TagChips tags={match.shared_tags} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  );
}
