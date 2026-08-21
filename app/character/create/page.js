'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const CLASSES = [
  { id: 'warrior', name: 'WARRIOR', desc: 'Melee damage & high HP. (+2 Might, +1 Grace)', icon: '⚔️' },
  { id: 'mage', name: 'MAGE', desc: 'Spell damage, low HP. (+2 Wisdom, +1 Grace)', icon: '🔮' },
  { id: 'rogue', name: 'ROGUE', desc: 'Critical hits & evasion. (+2 Grace, +1 Might)', icon: '🗡️' },
  { id: 'cleric', name: 'CLERIC', desc: 'Balanced stats & healing. (+1 Might, +1 Wisdom, +1 Grace)', icon: '✨' }
];

export default function CreateCharacter() {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState('warrior');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    
    // Determine base stats based on class choice
    let might = 5, wisdom = 5, grace = 5;
    if (selectedClass === 'warrior') { might += 2; grace += 1; }
    if (selectedClass === 'mage') { wisdom += 2; grace += 1; }
    if (selectedClass === 'rogue') { grace += 2; might += 1; }
    if (selectedClass === 'cleric') { might += 1; wisdom += 1; grace += 1; }

    const max_hp = 20 + (might * 3) + 5; // Level 1 HP
    const max_mp = 10 + (wisdom * 3) + 3; // Level 1 MP

    const { data, error } = await supabase
      .from('characters')
      .insert([
        {
          user_id: session.user.id,
          name: name,
          class: selectedClass,
          might,
          wisdom,
          grace,
          current_hp: max_hp,
          current_mp: max_mp,
          level: 1,
          exp: 0,
          gold: 50,
          ap_current: 50
        }
      ]);

    if (error) {
      alert('SYS.ERR: ' + error.message);
      setLoading(false);
    } else {
      router.push('/game/dashboard');
    }
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center font-pixel animate-blink text-retro-accent">CONNECTING...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl pixel-panel p-8">
        <h2 className="text-3xl font-pixel text-retro-success mb-2 drop-shadow-md text-center">CREATE CHARACTER</h2>
        <p className="mb-6 text-gray-400 font-pixel text-xs text-center border-b-2 border-gray-700 pb-4">YOUR JOURNEY BEGINS HERE.</p>
        
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block font-pixel text-sm mb-2 text-retro-info">NAME</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-black border-2 border-gray-600 focus:border-retro-info text-white font-vt323 text-2xl outline-none"
              placeholder="ENTER NAME..."
              required
              maxLength={20}
            />
          </div>
          
          <div>
            <label className="block font-pixel text-sm mb-2 text-retro-info">CLASS</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CLASSES.map((cls) => (
                <div 
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`pixel-panel p-4 cursor-pointer transition-colors flex flex-col items-center text-center ${selectedClass === cls.id ? 'border-retro-warning bg-[#221100]' : 'border-gray-700 hover:border-gray-500 bg-[#050505]'}`}
                >
                  <div className="text-3xl mb-2">{cls.icon}</div>
                  <h3 className={`font-pixel text-sm mb-2 ${selectedClass === cls.id ? 'text-retro-warning' : 'text-gray-300'}`}>{cls.name}</h3>
                  <p className="font-vt323 text-xl text-gray-400">{cls.desc}</p>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="pixel-btn w-full py-4 mt-4 text-retro-success border-retro-success hover:bg-retro-success hover:text-black font-pixel text-lg disabled:opacity-50"
          >
            {loading ? 'INITIALIZING...' : 'ENTER WORLD'}
          </button>
        </form>
      </div>
    </div>
  );
}
