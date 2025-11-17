// Shared team composition validation utilities
// Used by both lib/draftPick.js (auto recommendation) and components/ManualDraftPick.js (manual)

/**
 * Check if hero has Crowd Control abilities
 * @param {Object} hero - Hero object with attack_reliance and note
 * @returns {boolean}
 */
export function hasCC(hero) {
  const ar = hero.attack_reliance?.toLowerCase() || hero.attackReliance?.toLowerCase() || '';
  const note = hero.note?.toLowerCase() || '';
  const ccKeywords = ['control', 'crowd', 'stun', 'immobilize', 'knock', 'slow', 'suppress', 'pull', 'freeze', 'terrify'];
  return ccKeywords.some(keyword => ar.includes(keyword) || note.includes(keyword));
}

/**
 * Check if hero has Burst damage
 * @param {Object} hero - Hero object with attack_reliance and note
 * @returns {boolean}
 */
export function hasBurst(hero) {
  const ar = hero.attack_reliance?.toLowerCase() || hero.attackReliance?.toLowerCase() || '';
  const note = hero.note?.toLowerCase() || '';
  return ar.includes('burst') || note.includes('burst');
}

/**
 * Check if hero has Area/AoE damage
 * @param {Object} hero - Hero object with note and attack_reliance
 * @returns {boolean}
 */
export function hasAreaDamage(hero) {
  const note = hero.note?.toLowerCase() || '';
  const ar = hero.attack_reliance?.toLowerCase() || hero.attackReliance?.toLowerCase() || '';
  return note.includes('area') || note.includes('aoe') || ar.includes('damage') || note.includes('damage area');
}

/**
 * Check if hero is Tank or Tanky (durable)
 * @param {Object} hero - Hero object with role, attack_reliance, and note
 * @returns {boolean}
 */
export function isTankOrTanky(hero) {
  const role = hero.role?.toLowerCase() || '';
  const ar = hero.attack_reliance?.toLowerCase() || hero.attackReliance?.toLowerCase() || '';
  const note = hero.note?.toLowerCase() || '';
  
  // Primary: Role contains Tank
  if (role.includes('tank')) return true;
  
  // Secondary: Fighter/Support with durability keywords
  const tankyKeywords = ['guard', 'regen', 'shield', 'defense', 'tebal', 'tahan', 'durability', 'sustain'];
  if ((role.includes('fighter') || role.includes('support')) && 
      tankyKeywords.some(keyword => ar.includes(keyword) || note.includes(keyword))) {
    return true;
  }
  
  return false;
}

/**
 * Check if hero has Objective Control (Jungler/Retribution)
 * @param {Object} hero - Hero object with role, attack_reliance, and note
 * @returns {boolean}
 */
export function hasObjectiveControl(hero) {
  const role = hero.role?.toLowerCase() || '';
  const ar = hero.attack_reliance?.toLowerCase() || hero.attackReliance?.toLowerCase() || '';
  const note = hero.note?.toLowerCase() || '';
  const junglerKeywords = ['jungle', 'jungling', 'hyper', 'retri', 'retribution'];
  const objectiveKeywords = ['lord', 'turtle', 'objective', 'secure', 'steal'];

  if (junglerKeywords.some(keyword => ar.includes(keyword) || note.includes(keyword))) {
    return true;
  }

  if (objectiveKeywords.some(keyword => note.includes(keyword))) {
    return true;
  }

  return false;
}

/**
 * Get primary role from role string (e.g., "Marksman/Support" -> "Marksman")
 * @param {string} roleString 
 * @returns {string}
 */
export function getPrimaryRole(roleString) {
  if (!roleString) return 'Unknown';
  return roleString.split('/')[0].trim();
}

/**
 * Comprehensive team composition validation
 * @param {Array} heroes - Array of hero objects (5 heroes for full team)
 * @returns {Object} Validation result with isValid, errors, warnings, and details
 */
