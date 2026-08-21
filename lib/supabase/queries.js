import { supabase } from './client';

/**
 * Fetches character details including current area name
 * @param {string} userId - Auth user ID
 */
export async function getCharacter(userId) {
  const { data, error } = await supabase
    .from('characters')
    .select(`*, areas(name)`)
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error("Error fetching character:", error);
    return null;
  }
  return data;
}

/**
 * Fetches all available areas based on character's level
 * @param {number} level - Character's current level
 */
export async function getAvailableAreas(level) {
  const { data, error } = await supabase
    .from('areas')
    .select('*')
    .lte('min_level', level)
    .order('min_level', { ascending: true });
    
  if (error) {
    console.error("Error fetching areas:", error);
    return [];
  }
  return data;
}

/**
 * Update character's current area
 */
export async function travelToArea(characterId, areaId) {
  const { data, error } = await supabase
    .from('characters')
    .update({ current_area_id: areaId })
    .eq('id', characterId)
    .select()
    .single();
    
  if (error) {
    console.error("Error traveling:", error);
    return null;
  }
  return data;
}

/**
 * Fetches items available for purchase from NPCs (Shop)
 */
export async function getShopItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('is_generated', false)
    .limit(10);
    
  if (error) {
    console.error("Error fetching shop items:", error);
    return [];
  }
  return data;
}

/**
 * Fetches active quests for a character
 */
export async function getActiveQuests(characterId) {
  const { data, error } = await supabase
    .from('character_quest_progress')
    .select(`
      *,
      quests(*)
    `)
    .eq('character_id', characterId)
    .eq('status', 'active');
    
  if (error) {
    console.error("Error fetching active quests:", error);
    return [];
  }
  return data;
}

/**
 * Fetches available quests in an area
 */
export async function getAvailableQuests(areaId) {
  const { data, error } = await supabase
    .from('quests')
    .select(`
      *,
      npcs!inner(area_id)
    `)
    .eq('npcs.area_id', areaId);
    
  if (error) {
    console.error("Error fetching available quests:", error);
    return [];
  }
  return data;
}

/**
 * Fetches a random monster for the given area
 */
export async function getEncounter(areaId) {
  const { data, error } = await supabase
    .from('area_monster_pool')
    .select(`
      monsters(*)
    `)
    .eq('area_id', areaId);
    
  if (error || !data || data.length === 0) {
    console.error("Error fetching encounter:", error);
    return null;
  }
  
  // Pick a random monster from the pool
  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex].monsters;
}
