'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCharacter } from '@/lib/supabase/queries';
import { processIdleProgression } from '@/lib/game-logic/idleCalculator';
import { calculateMaxHP, calculateMaxMP, calculateExpNeeded } from '@/lib/game-logic/stats';
import Link from 'next/link';

export default function Dashboard() {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idleReport, setIdleReport] = useState(null);

  useEffect(() => {
    const loadCharacter = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      let charData = await getCharacter(session.user.id);
        
      if (charData) {
        // Calculate offline progress
        const report = await processIdleProgression(charData);
        if (report) {
          setIdleReport(report);
          charData = report.updatedCharacter;
        }
        setCharacter(charData);
      }
      setLoading(false);
    };
    
    loadCharacter();
  }, []);

  if (loading) return <div className="animate-blink font-pixel text-retro-accent">Loading status...</div>;
  if (!character) return <div className="text-retro-warning font-pixel">No character found. ERROR 404.</div>;

  const maxHP = calculateMaxHP(character.might, character.level);
  const maxMP = calculateMaxMP(character.wisdom, character.level);
  const expNeeded = calculateExpNeeded(character.level);
  const hpPercent = Math.max(0, Math.min(100, (character.current_hp / maxHP) * 100));
  const mpPercent = Math.max(0, Math.min(100, (character.current_mp / maxMP) * 100));
  const expPercent = Math.max(0, Math.min(100, (character.exp / expNeeded) * 100));

  return (
    <div className="space-y-6">
      {idleReport && (
        <div className="pixel-panel border-retro-info text-retro-info p-4 mb-6">
          <h3 className="font-pixel text-sm mb-2 border-b-2 border-retro-info pb-2">SYS.MSG: OFFLINE GAINS</h3>
          <p className="mb-2">Time elapsed: {idleReport.actions * 90}s</p>
          <ul className="list-square ml-5">
            <li>+ {idleReport.exp} EXP</li>
            <li>+ {idleReport.gold} G</li>
            {idleReport.apReset && <li className="text-retro-success animate-blink mt-2">&gt; AP RESTORED &lt;</li>}
          </ul>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Character Avatar/Sprite Area */}
        <div className="pixel-panel flex-shrink-0 w-48 h-48 flex items-center justify-center border-retro-accent relative overflow-hidden">
           {/* Placeholder for a pixel character */}
           <div className="text-6xl animate-pulse">👾</div>
           <div className="absolute bottom-2 right-2 font-pixel text-xs bg-black px-1">LVL {character.level}</div>
        </div>

        {/* Character Details */}
        <div className="pixel-panel flex-1">
          <div className="flex justify-between items-start mb-6 border-b-4 border-retro-border pb-4">
            <div>
              <h2 className="text-3xl font-pixel text-retro-info drop-shadow-sm mb-2">{character.name}</h2>
              <div className="text-gray-400 font-pixel text-sm uppercase">{character.class}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-pixel text-gray-500 mb-1">AP</div>
              <div className="text-2xl font-pixel text-retro-success">
                {character.ap_current} <span className="text-sm text-gray-500">/ 150</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* Vitals */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between font-pixel text-xs mb-1">
                  <span className="text-retro-accent">HP</span>
                  <span>{character.current_hp}/{maxHP}</span>
                </div>
                <div className="w-full bg-black h-6 border-2 border-retro-border p-1">
                  <div className="bg-retro-accent h-full" style={{ width: `${hpPercent}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between font-pixel text-xs mb-1">
                  <span className="text-retro-info">MP</span>
                  <span>{character.current_mp}/{maxMP}</span>
                </div>
                <div className="w-full bg-black h-6 border-2 border-retro-border p-1">
                  <div className="bg-retro-info h-full" style={{ width: `${mpPercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-pixel text-xs mb-1">
                  <span className="text-retro-warning">EXP</span>
                  <span>{character.exp}/{expNeeded}</span>
                </div>
                <div className="w-full bg-black h-6 border-2 border-retro-border p-1">
                  <div className="bg-retro-warning h-full" style={{ width: `${expPercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Core Stats */}
            <div className="grid grid-cols-2 gap-4 font-pixel text-sm">
              <div className="pixel-panel flex flex-col justify-center items-center p-2 border-gray-600 hover:border-retro-border transition-colors">
                <span className="text-xs text-gray-400 mb-2">MIGHT</span>
                <span className="text-xl text-white">{character.might}</span>
              </div>
              <div className="pixel-panel flex flex-col justify-center items-center p-2 border-gray-600 hover:border-retro-border transition-colors">
                <span className="text-xs text-gray-400 mb-2">WISDOM</span>
                <span className="text-xl text-white">{character.wisdom}</span>
              </div>
              <div className="pixel-panel flex flex-col justify-center items-center p-2 border-gray-600 hover:border-retro-border transition-colors">
                <span className="text-xs text-gray-400 mb-2">GRACE</span>
                <span className="text-xl text-white">{character.grace}</span>
              </div>
              <div className="pixel-panel flex flex-col justify-center items-center p-2 border-retro-warning text-retro-warning">
                <span className="text-xs mb-2">GOLD</span>
                <span className="text-xl">{character.gold} G</span>
              </div>
            </div>
          </div>
          
          <div className="border-t-4 border-retro-border pt-4 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-pixel text-sm text-gray-400">LOCATION:</h3>
              <span className="font-pixel text-retro-success animate-pulse">{character.areas?.name || 'Safe Haven'}</span>
            </div>
            
            <Link 
              href="/game/explore" 
              className="pixel-btn block w-full text-center text-retro-info border-retro-info hover:bg-retro-info hover:text-black py-3 mt-4"
            >
              &gt; ENTER WILDERNESS (1 AP) &lt;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
