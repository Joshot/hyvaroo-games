'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCharacter, getActiveQuests, getAvailableQuests } from '@/lib/supabase/queries';

export default function Quests() {
  const [character, setCharacter] = useState(null);
  const [activeQuests, setActiveQuests] = useState([]);
  const [availableQuests, setAvailableQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const charData = await getCharacter(session.user.id);
      if (charData) {
        setCharacter(charData);
        
        // Fetch quests
        const active = await getActiveQuests(charData.id);
        setActiveQuests(active || []);
        
        if (charData.current_area_id) {
           const available = await getAvailableQuests(charData.current_area_id);
           setAvailableQuests(available || []);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="animate-blink font-pixel text-retro-warning">Loading quests...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      <div className="pixel-panel flex-1">
        <h2 className="text-xl font-pixel text-retro-accent mb-4 border-b-2 border-retro-border pb-2">ACTIVE QUESTS</h2>
        
        <div className="space-y-4">
          {activeQuests.length === 0 ? (
            <p className="text-gray-500 font-pixel text-sm">NO ACTIVE QUESTS.</p>
          ) : (
            activeQuests.map((progress) => (
              <div key={progress.id} className="border-2 border-retro-accent p-4 bg-[#110000]">
                <h3 className="font-pixel text-lg text-retro-accent mb-2">{progress.quests.title}</h3>
                <p className="text-sm mb-4 font-vt323 text-xl text-gray-300">{progress.quests.description}</p>
                
                <div className="flex justify-between font-pixel text-xs mb-1">
                  <span className="text-retro-info">PROGRESS</span>
                  <span>{progress.progress_current} / {progress.progress_required}</span>
                </div>
                <div className="w-full bg-black h-4 border border-retro-border p-0.5 mb-2">
                  <div className="bg-retro-info h-full" style={{ width: `${(progress.progress_current / progress.progress_required) * 100}%` }}></div>
                </div>
                <div className="text-right">
                   <button className="pixel-btn text-retro-warning border-retro-warning hover:bg-retro-warning hover:text-black">ABANDON</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="pixel-panel flex-1 bg-[#050505]">
        <h2 className="text-xl font-pixel text-retro-info mb-4 border-b-2 border-gray-700 pb-2">AVAILABLE IN AREA</h2>
        
        <div className="space-y-4">
          {availableQuests.length === 0 ? (
            <p className="text-gray-500 font-pixel text-sm">NO NEW QUESTS HERE.</p>
          ) : (
            availableQuests.map((quest) => (
              <div key={quest.id} className="border-2 border-retro-info p-4 hover:border-retro-success transition-colors">
                <h3 className="font-pixel text-lg text-retro-info mb-2">{quest.title}</h3>
                <p className="text-sm mb-4 font-vt323 text-xl text-gray-400">{quest.description}</p>
                <div className="flex justify-between items-center border-t border-gray-700 pt-2">
                   <span className="font-pixel text-xs text-retro-warning">REWARD: {quest.reward_gold} G / {quest.reward_exp} EXP</span>
                   <button className="pixel-btn text-retro-success border-retro-success hover:bg-retro-success hover:text-black text-xs">ACCEPT</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
