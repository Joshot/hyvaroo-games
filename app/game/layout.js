'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function GameLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setSession(session);
      
      // Check if user has a character
      const { data: character } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
        
      if (!character) {
        // If they are not already on the character creation page
        if (!window.location.pathname.includes('/character/create')) {
           router.push('/character/create');
           return;
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading realm...</div>;
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Game Header */}
      <header className="border-b-2 border-gray-900 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">The Endless Expanse</h1>
          <nav className="flex gap-4 mt-2 text-sm font-bold">
            <Link href="/game/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/game/inventory" className="hover:underline">Inventory</Link>
            <Link href="/game/quests" className="hover:underline">Quests</Link>
            <Link href="/game/shop" className="hover:underline">Shop</Link>
          </nav>
        </div>
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/');
          }}
          className="text-sm underline hover:text-gray-600"
        >
          Logout
        </button>
      </header>
      
      {/* Game Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
