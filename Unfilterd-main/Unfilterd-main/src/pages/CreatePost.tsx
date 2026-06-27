import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Mood } from '../types';
import { MOOD_CONFIG } from '../types';
import { PageContainer } from '../components/Layout';
import { Loader2, X, Sparkles, AlertTriangle, Save, ShieldAlert, ImagePlus, Upload, Trash2 } from 'lucide-react';
import type { MediaType } from '../types';

const MOODS = Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][];

const TOXICITY_KEYWORDS = [
  'kill', 'die', 'murder', 'threat', 'suicide', 'harm', 'attack',
  'rape', 'assault', 'bomb', 'terrorist', 'shoot', 'stab',
];

function detectToxicity(text: string): { isToxic: boolean; keywords: string[] } {
  const lower = text.toLowerCase();
  const found = TOXICITY_KEYWORDS.filter(kw => lower.includes(kw));
  return { isToxic: found.length > 0, keywords: found };
}

function detectMood(text: string): Mood | null {
  const lower = text.toLowerCase();
  const moodKeywords: Record<Mood, string[]> = {
    happy: ['happy', 'joy', 'excited', 'amazing', 'wonderful', 'grateful', 'blessed', 'love it', 'awesome'],
    sad: ['sad', 'depressed', 'crying', 'heartbroken', 'lonely night', 'miss', 'grief', 'loss', 'tears'],
    angry: ['angry', 'furious', 'rage', 'hate', 'pissed', 'mad', 'outraged', 'frustrated'],
    lonely: ['alone', 'lonely', 'isolated', 'nobody', 'no friends', 'no one', 'ignored'],
    relationship: ['relationship', 'boyfriend', 'girlfriend', 'partner', 'dating', 'marriage', 'divorce', 'ex', 'breakup', 'cheated'],
    career: ['job', 'work', 'career', 'boss', 'fired', 'promotion', 'interview', 'salary', 'coworker', 'toxic workplace'],
    motivation: ['motivated', 'hustle', 'goals', 'dream', 'inspire', 'grind', 'never give up', 'push through', 'strong'],
    confession: ['confession', 'secret', 'guilty', 'admit', 'never told', 'confess', 'came clean'],
    random: [],
  };

  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (mood === 'random') continue;
    if (keywords.some(kw => lower.includes(kw))) return mood as Mood;
  }
  return null;
}

type DraftState = { title: string; content: string; mood: Mood };
type ComposerMedia = {
  file?: File;
  previewUrl: string;
  mediaType: MediaType;
  name: string;
};

