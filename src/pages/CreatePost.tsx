import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Mood } from '../types';
import { MOOD_CONFIG } from '../types';
import { PageContainer } from '../components/Layout';
import { Loader2, X, Sparkles, Save, ShieldAlert, ImagePlus, Upload, Trash2, HeartHandshake } from 'lucide-react';
import { analyzeVibe, VIBE_TAGS, VIBE_TAG_LABELS, type VibeAnalysis, type VibeTag } from '../lib/vibe';
import { CHECKIN_EVENT } from '../components/vibe/CheckInHost';
import type { MediaType } from '../types';

const MOODS = Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][];

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
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vibe, setVibe] = useState<VibeAnalysis | null>(null);
  const [vibeText, setVibeText] = useState('');
  const [vibeTags, setVibeTags] = useState<VibeTag[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [wantsMatch, setWantsMatch] = useState(true);
  const [showAllTags, setShowAllTags] = useState(false);
  const [mood, setMood] = useState<Mood>('random');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  const currentText = `${title.trim()} ${content.trim()}`.trim();

  const readVibe = async (): Promise<VibeAnalysis> => {
    if (vibe && vibeText === currentText) return vibe;
    setAnalyzing(true);
    const result = await analyzeVibe(currentText);
    setAnalyzing(false);
    setVibe(result);
    setVibeText(currentText);
    setVibeTags(result.vibe_tags);
    if (result.mood !== 'random') setMood(result.mood);
    setCrisisResources(result.crisis_resources);
    return result;
  };

  const toggleTag = (tag: VibeTag) => {
    setVibeTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag].slice(0, 5));
  };

  const handlePublish = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    setPublishError('');
    setSubmitting(true);
    const analysis = await readVibe();
    const aiSeverity = analysis.toxicity.isToxic ? analysis.toxicity.severity : undefined;
    // Removed chips stay removed (an empty list is a valid choice); the DB falls back to mood for matching.
    const chipsReviewed = Boolean(vibe) && vibeText === currentText;
    const tags = chipsReviewed ? vibeTags : analysis.vibe_tags;
    const finalMood = mood === 'random' && analysis.mood !== 'random' ? analysis.mood : mood;
    const matchRequested = wantsMatch && !analysis.is_crisis && profile?.open_to_matching !== false;
    const vibeFields = {
      vibe_tags: tags,
      vibe_intensity: analysis.intensity,
      is_crisis: analysis.is_crisis,
      risk_level: analysis.risk,
      toxicity_severity: aiSeverity ?? 'none',
      wants_match: matchRequested,
    };
    if (aiSeverity === 'high' && !showHighSeverityConfirm) {
      setSubmitting(false);
      setShowHighSeverityConfirm(true);
      setPublishError('This reads like it targets someone. If you publish, it stays hidden until a moderator reviews it. Edit it, or press publish again to send it for review.');
      return;
    }
    const request = editingPostId
      ? supabase.from('posts').update({ mood: finalMood, title: title.trim(), content: content.trim(), ...vibeFields }).eq('id', editingPostId).select('id').maybeSingle()
      : supabase.from('posts').insert({ user_id: user.id, mood: finalMood, title: title.trim(), content: content.trim(), ...vibeFields }).select('id').maybeSingle();
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
    if (!data) return;
    if (vibe && chipsReviewed && !editingPostId) {
      const removed = vibe.vibe_tags.filter(tag => !tags.includes(tag));
      const added = tags.filter(tag => !vibe.vibe_tags.includes(tag));
      if (removed.length || added.length) {
        // anonymous: no user id, no post text
        void supabase.from('vibe_feedback').insert({
          predicted_tags: vibe.vibe_tags,
          corrected_tags: tags,
          lang_style: analysis.lang_style,
          length_bucket: currentText.length < 80 ? 'short' : currentText.length < 300 ? 'medium' : 'long',
        });
      }
    }
    if (analysis.risk !== 'none' && !editingPostId) {
      await supabase.from('vibe_checkins').update({ lang_style: analysis.lang_style }).eq('post_id', data.id);
      window.dispatchEvent(new Event(CHECKIN_EVENT));
      navigate(`/post/${data.id}`, { replace: true });
      return;
    }
    if (matchRequested && !editingPostId) {
      navigate(`/matches?find=${data.id}`, { replace: true });
    } else {
      navigate(`/post/${data.id}`, { replace: true });
    }
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

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> Your vibe
              </p>
              <p className="text-xs text-gray-400">
                {vibe ? `Intensity ${vibe.intensity}/100${vibe.source === 'local' ? ' · quick read' : ''}` : 'Let AI read the feeling in your post, then adjust the tags.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { void readVibe(); }}
              disabled={analyzing || !currentText}
              className="px-3 py-2 rounded-lg bg-primary/20 text-primary-50 text-xs font-medium flex items-center gap-1.5 disabled:opacity-40"
            >
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {vibe && vibeText === currentText ? 'Read again' : 'Read my vibe'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(showAllTags ? [...VIBE_TAGS] : Array.from(new Set([...vibeTags, ...VIBE_TAGS.slice(0, 8)]))).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={vibeTags.includes(tag)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  vibeTags.includes(tag) ? 'bg-primary text-white' : 'bg-surface-50 text-gray-400 hover:text-white'
                }`}
              >
                #{VIBE_TAG_LABELS[tag]}
              </button>
            ))}
            <button type="button" onClick={() => setShowAllTags(v => !v)} className="px-2 py-1 text-xs text-primary-50">
              {showAllTags ? 'Fewer' : 'More tags'}
            </button>
          </div>

          {!editingPostId && (
            vibe?.is_crisis ? (
              <p className="text-xs text-gray-400">
                We won't pair this post with a stranger. Please reach out to one of the support lines below. You matter.
              </p>
            ) : profile?.open_to_matching === false ? (
              <p className="text-xs text-gray-500">Vibe matching is off in your profile settings.</p>
            ) : (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsMatch}
                  onChange={e => setWantsMatch(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  <span className="text-sm text-white flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-secondary" /> Match me with someone who feels this too
                  </span>
                  <span className="block text-xs text-gray-500">
                    They get an anonymous request. If they say yes, you both get a private chat. No names or profiles are shared.
                  </span>
                </span>
              </label>
            )
          )}
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
