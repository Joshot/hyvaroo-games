'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
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
      
      let { data: charData } = await supabase
        .from('characters')
        .select(`*, areas(name)`)
        .eq('user_id', session.user.id)
        .single();
        
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

  if (loading) return <div>Loading dashboard...</div>;
  if (!character) return <div>No character found.</div>;

  const maxHP = calculateMaxHP(character.might, character.level);
  const maxMP = calculateMaxMP(character.wisdom, character.level);
  const expNeeded = calculateExpNeeded(character.level);
  const hpPercent = Math.max(0, Math.min(100, (character.current_hp / maxHP) * 100));
  const mpPercent = Math.max(0, Math.min(100, (character.current_mp / maxMP) * 100));
  const expPercent = Math.max(0, Math.min(100, (character.exp / expNeeded) * 100));

  return (
    <div className="space-y-6">
      {idleReport && (
        <div className="bg-blue-50 border border-blue-200 p-4 text-blue-900 mb-6">
          <h3 className="font-bold border-b border-blue-200 mb-2">Welcome Back!</h3>
          <p>While you were away (virtual time passed: {idleReport.actions * 90}s), your character gathered:</p>
          <ul className="list-disc ml-5 mt-2">
            <li>{idleReport.exp} EXP</li>
            <li>{idleReport.gold} Gold</li>
            {idleReport.apReset && <li className="font-bold text-green-700">A new day began! Action Points have been restored.</li>}
          </ul>
        </div>
      )}

      <div className="border-2 border-gray-900 p-6 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold">{character.name}</h2>
            <div className="text-gray-600 capitalize">Level {character.level} {character.class}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-500">Action Points (AP)</div>
            <div className="text-4xl font-bold text-blue-600">{character.ap_current} <span className="text-sm font-normal text-gray-400">/ 150</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Vitals */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-bold mb-1">
                <span>HP</span>
                <span>{character.current_hp} / {maxHP}</span>
              </div>
              <div className="w-full bg-gray-200 h-4 border border-gray-900">
                <div className="bg-red-500 h-full" style={{ width: `${hpPercent}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm font-bold mb-1">
                <span>MP</span>
                <span>{character.current_mp} / {maxMP}</span>
              </div>
              <div className="w-full bg-gray-200 h-4 border border-gray-900">
                <div className="bg-blue-500 h-full" style={{ width: `${mpPercent}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold mb-1">
                <span>EXP</span>
                <span>{character.exp} / {expNeeded}</span>
              </div>
              <div className="w-full bg-gray-200 h-4 border border-gray-900">
                <div className="bg-yellow-400 h-full" style={{ width: `${expPercent}%` }}></div>
              </div>
            </div>
          </div>

          {/* Core Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-300 p-3 flex flex-col justify-center">
              <span className="text-xs text-gray-500 font-bold uppercase">Might</span>
              <span className="text-2xl font-bold">{character.might}</span>
            </div>
            <div className="border border-gray-300 p-3 flex flex-col justify-center">
              <span className="text-xs text-gray-500 font-bold uppercase">Wisdom</span>
              <span className="text-2xl font-bold">{character.wisdom}</span>
            </div>
            <div className="border border-gray-300 p-3 flex flex-col justify-center">
              <span className="text-xs text-gray-500 font-bold uppercase">Grace</span>
              <span className="text-2xl font-bold">{character.grace}</span>
            </div>
            <div className="border border-gray-300 p-3 flex flex-col justify-center">
              <span className="text-xs text-gray-500 font-bold uppercase">Gold</span>
              <span className="text-2xl font-bold text-yellow-600">{character.gold}g</span>
            </div>
          </div>
        </div>
        
        <div className="border-t-2 border-gray-900 pt-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Current Location</h3>
            <span className="text-gray-600">{character.areas?.name || 'Safe Haven'}</span>
          </div>
          
          <Link 
            href="/game/explore" 
            className="block w-full text-center bg-gray-900 text-white font-bold py-3 hover:bg-gray-800 transition-colors"
          >
            Explore Area (1 AP)
          </Link>
        </div>
      </div>
    </div>
  );
}