export function validateTeamComposition(heroes) {
  const errors = [];
  const warnings = [];
  const details = {
    roleDistribution: {},
    damageTypes: { physical: 0, magic: 0, mixed: 0 },
    hasTank: false,
    hasCC: false,
    hasBurst: false,
    hasObjectiveControl: false,
  };

  // Filter out null/undefined heroes
  const validHeroes = heroes.filter(h => h != null);

  if (validHeroes.length === 0) {
    return {
      isValid: false,
      errors: ['Team kosong: Pilih minimal 1 hero'],
      warnings: [],
      details,
    };
  }

  // Count roles
  validHeroes.forEach(hero => {
    const primaryRole = getPrimaryRole(hero.role);
    details.roleDistribution[primaryRole] = (details.roleDistribution[primaryRole] || 0) + 1;
  });

  // Count damage types
  validHeroes.forEach(hero => {
    const damageType = hero.damage_type?.toLowerCase() || hero.damageType?.toLowerCase() || '';
    if (damageType.includes('physical')) {
      details.damageTypes.physical++;
    } else if (damageType.includes('magic')) {
      details.damageTypes.magic++;
    } else if (damageType.includes('mixed')) {
      details.damageTypes.mixed++;
    }
  });

  // Check for tank/tanky hero (CRITICAL)
  details.hasTank = validHeroes.some(h => isTankOrTanky(h));
  if (!details.hasTank && validHeroes.length >= 4) {
    errors.push('⚠️ KRITIS: Tim tidak punya Tank/Hero tahan badan! Tim akan sulit bertahan.');
  } else if (!details.hasTank && validHeroes.length >= 2) {
    warnings.push('Tim belum punya Tank/Hero tahan badan. Pertimbangkan untuk menambahkan.');
  }

  // Check for Crowd Control
  details.hasCC = validHeroes.some(h => hasCC(h));
  if (!details.hasCC && validHeroes.length >= 3) {
    warnings.push('Tim tidak punya Crowd Control yang jelas (no hard CC).');
  }

  // Check for Burst damage
  details.hasBurst = validHeroes.some(h => hasBurst(h));
  if (!details.hasBurst && validHeroes.length >= 3) {
    warnings.push('Tim tidak punya burst damage yang kuat (no burst).');
  }

  // Check for Objective Control
  details.hasObjectiveControl = validHeroes.some(h => hasObjectiveControl(h));
  if (!details.hasObjectiveControl && validHeroes.length >= 4) {
    warnings.push('Tim lemah dalam objective control (Turtle/Lord).');
  }

  // Check role diversity (at least 3 different roles for 5-hero team)
  const roleCount = Object.keys(details.roleDistribution).length;
  if (validHeroes.length >= 5 && roleCount < 3) {
    warnings.push(`Tim kurang beragam: hanya ${roleCount} role berbeda (minimal 3 untuk team balanced).`);
  }

  // Check damage type diversity (at least 1 physical + 1 magic)
  if (validHeroes.length >= 4) {
    if (details.damageTypes.physical === 0) {
      warnings.push('Tim tidak punya physical damage. Musuh bisa stack magic resist.');
    }
    if (details.damageTypes.magic === 0) {
      warnings.push('Tim tidak punya magic damage. Musuh bisa stack armor.');
    }
  }

  // Team is valid if no CRITICAL errors
  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    details,
  };
}

/**
 * Get roaming playstyle classification
 * @param {Object} hero - Hero object
 * @returns {string} - 'pick-off', 'team-fight', or 'general'
 */
export function getRoamingPlaystyle(hero) {
  if (!hero) return 'none';
  const role = hero.role?.toLowerCase() || '';
  const ar = hero.attack_reliance?.toLowerCase() || hero.attackReliance?.toLowerCase() || '';
  const note = hero.note?.toLowerCase() || '';
  
  // Pick-off style: Assassin or Chase/Burst
  if (role.includes('assassin') || ar.includes('chase') || ar.includes('burst') || note.includes('pick') || note.includes('assassin')) {
    return 'pick-off';
  }
  
  // Team fight style: Tank/Support with Initiator or Guard
  if ((role.includes('tank') || role.includes('support')) && (ar.includes('initiator') || ar.includes('guard') || note.includes('team'))) {
    return 'team-fight';
  }
  
  return 'general';
}
