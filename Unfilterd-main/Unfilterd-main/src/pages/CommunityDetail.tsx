import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Community, Post } from '../types';
import { PageContainer, LoadingSpinner, EmptyState } from '../components/Layout';
import { PostCard } from '../components/PostCard';
import { Avatar } from '../components/Avatar';
import { ArrowLeft, Shield, Users, Pin, BookOpen } from 'lucide-react';

type CommunityTab = 'home' | 'about' | 'members' | 'rules';

export function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<CommunityTab>('home');
  const [members, setMembers] = useState<Array<{ id: string; username: string; avatar_seed: string }>>([]);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      const [communityRes, postsRes, memberRes, membershipRes] = await Promise.all([
        supabase.from('communities').select('*, profiles(username, avatar_seed)').eq('id', id).maybeSingle(),
        supabase.from('community_posts').select('post_id, pinned, posts(*, profiles(username, avatar_seed), post_media(*))').eq('community_id', id).eq('approved', true).order('pinned', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('community_memberships').select('profiles(id, username, avatar_seed)').eq('community_id', id).limit(50),
        user ? supabase.from('community_memberships').select('id').eq('community_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setCommunity((communityRes.data ?? null) as Community | null);
      setPosts(
        ((postsRes.data ?? []) as Array<{ posts: Post[] | Post | null }>).flatMap(row => Array.isArray(row.posts) ? row.posts.slice(0, 1) : row.posts ? [row.posts] : [])
      );
      setMembers(
        ((memberRes.data ?? []) as Array<{ profiles: { id: string; username: string; avatar_seed: string }[] | { id: string; username: string; avatar_seed: string } | null }>)
          .flatMap(row => Array.isArray(row.profiles) ? row.profiles.slice(0, 1) : row.profiles ? [row.profiles] : [])
      );
      if (communityRes.data) {
        setCommunity({ ...(communityRes.data as Community), is_member: !!membershipRes.data });
      }
      setLoading(false);
    };
    run();
  }, [id, user]);

  const toggleMembership = async () => {
    if (!user || !community) return;
    const next = !community.is_member;
    setCommunity({ ...community, is_member: next });
    const { error } = community.is_member
      ? await supabase.from('community_memberships').delete().eq('community_id', community.id).eq('user_id', user.id)
      : await supabase.from('community_memberships').insert({ community_id: community.id, user_id: user.id });
    if (error) setCommunity({ ...community, is_member: community.is_member });
  };

  if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;
  if (!community) return <PageContainer><EmptyState icon={Shield} title="Community not found" description="It may have been deleted." /></PageContainer>;

  return (
    <PageContainer>
      <Link to="/communities" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Communities
      </Link>

      <div className="bg-surface rounded-2xl overflow-hidden mb-4">
        <div className="h-28 bg-gradient-to-r from-primary/30 via-secondary/20 to-warning/20" />
        <div className="p-5 -mt-10">
          <div className="flex items-end gap-4">
            <Avatar seed={community.avatar_url || community.slug} size="xl" className="ring-4 ring-[#0F172A]" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{community.name}</h1>
              <p className="text-sm text-gray-400 mt-1">{community.description || 'No description yet.'}</p>
            </div>
            {user && (
              <button onClick={toggleMembership} className={`px-4 py-2 rounded-lg text-sm font-medium ${community.is_member ? 'bg-surface-50 text-gray-300' : 'bg-primary text-white'}`}>
                {community.is_member ? 'Leave' : 'Join'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-5 text-sm">
            <div className="bg-surface-50 rounded-xl p-3 text-center">
              <p className="text-white font-semibold">{community.member_count}</p>
              <p className="text-gray-500">Members</p>
            </div>
            <div className="bg-surface-50 rounded-xl p-3 text-center">
              <p className="text-white font-semibold">{community.is_private ? 'Private' : 'Public'}</p>
              <p className="text-gray-500">Visibility</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['home', 'about', 'members', 'rules'] as const).map(key => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === key ? 'bg-primary text-white' : 'bg-surface-50 text-gray-400'}`}>
            {key}
          </button>
        ))}
      </div>

      {tab === 'home' && (
        <div className="space-y-4">
          {posts.length === 0 ? <EmptyState icon={BookOpen} title="No posts yet" description="Community posts will appear here." /> : posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
      {tab === 'about' && (
        <div className="bg-surface rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-white font-medium"><Users className="w-4 h-4 text-primary" /> About</div>
          <p className="text-sm text-gray-400">{community.description || 'No description yet.'}</p>
          <p className="text-xs text-gray-500">Created by {community.profiles?.username ?? 'Anonymous'} on {new Date(community.created_at).toLocaleDateString()}</p>
        </div>
      )}
      {tab === 'members' && (
        <div className="space-y-2">
          {members.map(member => (
            <Link key={member.id} to={`/profile/${member.id}`} className="flex items-center gap-3 p-4 bg-surface rounded-xl">
              <Avatar seed={member.avatar_seed} size="md" />
              <span className="text-white text-sm">{member.username}</span>
            </Link>
          ))}
        </div>
      )}
      {tab === 'rules' && (
        <div className="bg-surface rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-white font-medium"><Pin className="w-4 h-4 text-secondary" /> Rules</div>
          <ul className="space-y-2">
            {(community.rules ?? []).map((rule, index) => (
              <li key={rule} className="text-sm text-gray-400 flex gap-2">
                <span className="text-primary">{index + 1}.</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageContainer>
  );
}