export function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mood, setMood] = useState<Mood>('random');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toxicityWarning, setToxicityWarning] = useState(false);
  const [suggestedMood, setSuggestedMood] = useState<Mood | null>(null);
  const [publishError, setPublishError] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [crisisResources, setCrisisResources] = useState<string[]>([]);
  const [showHighSeverityConfirm, setShowHighSeverityConfirm] = useState(false);
  const [media, setMedia] = useState<ComposerMedia[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftKey = useMemo(() => `unfilterd:draft:${user?.id ?? 'guest'}`, [user?.id]);
  const draftsKey = useMemo(() => `unfilterd:drafts:${user?.id ?? 'guest'}`, [user?.id]);

  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    const draftId = searchParams.get('draft');
    const editId = searchParams.get('edit');
    setEditingPostId(editId);
    if (editId) {
      supabase
        .from('posts')
        .select('id, title, content, mood, user_id')
        .eq('id', editId)
        .maybeSingle()
        .then(({ data }) => {
          if (data && data.user_id === user?.id) {
            setTitle(data.title);
            setContent(data.content);
            setMood(data.mood as Mood);
          }
        });
      return;
    }
    if (saved) {
      try {
        const draft = JSON.parse(saved) as DraftState;
        setTitle(draft.title ?? '');
        setContent(draft.content ?? '');
        setMood(draft.mood ?? 'random');
      } catch {
        setTitle('');
        setContent('');
      }
    } else if (draftId) {
      try {
        const drafts = JSON.parse(localStorage.getItem(draftsKey) || '[]') as Array<DraftState & { id: string }>;
        const draft = drafts.find(d => d.id === draftId);
        if (draft) {
          setTitle(draft.title);
          setContent(draft.content);
          setMood(draft.mood);
        }
      } catch {
        setTitle('');
        setContent('');
      }
    }
  }, [draftKey, draftsKey, searchParams, user?.id]);

  useEffect(() => () => {
    media.forEach(item => URL.revokeObjectURL(item.previewUrl));
  }, [media]);

  const updateMoodSignals = (text: string) => {
    const { isToxic } = detectToxicity(text);
    setToxicityWarning(isToxic);
    setSuggestedMood(detectMood(text));
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    updateMoodSignals(title + ' ' + text);
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    updateMoodSignals(text + ' ' + content);
  };

  const saveDraft = () => {
    const payload: DraftState = { title, content, mood };
    localStorage.setItem(draftKey, JSON.stringify(payload));
    const drafts = JSON.parse(localStorage.getItem(draftsKey) || '[]') as Array<DraftState & { id: string }>;
    const draftId = searchParams.get('draft') || crypto.randomUUID();
    const next = [{ id: draftId, ...payload }, ...drafts.filter(d => d.id !== draftId)].slice(0, 20);
    localStorage.setItem(draftsKey, JSON.stringify(next));
  };

  const addFiles = (files: FileList | File[]) => {
    const items = Array.from(files).slice(0, 4 - media.length).map(file => {
      const previewUrl = URL.createObjectURL(file);
      const mediaType: MediaType = file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
          ? 'voice'
          : file.type === 'image/gif'
            ? 'gif'
            : 'image';
      return { file, previewUrl, mediaType, name: file.name };
    });
    setMedia(prev => [...prev, ...items].slice(0, 4));
  };

  const uploadMedia = async (postId: string) => {
    if (!media.length) return;
    setUploadingMedia(true);
    try {
      const uploads = await Promise.all(media.map(async (item, index) => {
        if (!item.file) return null;
        const path = `${user?.id}/${postId}/${Date.now()}-${index}-${item.file.name}`;
        const { error } = await supabase.storage.from('post-media').upload(path, item.file, { upsert: true, contentType: item.file.type });
        if (error) throw error;
        const { data } = supabase.storage.from('post-media').getPublicUrl(path);
        return {
          post_id: postId,
          user_id: user!.id,
          media_type: item.mediaType,
          media_url: data.publicUrl,
          sort_order: index,
        };
      }));
      const payload = uploads.filter((item): item is NonNullable<typeof item> => Boolean(item));
      if (payload.length) {
        const { error } = await supabase.from('post_media').insert(payload);
        if (error) throw error;
      }
    } finally {
      setUploadingMedia(false);
    }
  };

  const handlePublish = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    setPublishError('');
    setSubmitting(true);
    const payload = `${title.trim()} ${content.trim()}`;
    const { data: aiData } = await supabase.functions.invoke('ai-moderation', { body: { text: payload } });
    const aiMood = aiData?.mood?.[0]?.mood as Mood | undefined;
    const aiSeverity = aiData?.toxicity?.severity as 'low' | 'medium' | 'high' | undefined;
    const crisis = aiData?.crisis as { isCrisis?: boolean; resources?: string[] } | undefined;
    if (aiMood && aiMood !== 'random') setMood(aiMood);
    if (crisis?.isCrisis) setCrisisResources(crisis.resources ?? []);
    if (aiSeverity === 'high' && !showHighSeverityConfirm) {
      setSubmitting(false);
      setPublishError('This post appears highly harmful. Please review before publishing.');
      return;
    }
    if ((aiSeverity === 'low' || aiSeverity === 'medium') && toxicityWarning && !showHighSeverityConfirm) {
      setSubmitting(false);
      setShowHighSeverityConfirm(true);
      setPublishError('Potentially harmful language detected. Click publish again to confirm.');
      return;
    }
    const request = editingPostId
      ? supabase.from('posts').update({ mood, title: title.trim(), content: content.trim() }).eq('id', editingPostId).select('id').maybeSingle()
      : supabase.from('posts').insert({ user_id: user.id, mood, title: title.trim(), content: content.trim() }).select('id').maybeSingle();
    const { data, error } = await request;
    setSubmitting(false);
    if (error) {
      setPublishError(error.message);
      return;
    }
    if (data?.id) {
      try {
        await uploadMedia(data.id);
      } catch (mediaError) {
        setPublishError(mediaError instanceof Error ? mediaError.message : 'Media upload failed.');
        setSubmitting(false);
        return;
      }
    }
    localStorage.removeItem(draftKey);
    if (data) navigate(`/post/${data.id}`, { replace: true });
  };

  const removeMedia = (index: number) => {
    setMedia(prev => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const maxContent = 2000;
  const maxTitle = 100;

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">New Post</h1>
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,.gif"
        multiple
        className="hidden"
        onChange={e => e.target.files && addFiles(e.target.files)}
      />

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">How are you feeling?</label>
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map(([key, config]) => (
              <button
                key={key}
                onClick={() => setMood(key)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  mood === key ? `${config.bg} ${config.color} ring-1 ring-current` : 'bg-surface-50 text-gray-400 hover:text-white hover:bg-surface-200/50'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
          {suggestedMood && suggestedMood !== mood && (
            <button
              onClick={() => setMood(suggestedMood)}
              className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary-50 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Suggested: {MOOD_CONFIG[suggestedMood].label}
            </button>
          )}
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDropActive(true); }}
          onDragLeave={() => setDropActive(false)}
          onDrop={e => {
            e.preventDefault();
            setDropActive(false);
            if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
          }}
          className={`rounded-xl border border-dashed p-4 transition-colors ${dropActive ? 'border-primary bg-primary/10' : 'border-white/10 bg-surface-50/40'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white font-medium">Media attachments</p>
              <p className="text-xs text-gray-500">Add images, GIFs, video, or voice notes.</p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-lg bg-surface text-white text-xs flex items-center gap-2"
            >
              <ImagePlus className="w-4 h-4" />
              Upload
            </button>
          </div>
          {media.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {media.map((item, index) => (
                <div key={item.previewUrl} className="relative rounded-xl overflow-hidden bg-black/30 border border-white/5">
                  {item.mediaType === 'video' ? (
                    <video src={item.previewUrl} controls className="w-full h-40 object-cover" />
                  ) : item.mediaType === 'voice' ? (
                    <div className="p-4">
                      <Upload className="w-5 h-5 text-primary mb-2" />
                      <p className="text-xs text-gray-300 break-all">{item.name}</p>
                      <audio src={item.previewUrl} controls className="w-full mt-2" />
                    </div>
                  ) : (
                    <img src={item.previewUrl} alt={item.name} className="w-full h-40 object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
          <input
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            maxLength={maxTitle}
            className="w-full bg-surface-50 rounded-lg px-4 py-3 text-white placeholder-gray-500 border border-white/5 focus:border-primary focus:outline-none transition-colors"
            placeholder="What's on your mind?"
          />
          <p className="text-xs text-gray-600 mt-1 text-right">{title.length}/{maxTitle}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Content</label>
          <textarea
            value={content}
            onChange={e => handleContentChange(e.target.value)}
            maxLength={maxContent}
            rows={8}
            className="w-full bg-surface-50 rounded-lg px-4 py-3 text-white placeholder-gray-500 border border-white/5 focus:border-primary focus:outline-none transition-colors resize-none"
            placeholder="Share your thoughts anonymously..."
          />
          <p className="text-xs text-gray-600 mt-1 text-right">{content.length}/{maxContent}</p>
        </div>

        {crisisResources.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Support resources</p>
              {crisisResources.map(line => <p key={line} className="text-xs text-gray-400">{line}</p>)}
            </div>
          </div>
        )}

        {toxicityWarning && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">Content Warning</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Your post may contain harmful or threatening language. Please reconsider your words before posting.
              </p>
            </div>
          </div>
        )}

        {publishError && (
          <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3">
            <p className="text-sm text-danger-50">{publishError}</p>
          </div>
        )}

        <button
          type="button"
          onClick={saveDraft}
          className="w-full py-3.5 bg-surface hover:bg-surface-50 rounded-xl text-white font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Draft
        </button>

        <button
          onClick={handlePublish}
          disabled={submitting || uploadingMedia || !title.trim() || !content.trim()}
          className="w-full py-3.5 bg-primary hover:bg-primary-200 disabled:opacity-40 disabled:hover:bg-primary rounded-xl text-white font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {uploadingMedia && <Loader2 className="w-4 h-4 animate-spin" />}
          {editingPostId ? 'Update Post' : 'Publish Anonymously'}
        </button>
      </div>
    </PageContainer>
  );
}
