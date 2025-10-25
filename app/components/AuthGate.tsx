'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(() => setReady(true));
  }, []);
  if (!ready) return <div style={{ padding: 24 }}>Loading…</div>;
  return <>{children}</>;
}
