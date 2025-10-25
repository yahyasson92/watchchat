'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import MessageInput from '@/app/components/MessageInput';

export default function Room({ params }: { params: { contentId: string; mode: 'global'|'followers' }}) {
  const { contentId, mode } = params;
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    let channel: any;

    async function init() {
      // who am I
      const userRes = await supabase.auth.getUser();
      setMe(userRes.data.user ?? null);

      // find the room for contentId + mode
      const { data: r, error: re } = await supabase
        .from('app.rooms')
        .select('*')
        .eq('content_id', contentId)
        .eq('mode', mode)
        .single();
      if (re || !r) return alert('Room not found');
      setRoom(r);

      // pre-load last 100
      const { data: ms } = await supabase
        .from('app.messages')
        .select('*')
        .eq('room_id', r.id)
        .order('created_at', { ascending: true })
        .limit(100);
      setMessages(ms || []);

      // subscribe to realtime inserts
      channel = supabase
        .channel(`room:${r.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'app.messages', filter: `room_id=eq.${r.id}` },
          (payload: any) => setMessages(prev => [...prev, payload.new])
        )
        .subscribe();

      // load who I follow (client-side filter for followers mode)
      if (mode === 'followers' && userRes.data.user) {
        const { data: f } = await supabase
          .from('app.follows')
          .select('target_user_id')
          .eq('user_id', userRes.data.user.id);
        setFollowingIds((f || []).map(x => x.target_user_id));
      }
    }

    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [contentId, mode]);

  const visible = mode === 'global'
    ? messages
    : messages.filter(m => followingIds.includes(m.user_id));

  return (
    <main style={{ padding: 16 }}>
      <h2>{contentId} — {mode}</h2>
      {!me && <p>Tip: go back and sign in to post.</p>}
      <div style={{ border: '1px solid #ddd', borderRadius: 8, height: 420, overflowY: 'auto', padding: 8 }}>
        {visible.map(m => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <b>{m.user_id?.slice(0,8)}</b>: {m.spoiler ? <i>(spoiler)</i> : null} {m.body}
          </div>
        ))}
        {!visible.length && <div>No messages yet. Say hi!</div>}
      </div>
      {room && <MessageInput roomId={room.id} />}
    </main>
  );
}
