 'use client';
- import { supabase } from '@/lib/supabaseClient';
+ import { supabase } from '../../lib/supabaseClient';
 import Link from 'next/link';
 import { useEffect, useState } from 'react';

 export default function ContentPicker() {
   const [items, setItems] = useState<any[]>([]);
   const [title, setTitle] = useState('');

   async function load() {
     const { data } = await supabase
       .from('app.content')
       .select('*')
       .order('created_at', { ascending: false })
       .limit(20);
     setItems(data || []);
   }

   useEffect(() => { load(); }, []);

   async function createContent() {
     const id = (title || '').toLowerCase().replace(/\W+/g, '_').slice(0, 60);
     const { data: { user } } = await supabase.auth.getUser();
     if (!id || !user) return alert('Enter a title and sign in first');

     const insert = await supabase.from('app.content').insert({
       id, type: 'game', title, created_by: user.id
     });
     if (insert.error) return alert(insert.error.message);

     await supabase.from('app.rooms').insert([
       { content_id: id, mode: 'global' },
       { content_id: id, mode: 'followers' }
     ]);

     setTitle('');
     load();
   }

   return (
     <div style={{ marginTop: 24 }}>
       <h3>Create or pick content</h3>
       <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="E.g., Lakers vs Celtics - Oct 25" />
       <button onClick={createContent} style={{ marginLeft: 8 }}>Create</button>
       <ul style={{ marginTop: 12 }}>
         {items.map(it => (
           <li key={it.id} style={{ marginTop: 8 }}>
             {it.title} — <code>{it.id}</code> &nbsp;
             <Link href={`/room/${it.id}/global`}>Join Global</Link> &nbsp;|&nbsp;
             <Link href={`/room/${it.id}/followers`}>Join Followers</Link>
           </li>
         ))}
       </ul>
     </div>
   );
 }
