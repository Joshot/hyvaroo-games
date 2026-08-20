'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Explore() {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLog, setActionLog] = useState([]);
  const [isExploring, setIsExploring] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchChar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('characters').select('*').eq('user_id', session.user.id).single();
      setCharacter(data);
      setLoading(false);
    };
    fetchChar();
  }, []);

  const handleExplore = async () => {
    if (character.ap_current < 1) {
      setActionLog(prev => ["You are too exhausted to explore further. Rest and wait for your AP to recover.", ...prev]);
      return;
    }

    setIsExploring(true);
    
    // Deduct AP
    const newAp = character.ap_current - 1;
    setCharacter(prev => ({...prev, ap_current: newAp}));
    
    await supabase.from('characters').update({ ap_current: newAp }).eq('id', character.id);

    // Roll random encounter
    // 60% combat, 20% item, 15% text, 5% special
    const roll = Math.random() * 100;
    
    setTimeout(() => {
      if (roll <= 60) {
        // Combat
        setActionLog(prev => ["You hear a rustling in the bushes...", "A monster jumps out!", ...prev]);
        setTimeout(() => {
          // Redirect to combat page with a mock or random monster ID for now
          // We will pass the monster encounter via query params or session storage
          sessionStorage.setItem('pending_encounter', 'random');
          router.push('/game/combat');
        }, 1500);
      } else if (roll <= 80) {
        // Item found
        const goldFound = Math.floor(Math.random() * 5) + 1;
        supabase.from('characters').update({ gold: character.gold + goldFound }).eq('id', character.id);
        setCharacter(prev => ({...prev, gold: prev.gold + goldFound}));
        setActionLog(prev => [`You found a small pouch on the ground containing ${goldFound} gold.`, ...prev]);
        setIsExploring(false);
      } else if (roll <= 95) {
        // Flavor text / netral event
        const expGained = 2;
        supabase.from('characters').update({ exp: character.exp + expGained }).eq('id', character.id);
        setCharacter(prev => ({...prev, exp: prev.exp + expGained}));
        setActionLog(prev => ["You wander through the area. It is quiet. You gain 2 EXP.", ...prev]);
        setIsExploring(false);
      } else {
        // Special encounter
        setActionLog(prev => ["You discover an ancient, glowing rune. It fills you with vigor! (+5 AP)", ...prev]);
        const buffedAp = newAp + 5;
        supabase.from('characters').update({ ap_current: buffedAp }).eq('id', character.id);
        setCharacter(prev => ({...prev, ap_current: buffedAp}));
        setIsExploring(false);
      }
    }, 800);
  };

  if (loading) return <div>Scouting the area...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 border-2 border-gray-900 bg-white p-6">
        <h2 className="text-2xl font-bold mb-4">Exploration</h2>
        <p className="mb-4 text-gray-600">You stand at the edge of the known world. What lies beyond?</p>
        
        <div className="mb-4 text-lg font-bold text-blue-600">AP: {character?.ap_current}</div>
        
        <button 
          onClick={handleExplore}
          disabled={isExploring || character?.ap_current < 1}
          className="w-full py-4 bg-gray-900 text-white font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isExploring ? 'Exploring...' : 'Take a Step (Cost: 1 AP)'}
        </button>
      </div>
      
      <div className="flex-1 border-2 border-gray-900 bg-gray-50 p-6 flex flex-col">
        <h3 className="font-bold border-b border-gray-300 pb-2 mb-4">Adventure Log</h3>
        <div className="flex-1 overflow-y-auto space-y-2 max-h-96">
          {actionLog.map((log, idx) => (
            <div key={idx} className="text-sm text-gray-800 animate-fade-in opacity-0" style={{ animation: 'fadeIn 0.5s ease-in forwards' }}>
              {'> ' + log}
            </div>
          ))}
          {actionLog.length === 0 && <div className="text-sm text-gray-400 italic">The log is empty. Take a step to begin.</div>}
        </div>
      </div>
    </div>
  );
}
