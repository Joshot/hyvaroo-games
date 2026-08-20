import { calculateMaxHP, calculateAttackPower, calculateEvasion, calculateCriticalChance } from './stats';

export function resolveCombat(player, monster) {
  let log = [];
  
  // Calculate player effective stats
  const playerMaxHP = calculateMaxHP(player.might, player.level);
  let playerHP = player.current_hp;
  const playerAttack = calculateAttackPower(player.might); // Add weapon bonus later
  const playerDefense = 0; // Add armor bonus later
  const playerEvasion = calculateEvasion(player.grace);
  const playerCrit = calculateCriticalChance(player.grace);
  
  // Monster stats
  let monsterHP = monster.base_hp;
  const monsterAttack = monster.base_attack;
  const monsterDefense = monster.base_defense;
  const monsterEvasion = 5; // Base 5% evasion for monsters
  const monsterCrit = 5; // Base 5% crit for monsters
  
  log.push(`Encountered ${monster.name}! ${monster.flavor_description || ''}`);
  
  // Determine initiative
  let isPlayerTurn = player.grace >= (monster.grace || 5); // Default monster grace if none
  if (player.grace === (monster.grace || 5)) {
    isPlayerTurn = Math.random() > 0.5;
  }

  let turn = 1;
  while (playerHP > 0 && monsterHP > 0 && turn < 100) { // cap at 100 turns to prevent infinite loops
    if (isPlayerTurn) {
      // Player attacks
      const isHit = (Math.random() * 100) > monsterEvasion;
      if (!isHit) {
        log.push(`Turn ${turn}: You attacked ${monster.name}, but it dodged!`);
      } else {
        const isCrit = (Math.random() * 100) <= playerCrit;
        let damage = Math.max(1, playerAttack - monsterDefense);
        if (isCrit) damage *= 2;
        
        monsterHP -= damage;
        let msg = `Turn ${turn}: You attacked ${monster.name} for ${damage} damage.`;
        if (isCrit) msg += ` [CRITICAL HIT!]`;
        log.push(msg);
      }
    } else {
      // Monster attacks
      const isHit = (Math.random() * 100) > playerEvasion;
      if (!isHit) {
        log.push(`Turn ${turn}: ${monster.name} attacked you, but you dodged!`);
      } else {
        const isCrit = (Math.random() * 100) <= monsterCrit;
        let damage = Math.max(1, monsterAttack - playerDefense);
        if (isCrit) damage *= 2;
        
        playerHP -= damage;
        let msg = `Turn ${turn}: ${monster.name} attacked you for ${damage} damage.`;
        if (isCrit) msg += ` [CRITICAL HIT!]`;
        log.push(msg);
      }
    }
    
    isPlayerTurn = !isPlayerTurn; // Swap turns
    if (isPlayerTurn) turn++; // Increment turn counter after both have acted (or one round)
  }

  const winner = playerHP > 0 ? 'player' : 'monster';
  let loot = [];
  let exp = 0;
  let gold = 0;

  if (winner === 'player') {
    log.push(`HASIL: You defeated ${monster.name}!`);
    exp = monster.exp_reward;
    gold = Math.floor(Math.random() * (monster.gold_reward_max - monster.gold_reward_min + 1)) + monster.gold_reward_min;
    
    log.push(`+${exp} EXP, +${gold} Gold.`);
    
    // Calculate loot drops
    if (monster.loot_table && Array.isArray(monster.loot_table)) {
      monster.loot_table.forEach(drop => {
        if ((Math.random() * 100) <= drop.drop_rate) {
          loot.push(drop.item_id); // In real app, we would look up item name
          log.push(`Loot dropped! (Item ID: ${drop.item_id})`); // Temporary until item system is wired up
        }
      });
    }
  } else {
    log.push(`HASIL: You were defeated by ${monster.name}...`);
    playerHP = 1; // Survive with 1 HP
  }

  return {
    winner,
    log,
    exp,
    gold,
    loot,
    finalPlayerHP: Math.max(1, playerHP) // Don't allow negative HP
  };
}
