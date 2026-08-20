'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Inventory() {
  const [character, setCharacter] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: charData } = await supabase.from('characters').select('*').eq('user_id', session.user.id).single();
      setCharacter(charData);
      
      const { data: invData } = await supabase
        .from('character_inventory')
        .select(`
          id, quantity, is_equipped, equipment_slot, generated_name,
          items (
            id, base_name, category, subcategory, rarity, base_stat_bonus
          )
        `)
        .eq('character_id', charData.id);
        
      setInventory(invData || []);
      setLoading(false);
    };
    
    fetchInventory();
  }, []);

  if (loading) return <div>Rummaging through your bag...</div>;

  const equippedItems = inventory.filter(i => i.is_equipped);
  const unequippedItems = inventory.filter(i => !i.is_equipped);

  const getRarityColor = (rarity) => {
    switch(rarity?.toLowerCase()) {
      case 'uncommon': return 'text-green-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-orange-500 font-bold';
      case 'mythic': return 'text-red-600 font-bold animate-pulse';
      default: return 'text-gray-900';
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 font-mono">
      {/* Equipped Gear */}
      <div className="w-full md:w-1/3 space-y-4">
        <div className="border-2 border-gray-900 bg-white p-4">
          <h2 className="text-xl font-bold border-b-2 border-gray-900 pb-2 mb-4">Equipped Gear</h2>
          
          <div className="space-y-4">
            {['weapon', 'offhand', 'helmet', 'chestplate', 'gloves', 'boots', 'ring_1', 'ring_2', 'amulet', 'belt'].map(slot => {
              const equipped = equippedItems.find(i => i.equipment_slot === slot);
              return (
                <div key={slot} className="border border-gray-300 p-2">
                  <div className="text-xs text-gray-500 uppercase font-bold mb-1">{slot.replace('_', ' ')}</div>
                  {equipped ? (
                    <div>
                      <div className={getRarityColor(equipped.items.rarity)}>
                        {equipped.generated_name || equipped.items.base_name}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {JSON.stringify(equipped.items.base_stat_bonus)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic">Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bag Contents */}
      <div className="flex-1 border-2 border-gray-900 bg-white p-6">
        <div className="flex justify-between items-end border-b-2 border-gray-900 pb-2 mb-4">
          <h2 className="text-xl font-bold">Your Bag</h2>
          <span className="text-sm text-gray-600">Capacity: {inventory.length} / {20 + (character?.might * 2)}</span>
        </div>

        {unequippedItems.length === 0 ? (
          <div className="text-gray-500 italic text-center py-12">Your bag is empty. Explore to find loot!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {unequippedItems.map(item => (
              <div key={item.id} className="border border-gray-300 p-3 flex flex-col justify-between hover:border-gray-500 transition-colors">
                <div>
                  <div className={`font-bold ${getRarityColor(item.items.rarity)}`}>
                    {item.generated_name || item.items.base_name} {item.quantity > 1 ? `x${item.quantity}` : ''}
                  </div>
                  <div className="text-xs text-gray-500 uppercase mt-1">
                    {item.items.category} {item.items.subcategory ? `> ${item.items.subcategory}` : ''}
                  </div>
                  <div className="text-xs mt-2 text-gray-700">
                    {item.items.base_stat_bonus && Object.entries(item.items.base_stat_bonus).map(([k, v]) => `${k}: +${v}`).join(', ')}
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  {['weapon', 'armor', 'accessory'].includes(item.items.category) && (
                    <button className="text-xs bg-gray-900 text-white px-2 py-1 hover:bg-gray-800">Equip</button>
                  )}
                  {item.items.category === 'consumable' && (
                    <button className="text-xs bg-gray-900 text-white px-2 py-1 hover:bg-gray-800">Use</button>
                  )}
                  <button className="text-xs border border-gray-300 px-2 py-1 hover:bg-gray-100">Drop</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
