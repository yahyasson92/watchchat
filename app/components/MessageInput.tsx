'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
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
    setTimeout(() => setCooldown(false), 1000); // client cooldown 1s

    const cleaned = filter.clean(text).slice(0, 700);
    const res = await fetch('/api/rate-limit', { method: 'POST' }); // hits middleware
    if (res.status === 429) return alert('Slow down a bit 🙂');

    const { error } = await supabase.from('app.messages').insert({ room_id: roomId, body: cleaned, spoiler });
    if (error) alert(error.message);
    setText('');
  }

  return (
    <div style={{ marginTop: 8 }}>
      <input
        value={text}
        onChange={e=>setText(e.target.value)}
        placeholder="Type a message…"
        style={{ width: '70%' }}
      />
      <label style={{ marginLeft: 8 }}>
        <input type="checkbox" checked={spoiler} onChange={e=>setSpoiler(e.target.checked)} /> Spoiler
      </label>
      <button onClick={send} style={{ marginLeft: 8 }} disabled={cooldown}>Send</button>
    </div>
  );
}
