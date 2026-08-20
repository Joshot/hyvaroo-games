'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const CLASSES = [
  { id: 'warrior', name: 'Warrior', desc: 'Focuses on melee damage & high HP. (+2 Might, +1 Grace)' },
  { id: 'mage', name: 'Mage', desc: 'Focuses on spell damage, low HP. (+2 Wisdom, +1 Grace)' },
  { id: 'rogue', name: 'Rogue', desc: 'Focuses on critical hits & evasion. (+2 Grace, +1 Might)' },
  { id: 'cleric', name: 'Cleric', desc: 'Balanced stats with access to healing. (+1 Might, +1 Wisdom, +1 Grace)' }
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
      alert('Error creating character: ' + error.message);
      setLoading(false);
    } else {
      router.push('/game/dashboard');
    }
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center font-mono">Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen font-mono p-4">
      <div className="w-full max-w-2xl border-2 border-gray-900 bg-white p-8">
        <h2 className="text-3xl font-bold mb-2">Create Your Adventurer</h2>
        <p className="mb-6 text-gray-600">Your journey into the Endless Expanse begins here.</p>
        
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block font-bold mb-2 text-lg">Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 focus:border-gray-900 outline-none text-lg"
              placeholder="Enter your name..."
              required
              maxLength={20}
            />
          </div>
          
          <div>
            <label className="block font-bold mb-2 text-lg">Class</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CLASSES.map((cls) => (
                <div 
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`border-2 p-4 cursor-pointer transition-colors ${selectedClass === cls.id ? 'border-gray-900 bg-gray-100' : 'border-gray-300 hover:border-gray-500'}`}
                >
                  <h3 className="font-bold text-xl mb-1">{cls.name}</h3>
                  <p className="text-sm text-gray-600">{cls.desc}</p>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="w-full py-4 mt-4 bg-gray-900 text-white font-bold text-xl hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Forging Fate...' : 'Enter the World'}
          </button>
        </form>
      </div>
    </div>
  );
}
