import { supabase } from '@/lib/supabase/client';

export async function processIdleProgression(character) {
  if (!character) return null;

  const now = new Date();
  const lastLogin = new Date(character.last_login);
  
  // Calculate difference in seconds
  let diffSeconds = Math.floor((now - lastLogin) / 1000);
  
  if (diffSeconds < 90) {
    // Need at least 90 seconds for 1 action, so skip if less
    // Still update last_login though
    await supabase.from('characters').update({ last_login: now.toISOString() }).eq('id', character.id);
    return null; 
  }

  // Cap at 8 hours (28800 seconds)
  if (diffSeconds > 28800) {
    diffSeconds = 28800;
  }

  const virtualActions = Math.floor(diffSeconds / 90);
  
  if (virtualActions > 0) {
    // Generate passive rewards. This is a simplified idle logic.
    // Exp: level * 1 per action. Gold: level * 0.5 per action
    const expGained = Math.floor(virtualActions * (character.level * 1.2));
    const goldGained = Math.floor(virtualActions * (character.level * 0.5));
    
    // Also process daily AP reset
    let newAp = character.ap_current;
    const lastReset = new Date(character.ap_last_reset);
    
    // If different day (reset at midnight server time)
    // A simplified check: if last_reset is on a different day than now
    if (lastReset.getDate() !== now.getDate() || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      newAp = Math.min(150, newAp + 50); // Daily 50 AP, cap 150
      
      const { data, error } = await supabase
        .from('characters')
        .update({
          exp: character.exp + expGained,
          gold: character.gold + goldGained,
          last_login: now.toISOString(),
          ap_current: newAp,
          ap_last_reset: now.toISOString()
        })
        .eq('id', character.id)
        .select()
        .single();
        
      return { 
        actions: virtualActions, 
        exp: expGained, 
        gold: goldGained, 
        apReset: true,
        updatedCharacter: data 
      };
    } else {
      const { data, error } = await supabase
        .from('characters')
        .update({
          exp: character.exp + expGained,
          gold: character.gold + goldGained,
          last_login: now.toISOString()
        })
        .eq('id', character.id)
        .select()
        .single();
        
      return { 
        actions: virtualActions, 
        exp: expGained, 
        gold: goldGained, 
        apReset: false,
        updatedCharacter: data 
      };
    }
  }

  // If we reach here, we only update last login (or handle daily reset without offline time if they were online at midnight)
  await supabase.from('characters').update({ last_login: now.toISOString() }).eq('id', character.id);
  return null;
}
