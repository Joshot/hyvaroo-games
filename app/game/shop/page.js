'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCharacter, getShopItems } from '@/lib/supabase/queries';

export default function Shop() {
  const [character, setCharacter] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const charData = await getCharacter(session.user.id);
      if (charData) setCharacter(charData);
      
      const shopData = await getShopItems();
      setItems(shopData || []);
      
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleBuy = async (item) => {
    if (!character || character.gold < item.sell_value * 2) {
      alert("Not enough gold!");
      return;
    }
    
    // Deduct gold and add to inventory
    const cost = item.sell_value * 2;
    const newGold = character.gold - cost;
    
    // Optimistic UI
    setCharacter(prev => ({...prev, gold: newGold}));
    
    await supabase.from('characters').update({ gold: newGold }).eq('id', character.id);
    await supabase.from('character_inventory').insert({
      character_id: character.id,
      item_id: item.id,
      quantity: 1
    });
  };

  if (loading) return <div className="animate-blink font-pixel text-retro-accent">Loading shop...</div>;

  return (
    <div className="flex flex-col h-full pixel-panel">
      <div className="flex justify-between items-center mb-6 border-b-4 border-retro-border pb-4">
        <h2 className="text-2xl font-pixel text-retro-warning drop-shadow-md">MERCHANT</h2>
        <div className="font-pixel text-sm text-retro-warning bg-[#221100] px-4 py-2 border-2 border-retro-warning">
          YOUR GOLD: {character?.gold} G
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 ? (
          <p className="text-gray-500 font-pixel text-sm col-span-full">SHOP IS EMPTY.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="pixel-panel flex flex-col justify-between border-gray-600 hover:border-retro-warning transition-colors bg-[#110500]">
              <div>
                <h3 className="font-pixel text-sm text-white mb-2">{item.base_name}</h3>
                <div className="text-xs font-pixel text-gray-500 mb-2">TYPE: {item.category}</div>
                <div className="font-vt323 text-xl text-gray-300 mb-4 h-12 overflow-hidden">
                  {item.unique_effect || "Standard item."}
                </div>
              </div>
              
              <div className="flex justify-between items-end border-t-2 border-gray-800 pt-3 mt-auto">
                 <span className="font-pixel text-sm text-retro-warning">{item.sell_value * 2} G</span>
                 <button 
                   onClick={() => handleBuy(item)}
                   disabled={character?.gold < (item.sell_value * 2)}
                   className="pixel-btn text-retro-success border-retro-success hover:bg-retro-success hover:text-black disabled:opacity-50 disabled:border-gray-500 disabled:text-gray-500 disabled:hover:bg-transparent"
                 >
                   BUY
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
