const RARITY_MULTIPLIERS = {
  common: 1.0,
  uncommon: 1.3,
  rare: 1.7,
  epic: 2.3,
  legendary: 3.2,
  mythic: 4.5
};

const RARITY_DROP_RATES = {
  common: 70,     // 70%
  uncommon: 20,   // 20%
  rare: 8,        // 8%
  epic: 1.5,      // 1.5%
  legendary: 0.45,// 0.45%
  mythic: 0.05    // 0.05%
};

const WEAPON_PREFIXES = {
  common: ['Rusty', 'Worn', 'Dull', 'Basic'],
  uncommon: ['Sturdy', 'Sharp', 'Polished', 'Reliable'],
  rare: ['Exquisite', 'Gleaming', 'Masterwork', 'Flawless'],
  epic: ['Heroic', 'Radiant', 'Enchanted', 'Fearsome'],
  legendary: ['Godly', 'Astral', 'Doom-forged', 'Eternal'],
  mythic: ['Omnipotent', 'Reality-bending', 'Cosmic', 'Void-touched']
};

const WEAPON_SUFFIXES = {
  might: ['of the Bear', 'of Strength', 'of the Giant', 'of Crushing'],
  grace: ['of the Falcon', 'of Speed', 'of Precision', 'of the Wind'],
  wisdom: ['of the Owl', 'of Magic', 'of the Sage', 'of Mysteries']
};

// Roll for rarity based on rates
export function rollRarity() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const [rarity, rate] of Object.entries(RARITY_DROP_RATES)) {
    cumulative += rate;
    if (roll <= cumulative) {
      return rarity;
    }
  }
  return 'common'; // Fallback
}

// Generate a random weapon
export function generateRandomWeapon(tier = 1) {
  const rarity = rollRarity();
  const mult = RARITY_MULTIPLIERS[rarity];
  
  // Base types
  const types = [
    { type: 'sword', stat: 'might', basePower: 5 },
    { type: 'axe', stat: 'might', basePower: 6 },
    { type: 'dagger', stat: 'grace', basePower: 4 },
    { type: 'bow', stat: 'grace', basePower: 5 },
    { type: 'staff', stat: 'wisdom', basePower: 5 },
    { type: 'wand', stat: 'wisdom', basePower: 4 }
  ];
  
  const baseItem = types[Math.floor(Math.random() * types.length)];
  
  // Generate Name
  const prefixPool = WEAPON_PREFIXES[rarity];
  const prefix = prefixPool[Math.floor(Math.random() * prefixPool.length)];
  
  const suffixPool = WEAPON_SUFFIXES[baseItem.stat];
  const suffix = (rarity !== 'common') 
    ? ` ${suffixPool[Math.floor(Math.random() * suffixPool.length)]}` 
    : '';
    
  const fullName = `${prefix} ${baseItem.type.charAt(0).toUpperCase() + baseItem.type.slice(1)}${suffix}`;
  
  // Calculate stats
  // Stat scales with tier and rarity
  const statBonus = Math.max(1, Math.floor(baseItem.basePower * mult * (1 + (tier * 0.2))));
  
  const stats = {};
  stats[baseItem.stat] = statBonus; // Bonus to the core stat (might, grace, or wisdom)
  
  return {
    name: fullName,
    category: 'weapon',
    subcategory: baseItem.type,
    rarity: rarity,
    stats: stats,
    sell_value: Math.floor(10 * mult * tier),
    is_generated: true
  };
}
