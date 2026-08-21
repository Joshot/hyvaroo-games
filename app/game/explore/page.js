'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCharacter, getAvailableAreas, travelToArea } from '@/lib/supabase/queries';
import { useRouter } from 'next/navigation';

export default function Explore() {
  const [character, setCharacter] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLog, setActionLog] = useState([]);
  const [isExploring, setIsExploring] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const charData = await getCharacter(session.user.id);
      if (charData) {
        setCharacter(charData);
        const areaData = await getAvailableAreas(charData.level);
        setAreas(areaData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleTravel = async (areaId) => {
    if (!character || character.current_area_id === areaId) return;
    const updated = await travelToArea(character.id, areaId);
    if (updated) {
      setCharacter(prev => ({...prev, current_area_id: areaId}));
      setActionLog(prev => [`Travelled to new area...`, ...prev]);
    }
  };

  const handleExplore = async () => {
    if (character.ap_current < 1) {
      setActionLog(prev => ["SYS.ERR: INSUFFICIENT AP", ...prev]);
      return;
    }

    setIsExploring(true);
    
    // Deduct AP
    const newAp = character.ap_current - 1;
    setCharacter(prev => ({...prev, ap_current: newAp}));
    await supabase.from('characters').update({ ap_current: newAp }).eq('id', character.id);

    // Roll random encounter
    const roll = Math.random() * 100;
    
    setTimeout(() => {
      if (roll <= 60) {
        // Combat
        setActionLog(prev => ["*RUSTLE*", "WILD MONSTER APPEARED!", ...prev]);
        setTimeout(() => {
          sessionStorage.setItem('pending_encounter', 'random');
          router.push('/game/combat');
        }, 1500);
      } else if (roll <= 80) {
        // Item found
        const goldFound = Math.floor(Math.random() * 5) + 1;
        supabase.from('characters').update({ gold: character.gold + goldFound }).eq('id', character.id);
        setCharacter(prev => ({...prev, gold: prev.gold + goldFound}));
        setActionLog(prev => [`FOUND ITEM: ${goldFound} GOLD`, ...prev]);
        setIsExploring(false);
      } else if (roll <= 95) {
        // Flavor text / netral event
        const expGained = 2;
        supabase.from('characters').update({ exp: character.exp + expGained }).eq('id', character.id);
        setCharacter(prev => ({...prev, exp: prev.exp + expGained}));
        setActionLog(prev => ["AREA CLEAR. +2 EXP.", ...prev]);
        setIsExploring(false);
      } else {
        // Special encounter
        setActionLog(prev => ["ANCIENT RUNE ACTIVATED! +5 AP", ...prev]);
        const buffedAp = newAp + 5;
        supabase.from('characters').update({ ap_current: buffedAp }).eq('id', character.id);
        setCharacter(prev => ({...prev, ap_current: buffedAp}));
        setIsExploring(false);
      }
    }, 800);
  };

  if (loading) return <div className="animate-blink font-pixel text-retro-accent">Loading map data...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      <div className="pixel-panel flex-1 flex flex-col">
        <h2 className="text-xl font-pixel text-retro-info mb-4 border-b-2 border-retro-border pb-2">WORLD MAP</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
           {areas.map(area => (
             <button 
               key={area.id}
               onClick={() => handleTravel(area.id)}
               className={`pixel-panel flex flex-col items-center justify-center p-4 min-h-[100px] cursor-pointer hover:border-retro-info transition-colors ${character?.current_area_id === area.id ? 'border-retro-success bg-[#1a2e1a]' : 'border-gray-700'}`}
             >
               <span className="text-2xl mb-2">{character?.current_area_id === area.id ? '📍' : '🗺️'}</span>
               <span className={`font-pixel text-xs text-center ${character?.current_area_id === area.id ? 'text-retro-success' : 'text-gray-400'}`}>
                 {area.name}
               </span>
               <span className="font-pixel text-[10px] text-gray-500 mt-1">LVL {area.min_level}-{area.max_level}</span>
             </button>
           ))}
        </div>
        
        <div className="mt-auto pt-4 border-t-2 border-retro-border flex items-center justify-between">
          <div className="font-pixel text-sm text-retro-info">
            AP: <span className="text-retro-success">{character?.ap_current}</span>
          </div>
          <button 
            onClick={handleExplore}
            disabled={isExploring || character?.ap_current < 1}
            className="pixel-btn bg-retro-info text-black border-retro-info hover:bg-white"
          >
            {isExploring ? 'SEARCHING...' : 'EXPLORE AREA (1 AP)'}
          </button>
        </div>
      </div>
      
      <div className="pixel-panel flex-1 flex flex-col bg-[#050505]">
        <h3 className="font-pixel text-sm text-retro-warning border-b-2 border-gray-800 pb-2 mb-4">COMBAT LOG</h3>
        <div className="flex-1 overflow-y-auto space-y-2 max-h-96 font-vt323 text-xl">
          {actionLog.map((log, idx) => (
            <div key={idx} className="text-retro-success animate-fade-in opacity-0" style={{ animation: 'fadeIn 0.2s ease-in forwards' }}>
              {'> ' + log}
            </div>
          ))}
          {actionLog.length === 0 && <div className="text-gray-600 animate-blink">&gt; WAITING FOR INPUT...</div>}
        </div>
      </div>
    </div>
  );
}
