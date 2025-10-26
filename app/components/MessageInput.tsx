'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Filter from 'bad-words';

const filter = new (Filter as any)();

export default function MessageInput({ roomId }: { roomId: string }) {
  const [text, setText] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  async function send() {
    if (!text.trim()) return;
    if (cooldown) return;

    setCooldown(true);
    setTimeout(() => setCooldown(false), 1000); // 1s client cooldown

    const cleaned = filter.clean(text).slice(0, 700);

    // Ensure we are signed in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in first (use the email magic link).');
      return;
    }

    // Hit our dummy API so the Edge Middleware can rate-limit
    const res = await fetch('/api/rate-limit', { method: 'POST' });
    if (res.status === 429) {
      alert('Rate limit: try again in a moment');
      return;
    }

    // IMPORTANT: include user_id so RLS with check (user_id = auth.uid()) passes
    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      user_id: user.id,
      body: cleaned,
      spoiler,
    });

    if (error) {
      alert(error.message);
      return;
    }
    setText('');
  }

  return (
    <div style={{ marginTop: 8 }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message…"
        style={{ width: '70%' }}
      />
      <label style={{ marginLeft: 8 }}>
        <input
          type="checkbox"
          checked={spoiler}
          onChange={(e) => setSpoiler(e.target.checked)}
        />{' '}
        Spoiler
      </label>
      <button onClick={send} style={{ marginLeft: 8 }} disabled={cooldown}>
        Send
      </button>
    </div>
  );
}
