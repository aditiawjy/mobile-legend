import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Cache for parsed data
let heroesCache = null;
let draftRulesCache = null;

// Parse draft-rules.csv (no more hardcoded magic values!)
function parseDraftRulesCSV() {
  if (draftRulesCache) return draftRulesCache;

  const filePath = path.join(process.cwd(), 'public/csv/draft-rules.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, { columns: true, trim: true });

  const roleCompatibility = {};
  const heroPriority = {};

  records.forEach(rule => {
    const ruleType = rule['Rule Type'];
    
    if (ruleType === 'role_compatibility') {
      const primaryRole = rule['Primary Role'];
      const compatibleRole = rule['Compatible Role'];
      
      if (!roleCompatibility[primaryRole]) {
        roleCompatibility[primaryRole] = [];
      }
      roleCompatibility[primaryRole].push(compatibleRole);
    } else if (ruleType === 'hero_priority') {
      const role = rule['Primary Role'];
      const heroName = rule['Hero Name'];
      const priority = parseInt(rule['Priority'], 10);
      
      if (heroName && !isNaN(priority)) {
        if (!heroPriority[role]) {
          heroPriority[role] = {};
        }
        heroPriority[role][heroName] = priority;
      }
    }
  });

  draftRulesCache = { roleCompatibility, heroPriority };
  return draftRulesCache;
}

function parseHeroesCSV() {
  if (heroesCache) return heroesCache;

  const filePath = path.join(process.cwd(), 'public/csv/heroes.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, { columns: true, trim: true });

  heroesCache = records.map(hero => ({
    name: hero['Hero Name'],
    role: hero['Role'],
    damageType: hero['Damage Type'],
    attackReliance: hero['Attack Reliance'],
    note: hero['Note'] || '',
  }));

  return heroesCache;
}

function getPrimaryRole(roleString) {
  // Extract primary role (before /)
  return roleString.split('/')[0].trim();
}

function getHeroesByRole(role, heroes = null) {
  if (!heroes) heroes = parseHeroesCSV();
  return heroes.filter(hero => {
    const primaryRole = getPrimaryRole(hero.role);
    return primaryRole === role;
  });
}

function getRecommendedPartners(selectedHero, numberOfRecommendations = 4) {
  const heroes = parseHeroesCSV();
  const selected = heroes.find(h => h.name === selectedHero);

  if (!selected) {
    throw new Error(`Hero ${selectedHero} tidak ditemukan`);
  }

  const selectedPrimaryRole = getPrimaryRole(selected.role);
  
  // Load rules from CSV (not hardcoded!)
  const { roleCompatibility, heroPriority } = parseDraftRulesCSV();
  const compatibleRoles = roleCompatibility[selectedPrimaryRole] || [];

  const recommendations = [];

  // Iterate through compatible roles dan ambil hero terbaik dari setiap role
  for (const role of compatibleRoles) {
    if (recommendations.length >= numberOfRecommendations) break;

    const heroesInRole = getHeroesByRole(role, heroes);
    if (heroesInRole.length === 0) continue;

    // Sort by priority dari CSV atau default 5 jika tidak ada
    const heroesWithPriority = heroesInRole.map(hero => ({
      hero,
      priority: heroPriority[role]?.[hero.name] || 5,
    }));

    heroesWithPriority.sort((a, b) => b.priority - a.priority);

    if (heroesWithPriority.length > 0) {
      recommendations.push(heroesWithPriority[0].hero);
    }
  }

  // Jika belum cukup recommendation, tambah hero random dari role manapun
  while (recommendations.length < numberOfRecommendations) {
    const randomHero = heroes[Math.floor(Math.random() * heroes.length)];
    if (
      randomHero.name !== selectedHero &&
      !recommendations.find(r => r.name === randomHero.name)
    ) {
      recommendations.push(randomHero);
    }
  }

  return recommendations.slice(0, numberOfRecommendations);
}

function simulateDraftPick(selectedHeroName) {
  const heroes = parseHeroesCSV();
  const selectedHero = heroes.find(h => h.name === selectedHeroName);

  if (!selectedHero) {
    throw new Error(`Hero ${selectedHeroName} tidak ditemukan dalam database`);
  }

  const recommended = getRecommendedPartners(selectedHeroName, 4);

  return {
    selected: selectedHero,
    partners: recommended,
    draftOptions: [selectedHero, ...recommended],
    recommendations: {
      pickReason: `${selectedHero.name} adalah ${getPrimaryRole(selectedHero.role)} dengan kemampuan ${selectedHero.attackReliance}`,
      partnerRoles: recommended.map(hero => ({
        name: hero.name,
        role: getPrimaryRole(hero.role),
        reason: generatePartnerReason(selectedHero, hero),
      })),
    },
  };
}

function generatePartnerReason(selected, partner) {
  const selectedRole = getPrimaryRole(selected.role);
  const partnerRole = getPrimaryRole(partner.role);

  const reasons = {
    'Marksman-Tank': `${partner.name} sebagai tank untuk protect ${selected.name} di backline`,
    'Marksman-Support': `${partner.name} sebagai support untuk menjaga dan heal ${selected.name}`,
    'Marksman-Mage': `${partner.name} sebagai mage untuk burst damage dan crowd control`,
    'Mage-Tank': `${partner.name} sebagai tank inisiator untuk ${selected.name} follow-up damage`,
    'Mage-Support': `${partner.name} sebagai support untuk menjaga mana dan health ${selected.name}`,
    'Tank-Marksman': `${partner.name} sebagai marksman untuk high damage while ${selected.name} tank damage`,
    'Tank-Fighter': `${partner.name} sebagai fighter untuk damage dan CC combo dengan ${selected.name}`,
    'Support-Marksman': `${partner.name} sebagai marksman carry untuk diperlindungi ${selected.name}`,
    'Fighter-Mage': `${partner.name} sebagai mage untuk complementary damage type`,
    'Fighter-Support': `${partner.name} sebagai support untuk sustain dan utility`,
  };

  const key = `${selectedRole}-${partnerRole}`;
  return reasons[key] || `${partner.name} cocok bersama ${selected.name} untuk team composition yang balanced`;
}

function validateDraftTeam(heroes) {
  // Validate jika team composition seimbang
  const roles = heroes.map(h => getPrimaryRole(h.role));
  const roleCount = {};

  roles.forEach(role => {
    roleCount[role] = (roleCount[role] || 0) + 1;
  });

  return {
    isBalanced: Object.keys(roleCount).length >= 3,
    roleDistribution: roleCount,
  };
}

export {
  parseHeroesCSV,
  parseDraftRulesCSV,
  getPrimaryRole,
  getHeroesByRole,
  getRecommendedPartners,
  simulateDraftPick,
  validateDraftTeam,
};
