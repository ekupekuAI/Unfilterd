import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, ShieldAlert, LogOut, Ban, MoreVertical, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/Avatar';
import { LoadingSpinner, EmptyState } from '../components/Layout';
import { CRISIS_RESOURCES, chatAlias, detectCrisisLocally, tagLabel } from '../lib/vibe';
import type { Message } from '../types';

type ConversationRow = {
  id: string;
  user_a: string;
  user_b: string;
  closed_at: string | null;
  closed_by: string | null;
  match_id: string | null;
};

const MAX_LENGTH = 2000;

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<ConversationRow | null>(null);
  const [sharedTags, setSharedTags] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showCrisis, setShowCrisis] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const markRead = useCallback(async (list: Message[]) => {
    if (!user || !id) return;
    const unread = list.filter(m => m.sender_id !== user.id && !m.read_at).map(m => m.id);
    if (!unread.length) return;
    await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unread);
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', user.id).eq('type', 'message').eq('link', `/chat/${id}`);
  }, [id, user]);

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;

    (async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, user_a, user_b, closed_at, closed_by, match_id')
        .eq('id', id)
        .maybeSingle();
      if (cancelled) return;
      if (!conv) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setConversation(conv as ConversationRow);

      const [{ data: msgs }, matchRes] = await Promise.all([
        supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }).limit(500),
        conv.match_id
          ? supabase.from('vibe_matches').select('shared_tags').eq('id', conv.match_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      const list = (msgs ?? []) as Message[];
      setMessages(list);
      setSharedTags(((matchRes.data as { shared_tags?: string[] } | null)?.shared_tags) ?? []);
      setLoading(false);
      void markRead(list);
    })();

    const channel = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, payload => {
        const message = payload.new as Message;
        setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
        if (message.sender_id !== user.id) void markRead([message]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${id}` }, payload => {
        setConversation(prev => prev ? { ...prev, ...(payload.new as Partial<ConversationRow>) } : prev);
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [id, markRead, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !user || !id || sending) return;
    if (detectCrisisLocally(text)) setShowCrisis(true);
    setSending(true);
    setError('');
    const { data, error: sendError } = await supabase
      .from('messages')
      .insert({ conversation_id: id, sender_id: user.id, content: text })
      .select('*')
      .single();
    setSending(false);
    if (sendError) {
      setError(sendError.message.includes('row-level security')
        ? 'This chat has ended, so new messages can’t be sent.'
        : sendError.message);
      return;
    }
    setDraft('');
    setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data as Message]);
  };

  const leave = async (block: boolean) => {
    if (!id) return;
    const confirmed = window.confirm(block
      ? 'Leave this chat and block this person? They won’t be matched with you again.'
      : 'Leave this chat? It will end for both of you.');
    if (!confirmed) return;
    const { error: leaveError } = await supabase.rpc('leave_conversation', { p_conversation_id: id, p_block: block });
    if (leaveError) {
      setError(leaveError.message);
      return;
    }
    navigate('/matches');
  };

  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (notFound || !conversation || !user) {
    return (
      <EmptyState
        icon={Lock}
        title="Chat not found"
        description="This chat doesn't exist or isn't yours."
        action={<Link to="/matches" className="text-primary text-sm">Back to matches</Link>}
      />
    );
  }

  const otherId = conversation.user_a === user.id ? conversation.user_b : conversation.user_a;
  const alias = chatAlias(`${conversation.id}:${otherId}`);
  const closed = Boolean(conversation.closed_at);

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col px-4 pt-4 pb-24 md:pb-6">
        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
          <button onClick={() => navigate('/matches')} className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-gray-400" aria-label="Back to matches">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar seed={alias} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{alias}</p>
            <p className="text-xs text-gray-500 truncate">
              {sharedTags.length ? `You both feel ${sharedTags.slice(0, 3).map(t => `#${tagLabel(t)}`).join(' ')}` : 'Anonymous chat'}
            </p>
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400" aria-label="Chat options">
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 rounded-xl bg-surface border border-white/10 shadow-xl z-10 overflow-hidden">
                <button onClick={() => { setMenuOpen(false); void leave(false); }} className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-white/5 flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Leave chat
                </button>
                <button onClick={() => { setMenuOpen(false); void leave(true); }} className="w-full px-4 py-3 text-left text-sm text-danger-50 hover:bg-white/5 flex items-center gap-2">
                  <Ban className="w-4 h-4" /> Leave and block
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="my-3 rounded-lg bg-surface/60 px-3 py-2 text-xs text-gray-400 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
          <span>You're both anonymous. Be kind, and don't share your name, number, address or social handles. You can leave anytime.</span>
        </div>

        {showCrisis && (
          <div className="mb-3 rounded-xl bg-primary/10 border border-primary/20 p-3">
            <p className="text-sm text-white font-medium">You don't have to carry this alone.</p>
            {CRISIS_RESOURCES.map(line => <p key={line} className="text-xs text-gray-300 mt-1">{line}</p>)}
          </div>
        )}

        <div className="flex-1 space-y-2 overflow-y-auto py-2" aria-live="polite">
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-10">
              You both said yes. Start with how your day has been. There's no pressure here.
            </p>
          )}
          {messages.map(message => {
            const mine = message.sender_id === user.id;
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
                  mine ? 'bg-primary text-white rounded-br-md' : 'bg-surface text-gray-100 rounded-bl-md'
                }`}>
                  {message.content}
                  <span className={`block text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-gray-500'}`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {mine && message.read_at ? ' · seen' : ''}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-xs text-danger-50 mb-2">{error}</p>}

        {closed ? (
          <div className="rounded-xl bg-surface p-4 text-center text-sm text-gray-400">
            {conversation.closed_by === user.id ? 'You ended this chat.' : 'The other person ended this chat. Take care of yourself.'}
          </div>
        ) : (
          <form
            onSubmit={e => { e.preventDefault(); void send(); }}
            className="flex items-end gap-2 sticky bottom-20 md:bottom-4 bg-[#0F172A] pt-2"
          >
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="Write something kind…"
              aria-label="Message"
              className="flex-1 resize-none bg-surface-50 rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-white/5 focus:border-primary focus:outline-none max-h-32"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="p-3 rounded-xl bg-primary text-white disabled:opacity-40"
              aria-label="Send message"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
