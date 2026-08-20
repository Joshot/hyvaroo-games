export function calculateMaxHP(might, level) {
  return 20 + (might * 3) + (level * 5);
}

export function calculateMaxMP(wisdom, level) {
  return 10 + (wisdom * 3) + (level * 3);
}

export function calculateAttackPower(might, weaponBonus = 0) {
  return might + weaponBonus;
}

export function calculateMagicPower(wisdom, staffBonus = 0) {
  return wisdom + staffBonus;
}

export function calculateEvasion(grace, armorEvasionBonus = 0) {
  // Returns percentage. Cap at 75%
  return Math.min(75, (grace * 0.5) + armorEvasionBonus);
}

export function calculateCriticalChance(grace) {
  // Returns percentage. Cap at 50%
  return Math.min(50, grace * 0.3);
}

export function calculateCarryCapacity(might) {
  return 20 + (might * 2);
}

export function calculateExpNeeded(level) {
  return Math.floor(50 * Math.pow(1.15, level));
}
