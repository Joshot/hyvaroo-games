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

  if (loading) return <div>Entering combat stance...</div>;

  const isCombatOver = currentTurnIdx >= combatResult?.log.length;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 border-2 border-gray-900 bg-black text-green-400 p-6 font-mono h-[600px] overflow-y-auto flex flex-col">
        <h2 className="text-xl font-bold border-b border-green-800 pb-2 mb-4">COMBAT LOG</h2>
        
        <div className="flex-1 space-y-2">
          {displayedLog.map((line, idx) => (
            <div key={idx} className={`animate-fade-in ${line.includes('CRITICAL HIT') ? 'text-red-400 font-bold' : ''} ${line.includes('HASIL:') ? 'text-yellow-400 mt-4' : ''}`}>
              {line}
            </div>
          ))}
          {!isCombatOver && (
            <div className="animate-pulse mt-2">...</div>
          )}
        </div>
        
        {isCombatOver && (
          <div className="mt-8 border-t border-green-800 pt-4 flex gap-4">
            <button 
              onClick={() => router.push('/game/explore')}
              className="px-4 py-2 bg-green-900 text-black font-bold hover:bg-green-800 transition-colors"
            >
              Continue Exploring
            </button>
            <button 
              onClick={() => router.push('/game/dashboard')}
              className="px-4 py-2 border border-green-900 text-green-400 hover:bg-green-900 hover:text-black transition-colors"
            >
              Return to Camp
            </button>
          </div>
        )}
      </div>
      
      <div className="w-full md:w-64 space-y-4">
        <div className="border-2 border-gray-900 p-4 bg-white">
          <h3 className="font-bold border-b mb-2">{character?.name}</h3>
          <div className="text-sm">HP: {combatResult?.finalPlayerHP} / ?</div>
        </div>
        
        <div className="border-2 border-red-900 p-4 bg-red-50 text-red-900">
          <h3 className="font-bold border-b border-red-200 mb-2">{monster?.name}</h3>
          <div className="text-sm">Danger: High</div>
        </div>
      </div>
    </div>
  );
}
