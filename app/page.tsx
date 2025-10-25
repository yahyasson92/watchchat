 'use client';
- import { supabase } from '@/lib/supabaseClient';
+ import { supabase } from '../lib/supabaseClient';
 import ContentPicker from './components/ContentPicker';

 export default function Home() {
   async function signIn() {
     const email = prompt('Enter your email for a magic sign-in link:');
     if (email) {
       const { error } = await supabase.auth.signInWithOtp({ email });
       if (error) alert(error.message);
       else alert('Check your email for a sign-in link.');
     }
   }

   async function signOut() {
     await supabase.auth.signOut();
     location.reload();
   }

   return (
     <main style={{ padding: 24 }}>
       <h1>WatchChat Prototype</h1>
       <p>Sign in (email magic link), create content, join a room, and chat.</p>
       <div style={{ marginBottom: 12 }}>
         <button onClick={signIn}>Sign in via Email</button>
         <button onClick={signOut} style={{ marginLeft: 8 }}>Sign out</button>
       </div>
       <ContentPicker />
     </main>
   );
 }
