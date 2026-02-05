import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Cache untuk parsed data
let itemsCache = null;
let itemsCacheTimestamp = null;
const CACHE_DURATION = 60000; // 1 menit

/**
 * Parse items.csv dan return array item objects
 * @returns {Array} Array of item objects
 */
export function parseItemsCSV() {
  // Check cache validity
  if (itemsCache && itemsCacheTimestamp && Date.now() - itemsCacheTimestamp < CACHE_DURATION) {
    return itemsCache;
  }

  const filePath = path.join(process.cwd(), 'public/csv/items.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true,
    trim: true,
    skip_empty_lines: true,
  });

  // Transform ke format yang lebih mudah digunakan
  itemsCache = records.map((item) => ({
    item_name: item['Item Name'] || '',
    category: item['Category'] || '',
    price: parseInt(item['Price']) || 0,
    attack: parseInt(item['Attack']) || 0,
    attack_speed: parseFloat(item['Attack Speed']) || 0,
    crit_chance: parseFloat(item['Crit Chance']) || 0,
    armor_penetration: parseFloat(item['Armor Penetration']) || 0,
    spell_vamp: parseFloat(item['Spell Vamp']) || 0,
    magic_power: parseInt(item['Magic Power']) || 0,
    hp: parseInt(item['HP']) || 0,
    armor: parseInt(item['Armor']) || 0,
    magic_resist: parseInt(item['Magic Resist']) || 0,
    movement_speed: parseInt(item['Movement Speed']) || 0,
    cooldown_reduction: parseFloat(item['Cooldown Reduction']) || 0,
    mana_regen: parseInt(item['Mana Regen']) || 0,
    hp_regen: parseInt(item['HP Regen']) || 0,
    description: item['Description'] || '',
  }));

  itemsCacheTimestamp = Date.now();
  return itemsCache;
}

/**
 * Get all items
 * @returns {Array} Array of all items
 */
export function getAllItemsFromCSV() {
  return parseItemsCSV();
}

/**
 * Get item by name (case-insensitive)
 * @param {string} itemName - Nama item
 * @returns {Object|null} Item object atau null jika tidak ditemukan
 */
export function getItemByNameFromCSV(itemName) {
  if (!itemName) return null;

  const items = parseItemsCSV();
  const normalizedName = itemName.toLowerCase().trim();

  return items.find((item) => item.item_name.toLowerCase().trim() === normalizedName) || null;
}

/**
 * Search items by name (partial match, case-insensitive)
 * @param {string} searchTerm - Search term
 * @returns {Array} Array of matching items
 */
export function searchItemsFromCSV(searchTerm) {
  if (!searchTerm) return parseItemsCSV();

  const items = parseItemsCSV();
  const normalizedTerm = searchTerm.toLowerCase().trim();

  return items.filter((item) => item.item_name.toLowerCase().includes(normalizedTerm));
}

/**
 * Get items by category
 * @param {string} category - Category filter
 * @returns {Array} Array of items dengan category yang cocok
 */
export function getItemsByCategoryFromCSV(category) {
  if (!category) return parseItemsCSV();

  const items = parseItemsCSV();
  const normalizedCategory = category.toLowerCase().trim();

  return items.filter((item) => item.category.toLowerCase() === normalizedCategory);
}

/**
 * Get unique categories dari items.csv
 * @returns {Array} Array of unique categories
 */
export function getUniqueCategoriesFromCSV() {
  const items = parseItemsCSV();
  const categories = new Set();

  items.forEach((item) => {
    if (item.category) {
      categories.add(item.category);
    }
  });

  return Array.from(categories).sort();
}

/**
 * Get items by price range
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @returns {Array} Array of items dalam range harga
 */
export function getItemsByPriceRangeFromCSV(minPrice = 0, maxPrice = Infinity) {
  const items = parseItemsCSV();

  return items.filter((item) => item.price >= minPrice && item.price <= maxPrice);
}

/**
 * Get items sorted by stat (untuk recommend items)
 * @param {string} stat - Stat name (armor, magic_resist, hp, dll)
 * @param {number} limit - Maximum items to return
 * @returns {Array} Array of items sorted by stat
 */
export function getItemsSortedByStatFromCSV(stat, limit = 10) {
  const items = parseItemsCSV();

  return items
    .filter((item) => item[stat] > 0)
    .sort((a, b) => b[stat] - a[stat])
    .slice(0, limit);
}

/**
 * Clear cache (useful untuk development/testing)
 */
export function clearItemsCache() {
  itemsCache = null;
  itemsCacheTimestamp = null;
}

/**
 * Get item count
 * @returns {number} Jumlah items
 */
export function getItemsCount() {
  return parseItemsCSV().length;
}

/**
 * Validate item exists
 * @param {string} itemName - Nama item
 * @returns {boolean} True jika item exists
 */
export function itemExistsInCSV(itemName) {
  return getItemByNameFromCSV(itemName) !== null;
}

// Default export untuk backward compatibility
export default {
  parseItemsCSV,
  getAllItemsFromCSV,
  getItemByNameFromCSV,
  searchItemsFromCSV,
  getItemsByCategoryFromCSV,
  getUniqueCategoriesFromCSV,
  getItemsByPriceRangeFromCSV,
  getItemsSortedByStatFromCSV,
  clearItemsCache,
  getItemsCount,
  itemExistsInCSV,
};
