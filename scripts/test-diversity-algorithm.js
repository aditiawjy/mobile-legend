// Test diversity algorithm improvements
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Simple implementation to test
function parseHeroesCSV() {
  const filePath = path.join(__dirname, '../public/csv/heroes.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, { columns: true, trim: true });
  return records.map(hero => ({
    name: hero['Hero Name'],
    role: hero['Role'],
    damageType: hero['Damage Type'],
    attackReliance: hero['Attack Reliance'],
  }));
}

function parseDraftRulesCSV() {
  const filePath = path.join(__dirname, '../public/csv/draft-rules.csv');
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

  return { roleCompatibility, heroPriority };
}

function getPrimaryRole(roleString) {
  return roleString.split('/')[0].trim();
}

function normalizeDamageType(damageTypeString) {
  if (!damageTypeString) return 'unknown';
  const lower = damageTypeString.toLowerCase();
  
  if (lower.includes('physical') && lower.includes('magic')) {
    return 'mixed';
  }
  if (lower.includes('physical')) {
    return 'physical';
  }
  if (lower.includes('magic')) {
    return 'magic';
  }
  return 'unknown';
}

function getHeroesByRole(role, heroes) {
  return heroes.filter(hero => getPrimaryRole(hero.role) === role);
}

// OLD ALGORITHM (no diversity bonus)
function getRecommendedPartnersOld(selectedHero, heroes, rules, numberOfRecommendations = 4) {
  const selectedPrimaryRole = getPrimaryRole(selectedHero.role);
  const { roleCompatibility, heroPriority } = rules;
  const compatibleRoles = roleCompatibility[selectedPrimaryRole] || [];
  const recommendations = [];

  for (const role of compatibleRoles) {
    if (recommendations.length >= numberOfRecommendations) break;
    const heroesInRole = getHeroesByRole(role, heroes);
    if (heroesInRole.length === 0) continue;

    const heroesWithPriority = heroesInRole.map(hero => ({
      hero,
      priority: heroPriority[role]?.[hero.name] || 5,
      diversityBonus: 0,
      totalScore: heroPriority[role]?.[hero.name] || 5,
    }));

    heroesWithPriority.sort((a, b) => b.totalScore - a.totalScore);
    if (heroesWithPriority.length > 0) {
      recommendations.push(heroesWithPriority[0]);
    }
  }

  return recommendations;
}

// NEW ALGORITHM (with diversity bonus)
function getRecommendedPartnersNew(selectedHero, heroes, rules, numberOfRecommendations = 4) {
  const selectedPrimaryRole = getPrimaryRole(selectedHero.role);
  const selectedDamageType = normalizeDamageType(selectedHero.damageType);
  const { roleCompatibility, heroPriority } = rules;
  const compatibleRoles = roleCompatibility[selectedPrimaryRole] || [];
  const recommendations = [];

  for (const role of compatibleRoles) {
    if (recommendations.length >= numberOfRecommendations) break;
    const heroesInRole = getHeroesByRole(role, heroes);
    if (heroesInRole.length === 0) continue;

    const heroesWithScore = heroesInRole.map(hero => {
      const basePriority = heroPriority[role]?.[hero.name] || 5;
      const heroDamageType = normalizeDamageType(hero.damageType);
      const diversityBonus = heroDamageType !== selectedDamageType ? 2 : 0;
      
      return {
        hero,
        basePriority,
        diversityBonus,
        totalScore: basePriority + diversityBonus,
      };
    });

    heroesWithScore.sort((a, b) => b.totalScore - a.totalScore);
    if (heroesWithScore.length > 0) {
      recommendations.push(heroesWithScore[0]);
    }
  }

  return recommendations;
}

// Test Cases
function runTests() {
  console.log('🧪 Testing Damage Type Diversity Algorithm\n');
  console.log('=' .repeat(80));

  const heroes = parseHeroesCSV();
  const rules = parseDraftRulesCSV();

  const testCases = [
    { name: 'Miya', role: 'Marksman', damageType: 'physical_attack_speed' },
    { name: 'Eudora', role: 'Mage', damageType: 'magic' },
    { name: 'Tigreal', role: 'Tank', damageType: 'physical' },
  ];

  testCases.forEach(testCase => {
    console.log(`\n📋 Test Case: ${testCase.name} (${testCase.role}, ${testCase.damageType})`);
    console.log('-'.repeat(80));

    const selectedHero = heroes.find(h => h.name === testCase.name);
    if (!selectedHero) {
      console.log(`❌ Hero ${testCase.name} not found`);
      return;
    }

    const selectedDamageType = normalizeDamageType(selectedHero.damageType);
    console.log(`Selected Damage Type: ${selectedDamageType}\n`);

    // Old Algorithm
    const oldRecommendations = getRecommendedPartnersOld(selectedHero, heroes, rules, 4);
    console.log('OLD ALGORITHM (No Diversity Bonus):');
    oldRecommendations.forEach((rec, idx) => {
      const damageType = normalizeDamageType(rec.hero.damageType);
      console.log(`  ${idx + 1}. ${rec.hero.name.padEnd(15)} (${getPrimaryRole(rec.hero.role).padEnd(10)}) - Priority: ${rec.basePriority}, Damage: ${damageType}, Total: ${rec.totalScore}`);
    });

    // New Algorithm
    console.log('\nNEW ALGORITHM (With +2 Diversity Bonus):');
    const newRecommendations = getRecommendedPartnersNew(selectedHero, heroes, rules, 4);
    newRecommendations.forEach((rec, idx) => {
      const damageType = normalizeDamageType(rec.hero.damageType);
      const diversityIndicator = rec.diversityBonus > 0 ? '✨' : '  ';
      console.log(`  ${idx + 1}. ${rec.hero.name.padEnd(15)} (${getPrimaryRole(rec.hero.role).padEnd(10)}) - Priority: ${rec.basePriority}, Diversity: +${rec.diversityBonus}, Total: ${rec.totalScore} ${diversityIndicator}`);
    });

    // Compare
    console.log('\n📊 Comparison:');
    const changed = [];
    for (let i = 0; i < 4; i++) {
      const oldHero = oldRecommendations[i]?.hero.name || 'N/A';
      const newHero = newRecommendations[i]?.hero.name || 'N/A';
      if (oldHero !== newHero) {
        changed.push(`Position ${i + 1}: ${oldHero} → ${newHero}`);
      }
    }

    if (changed.length > 0) {
      console.log('  ✅ Changed:');
      changed.forEach(c => console.log(`     ${c}`));
    } else {
      console.log('  ⚪ No changes (same recommendations)');
    }

    // Diversity Stats
    const oldDiversity = oldRecommendations.filter(r => normalizeDamageType(r.hero.damageType) !== selectedDamageType).length;
    const newDiversity = newRecommendations.filter(r => normalizeDamageType(r.hero.damageType) !== selectedDamageType).length;
    console.log(`  Damage Type Diversity: Old = ${oldDiversity}/4, New = ${newDiversity}/4`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ All tests completed!\n');
  console.log('Summary:');
  console.log('- New algorithm favors heroes dengan damage type berbeda (+2 bonus)');
  console.log('- Promotes balanced team composition (physical + magic mix)');
  console.log('- Base priority masih dipertimbangkan (highest priority first)');
}

runTests();
