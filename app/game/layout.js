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
    return <div className="flex min-h-screen items-center justify-center font-pixel animate-blink text-retro-accent">Loading realm...</div>;
  }

  return (
    <div className="flex flex-col min-h-full max-w-5xl mx-auto">
      {/* Game Header */}
      <header className="pixel-panel mb-6 flex justify-between items-end border-b-4 border-retro-border">
        <div>
          <h1 className="text-2xl font-pixel text-retro-info drop-shadow-md">The Endless Expanse</h1>
          <nav className="flex gap-4 mt-4 text-sm font-pixel">
            <Link href="/game/dashboard" className="hover:text-retro-accent hover:translate-y-[2px] transition-transform">Dashboard</Link>
            <Link href="/game/explore" className="hover:text-retro-accent hover:translate-y-[2px] transition-transform">Map</Link>
            <Link href="/game/inventory" className="hover:text-retro-accent hover:translate-y-[2px] transition-transform">Inventory</Link>
            <Link href="/game/quests" className="hover:text-retro-accent hover:translate-y-[2px] transition-transform">Quests</Link>
            <Link href="/game/shop" className="hover:text-retro-accent hover:translate-y-[2px] transition-transform">Shop</Link>
          </nav>
        </div>
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/');
          }}
          className="pixel-btn text-retro-warning text-xs"
        >
          Logout
        </button>
      </header>
      
      {/* Game Content */}
      <main className="flex-1 pixel-panel">
        {children}
      </main>
    </div>
  );
}
