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
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 p-8 text-center font-mono">
      <h1 className="text-4xl font-bold mb-4">The Endless Expanse</h1>
      <p className="mb-8 max-w-md">An infinite text-based RPG. Create your character and explore the endless procedural world.</p>
      
      <div className="flex gap-4">
        <Link href="/login" className="px-6 py-2 border-2 border-gray-900 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors">
          Login
        </Link>
        <Link href="/register" className="px-6 py-2 border-2 border-gray-900 bg-white text-gray-900 font-bold hover:bg-gray-100 transition-colors">
          Register
        </Link>
      </div>
    </div>
  );
}
