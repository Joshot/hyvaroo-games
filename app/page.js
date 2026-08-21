'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/game/dashboard');
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center font-pixel animate-blink text-retro-accent">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-black">
      <div className="pixel-panel flex flex-col items-center p-12">
        <h1 className="text-4xl font-pixel mb-6 text-retro-info drop-shadow-md">The Endless Expanse</h1>
        <p className="mb-12 max-w-md text-xl">An infinite 8-bit RPG. Create your character and explore the endless procedural world.</p>
        
        <div className="flex gap-6">
          <Link href="/login" className="pixel-btn text-retro-success">
            Login
          </Link>
          <Link href="/register" className="pixel-btn text-retro-warning">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
