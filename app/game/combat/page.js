'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { resolveCombat } from '@/lib/game-logic/combatEngine';

export default function Combat() {
  const [character, setCharacter] = useState(null);
  const [monster, setMonster] = useState(null);
  const [combatResult, setCombatResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [displayedLog, setDisplayedLog] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const initCombat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: char } = await supabase.from('characters').select('*').eq('user_id', session.user.id).single();
      
      // Look for a monster, or use a fallback
      let encounterMonster = null;
      const { data: monsters } = await supabase.from('monsters').select('*').limit(1);
      
      if (monsters && monsters.length > 0) {
        encounterMonster = monsters[Math.floor(Math.random() * monsters.length)];
      } else {
        // Fallback mock monster if DB is empty
        encounterMonster = {
          id: 'mock-1',
          name: 'Rabid Wolf',
          base_hp: 30,
          base_attack: 8,
          base_defense: 2,
          exp_reward: 15,
          gold_reward_min: 5,
          gold_reward_max: 15,
          grace: 8,
          flavor_description: 'It snarls aggressively.'
        };
      }
      
      setCharacter(char);
      setMonster(encounterMonster);
      
      // Resolve combat instantly behind the scenes
      const result = resolveCombat(char, encounterMonster);
      setCombatResult(result);
      setLoading(false);
      
      // Clear pending encounter flag
      sessionStorage.removeItem('pending_encounter');
      
      // Update DB with results
      if (result.winner === 'player') {
        await supabase.from('characters').update({
          current_hp: result.finalPlayerHP,
          exp: char.exp + result.exp,
          gold: char.gold + result.gold
        }).eq('id', char.id);
        // Note: Realistically, level up check should happen here
      } else {
        await supabase.from('characters').update({
          current_hp: result.finalPlayerHP
        }).eq('id', char.id);
      }
      
      // Log it to combat history in background
      await supabase.from('combat_log').insert([{
        character_id: char.id,
        monster_id: encounterMonster.id || null, // null if mock
        result: result.winner === 'player' ? 'victory' : 'defeat',
        exp_gained: result.exp,
        gold_gained: result.gold,
        full_log_text: result.log.join('\n')
      }]);
    };
    
    initCombat();
  }, []);

  // Reveal log turn by turn
  useEffect(() => {
    if (combatResult && currentTurnIdx < combatResult.log.length) {
      const timer = setTimeout(() => {
        setDisplayedLog(prev => [...prev, combatResult.log[currentTurnIdx]]);
        setCurrentTurnIdx(prev => prev + 1);
      }, 500); // 500ms between lines
      return () => clearTimeout(timer);
    }
  }, [combatResult, currentTurnIdx]);

  if (loading) return <div className="animate-blink font-pixel text-retro-accent">ENTERING BATTLE...</div>;

  const isCombatOver = currentTurnIdx >= combatResult?.log.length;

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* Top half: Battle Scene */}
      <div className="flex-1 flex gap-4 min-h-[300px]">
         <div className="pixel-panel flex-1 flex flex-col justify-end items-start border-retro-info relative overflow-hidden bg-[#0a150a]">
            {/* Player Avatar */}
            <div className="text-8xl relative z-10 bottom-4 left-4 drop-shadow-md">👾</div>
            <div className="absolute top-4 left-4 pixel-panel bg-black/80 border-gray-600 p-2 min-w-[150px]">
               <div className="font-pixel text-sm text-retro-info mb-1">{character?.name}</div>
               <div className="font-pixel text-xs text-retro-accent">HP: {combatResult?.finalPlayerHP}</div>
            </div>
         </div>
         
         <div className="pixel-panel flex-1 flex flex-col justify-end items-end border-retro-accent relative overflow-hidden bg-[#150a0a]">
            {/* Monster Avatar */}
            <div className="text-8xl relative z-10 bottom-4 right-4 animate-pulse drop-shadow-md">🐺</div>
            <div className="absolute top-4 right-4 pixel-panel bg-black/80 border-gray-600 p-2 min-w-[150px] text-right">
               <div className="font-pixel text-sm text-retro-accent mb-1">{monster?.name}</div>
               <div className="font-pixel text-xs text-white">DANGER: HIGH</div>
            </div>
         </div>
      </div>

      {/* Bottom half: Combat Log */}
      <div className="pixel-panel flex-1 bg-[#050505] text-retro-success p-6 font-vt323 text-xl h-[300px] overflow-y-auto flex flex-col relative border-t-8 border-retro-border">
        <h2 className="text-2xl font-pixel text-white border-b-2 border-gray-700 pb-2 mb-4 drop-shadow-md">BATTLE LOG</h2>
        
        <div className="flex-1 space-y-2">
          {displayedLog.map((line, idx) => (
            <div key={idx} className={`animate-fade-in ${line.includes('CRITICAL HIT') ? 'text-retro-accent font-bold drop-shadow-[0_0_2px_rgba(255,0,0,0.8)]' : ''} ${line.includes('HASIL:') ? 'text-retro-warning mt-4' : ''}`}>
              {line}
            </div>
          ))}
          {!isCombatOver && (
            <div className="animate-blink mt-2">&gt; ...</div>
          )}
        </div>
        
        {isCombatOver && (
          <div className="mt-8 border-t-2 border-gray-700 pt-4 flex gap-4 absolute bottom-6 right-6">
            <button 
              onClick={() => router.push('/game/explore')}
              className="pixel-btn bg-retro-info text-black border-retro-info hover:bg-white text-xs"
            >
              &gt; CONTINUE &lt;
            </button>
            <button 
              onClick={() => router.push('/game/dashboard')}
              className="pixel-btn border-gray-600 text-gray-400 hover:text-white text-xs"
            >
              &gt; FLEE TO CAMP &lt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
