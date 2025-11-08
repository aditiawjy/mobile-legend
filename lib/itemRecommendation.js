import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

let itemsCache = null;

// Parse items.csv dengan proper numeric conversion
function parseItemsCSV() {
  if (itemsCache) return itemsCache;

  const filePath = path.join(process.cwd(), 'public/csv/items.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, { columns: true, trim: true });

  itemsCache = records.map(item => ({
    name: item['Item Name'],
    category: item['Category'],
    // Parse numerik dengan Number() untuk sorting yang benar
    price: Number(item['Price']) || 0,
    attack: Number(item['Attack']) || 0,
    attackSpeed: Number(item['Attack Speed']) || 0,
    critChance: Number(item['Crit Chance']) || 0,
    armorPenetration: Number(item['Armor Penetration']) || 0,
    spellVamp: Number(item['Spell Vamp']) || 0,
    magicPower: Number(item['Magic Power']) || 0,
    hp: Number(item['HP']) || 0,
    armor: Number(item['Armor']) || 0,
    magicResist: Number(item['Magic Resist']) || 0,
    movementSpeed: Number(item['Movement Speed']) || 0,
    cooldownReduction: Number(item['Cooldown Reduction']) || 0,
    manaRegen: Number(item['Mana Regen']) || 0,
    hpRegen: Number(item['HP Regen']) || 0,
    description: item['Description'] || '',
  }));

  return itemsCache;
}

// Get items by category
function getItemsByCategory(category) {
  const items = parseItemsCSV();
  return items.filter(item => 
    item.category.toLowerCase() === category.toLowerCase()
  );
}

// Recommend boots based on role
function recommendBoots(role, damageType) {
  const boots = getItemsByCategory('movement');
  
  // Sorting boots by relevance
  if (damageType === 'magic') {
    // Arcane Boots untuk magic damage
    return boots.filter(b => b.magicPower > 0 || b.name.toLowerCase().includes('arcane'));
  } else if (damageType === 'physical') {
    // Warrior/Rapid Boots untuk physical
    return boots.filter(b => b.attack > 0 || b.attackSpeed > 0 || 
                             b.name.toLowerCase().includes('warrior') ||
                             b.name.toLowerCase().includes('rapid'));
  }
  
  // Default: cheapest boots
  return boots.sort((a, b) => a.price - b.price);
}

// Recommend penetration items (cheap to expensive)
function recommendPenetrationItems(damageType, maxItems = 3) {
  const items = parseItemsCSV();
  
  if (damageType === 'physical') {
    // Physical penetration items, sorted by price
    return items
      .filter(item => item.armorPenetration > 0)
      .sort((a, b) => a.price - b.price)
      .slice(0, maxItems);
  } else if (damageType === 'magic') {
    // For magic, we look at magic power items with penetration hints in description
    return items
      .filter(item => item.magicPower > 0 && 
                     (item.description.toLowerCase().includes('penetration') ||
                      item.description.toLowerCase().includes('magic damage')))
      .sort((a, b) => a.price - b.price)
      .slice(0, maxItems);
  }
  
  return [];
}

// Recommend core items based on role
function recommendCoreItems(role, damageType, maxItems = 3) {
  const items = parseItemsCSV();
  
  const roleMapping = {
    'Tank': (item) => item.hp > 500 || item.armor > 40 || item.magicResist > 40,
    'Fighter': (item) => (item.attack > 0 || item.hp > 300) && item.price < 2500,
    'Assassin': (item) => item.attack > 50 || item.armorPenetration > 10,
    'Mage': (item) => item.magicPower > 50,
    'Marksman': (item) => item.attack > 40 || item.critChance > 0.15 || item.attackSpeed > 0.05,
    'Support': (item) => item.hp > 300 || item.cooldownReduction > 0.05 || item.hpRegen > 0,
  };
  
  const filterFn = roleMapping[role] || (() => true);
  
  return items
    .filter(filterFn)
    .filter(item => item.category !== 'movement') // Exclude boots
    .sort((a, b) => {
      // Sort by price (cheap first for early game)
      return a.price - b.price;
    })
    .slice(0, maxItems);
}

// Main recommendation function
function suggestItems(role, damageType, phase = 'early') {
  const boots = recommendBoots(role, damageType).slice(0, 1);
  const penetrationItems = recommendPenetrationItems(damageType, 2);
  const coreItems = recommendCoreItems(role, damageType, 3);
  
  // Combine recommendations
  const recommendations = {
    boots: boots[0] || null,
    penetration: penetrationItems,
    core: coreItems,
    suggested: [
      boots[0],
      ...penetrationItems.slice(0, 1),
      ...coreItems.slice(0, 2),
    ].filter(Boolean), // Remove nulls
    meta: {
      role,
      damageType,
      phase,
      totalPrice: 0,
    },
  };
  
  // Calculate total price
  recommendations.meta.totalPrice = recommendations.suggested.reduce(
    (sum, item) => sum + item.price, 
    0
  );
  
  return recommendations;
}

// Get budget-friendly items (cheap but effective)
function getBudgetItems(damageType, maxPrice = 1500, maxItems = 5) {
  const items = parseItemsCSV();
  
  return items
    .filter(item => item.price <= maxPrice && item.price > 0)
    .filter(item => {
      if (damageType === 'physical') {
        return item.attack > 20 || item.attackSpeed > 0 || item.armorPenetration > 0;
      } else if (damageType === 'magic') {
        return item.magicPower > 30 || item.cooldownReduction > 0;
      }
      return item.hp > 300; // Default: HP items
    })
    .sort((a, b) => {
      // Sort by cost-effectiveness (stats per gold)
      const aValue = (item) => {
        if (damageType === 'physical') {
          return (item.attack + item.attackSpeed * 100 + item.armorPenetration * 10) / item.price;
        } else if (damageType === 'magic') {
          return (item.magicPower + item.cooldownReduction * 100) / item.price;
        }
        return item.hp / item.price;
      };
      
      return aValue(b) - aValue(a); // Higher value first
    })
    .slice(0, maxItems);
}

export {
  parseItemsCSV,
  getItemsByCategory,
  recommendBoots,
  recommendPenetrationItems,
  recommendCoreItems,
  suggestItems,
  getBudgetItems,
};
