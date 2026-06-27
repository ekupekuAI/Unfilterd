import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Community, Post } from '../types';
import { PageContainer, LoadingSpinner, EmptyState } from '../components/Layout';
import { Avatar } from '../components/Avatar';
import { Modal } from '../components/Modal';
import { Plus, Users, Shield, MessageSquare } from 'lucide-react';

export function CommunitiesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('Be respectful\nNo spam');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const [communityRes, postsRes, membershipsRes] = await Promise.all([
        supabase.from('communities').select('*, profiles(username, avatar_seed)').order('member_count', { ascending: false }).limit(12),
        supabase.from('community_posts').select('post_id, posts(*, profiles(username, avatar_seed), post_media(*))').eq('approved', true).order('created_at', { ascending: false }).limit(8),
        user ? supabase.from('community_memberships').select('community_id').eq('user_id', user.id) : Promise.resolve({ data: [] as Array<{ community_id: string }> }),
      ]);
      const memberIds = new Set(((membershipsRes.data ?? []) as Array<{ community_id: string }>).map(row => row.community_id));
      setCommunities((communityRes.data ?? []).map((row: Community) => ({ ...row, is_member: memberIds.has(row.id) })));
      setFeaturedPosts(
        ((postsRes.data ?? []) as Array<{ posts: Post[] | Post | null }>).flatMap(row => Array.isArray(row.posts) ? row.posts.slice(0, 1) : row.posts ? [row.posts] : [])
      );
      setLoading(false);
    };
    run();
  }, [user]);

  const createCommunity = async () => {
    if (!user || !name.trim()) return;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const { data, error } = await supabase.from('communities').insert({
      slug,
      name: name.trim(),
      description: description.trim(),
      creator_id: user.id,
      rules: rules.split('\n').map(line => line.trim()).filter(Boolean),
    }).select('*').maybeSingle();
    if (!error && data) {
      await supabase.from('community_memberships').insert({ community_id: data.id, user_id: user.id, role: 'owner' });
      setCreateOpen(false);
      setName('');
      setDescription('');
      setRules('Be respectful\nNo spam');
    }
  };

  const toggleMembership = async (community: Community) => {
    if (!user) return;
    const next = !community.is_member;
    setCommunities(prev => prev.map(item => item.id === community.id ? { ...item, is_member: next } : item));
    const { error } = community.is_member
      ? await supabase.from('community_memberships').delete().eq('community_id', community.id).eq('user_id', user.id)
      : await supabase.from('community_memberships').insert({ community_id: community.id, user_id: user.id });
    if (error) {
      setCommunities(prev => prev.map(item => item.id === community.id ? { ...item, is_member: community.is_member } : item));
    }
  };

  if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Communities</h1>
          <p className="text-sm text-gray-400 mt-1">Create spaces, join discussions, and moderate local feeds.</p>
        </div>
        {user && (
          <button onClick={() => setCreateOpen(true)} className="px-3 py-2 rounded-lg bg-primary text-white text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create
          </button>
        )}
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-medium"><Users className="w-4 h-4 text-primary" /> Popular communities</div>
          {communities.length === 0 ? (
            <EmptyState icon={Shield} title="No communities yet" description="Create the first community to get started." />
          ) : (
            <div className="grid gap-3">
              {communities.map(community => (
                <div key={community.id} className="bg-surface rounded-2xl p-4 flex items-center gap-3">
                  <Link to={`/communities/${community.id}`}>
                    <Avatar seed={community.avatar_url || community.slug} size="md" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/communities/${community.id}`} className="block text-white font-medium truncate">{community.name}</Link>
                    <p className="text-xs text-gray-500 line-clamp-1">{community.description || 'No description yet.'}</p>
                    <p className="text-[11px] text-gray-600 mt-1">{community.member_count} members</p>
                  </div>
                  <button onClick={() => toggleMembership(community)} className={`px-3 py-2 rounded-lg text-xs font-medium ${community.is_member ? 'bg-surface-50 text-gray-300' : 'bg-primary text-white'}`}>
                    {community.is_member ? 'Leave' : 'Join'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-medium"><MessageSquare className="w-4 h-4 text-secondary" /> Community feed</div>
          <div className="space-y-4">
            {featuredPosts.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No community posts yet" description="Joined communities can pin and surface posts here." />
            ) : (
              featuredPosts.map(post => <div key={post.id} className="rounded-2xl"><Link to={`/post/${post.id}`} className="text-primary text-sm">Open post</Link></div>)
            )}
          </div>
        </section>
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create community" size="sm">
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Community name" className="w-full bg-surface-50 rounded-lg px-4 py-3 text-white border border-white/5" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full bg-surface-50 rounded-lg px-4 py-3 text-white border border-white/5 resize-none h-24" />
          <textarea value={rules} onChange={e => setRules(e.target.value)} placeholder="Rules, one per line" className="w-full bg-surface-50 rounded-lg px-4 py-3 text-white border border-white/5 resize-none h-28" />
          <button onClick={createCommunity} className="w-full py-2.5 bg-primary rounded-lg text-white text-sm font-medium">Create</button>
        </div>
      </Modal>
    </PageContainer>
  );
}
