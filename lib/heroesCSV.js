import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Cache untuk parsed data
let heroesCache = null;
let heroesCacheTimestamp = null;
const CACHE_DURATION = 60000; // 1 menit

/**
 * Parse heroes.csv dan return array hero objects
 * @returns {Array} Array of hero objects dengan format database-compatible
 */
export function parseHeroesCSV() {
  // Check cache validity
  if (heroesCache && heroesCacheTimestamp && Date.now() - heroesCacheTimestamp < CACHE_DURATION) {
    return heroesCache;
  }

  const filePath = path.join(process.cwd(), 'public/csv/heroes.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true,
    trim: true,
    relax_column_count: true, // Tolerate rows dengan field berbeda
    skip_empty_lines: true,
  });

  // Transform ke format database-compatible
  heroesCache = records.map((hero) => ({
    hero_name: hero['Hero Name'] || '',
    role: hero['Role'] || '',
    damage_type: hero['Damage Type'] || '',
    attack_reliance: hero['Attack Reliance'] || '',
    note: hero['Note'] || '',
    // Additional fields dari CSV (untuk detail page jika diperlukan)
    passive_name: hero['Passive Name'] || '',
    passive_description: hero['Passive Description'] || '',
    additional_note: hero['Additional Note'] || '',
    basic_attack_name: hero['Basic Attack Name'] || '',
    basic_attack_description: hero['Basic Attack Description'] || '',
    skill_1_name: hero['Skill 1 Name'] || '',
    skill_1_description: hero['Skill 1 Description'] || '',
    skill_2_name: hero['Skill 2 Name'] || '',
    skill_2_description: hero['Skill 2 Description'] || '',
    skill_3_name: hero['Skill 3 Name'] || '',
    skill_3_description: hero['Skill 3 Description'] || '',
    skill_4_name: hero['Skill 4 Name'] || '',
    skill_4_description: hero['Skill 4 Description'] || '',
    ultimate_name: hero['Ultimate Name'] || '',
    ultimate_description: hero['Ultimate Description'] || '',
  }));

  heroesCacheTimestamp = Date.now();
  return heroesCache;
}

/**
 * Get all heroes dengan format yang sama seperti response database
 * @returns {Array} Array of heroes dengan lanes (empty array karena CSV tidak punya lanes)
 */
export function getAllHeroesFromCSV() {
  const heroes = parseHeroesCSV();

  return heroes.map((hero) => ({
    ...hero,
    lanes: [], // CSV tidak punya data lanes, return empty array
    counters: [], // CSV tidak punya data counters
  }));
}

/**
 * Get hero by name (case-insensitive)
 * @param {string} heroName - Nama hero
 * @returns {Object|null} Hero object atau null jika tidak ditemukan
 */
export function getHeroByNameFromCSV(heroName) {
  if (!heroName) return null;

  const heroes = parseHeroesCSV();
  const normalizedName = heroName.toLowerCase().trim();

  return heroes.find((hero) => hero.hero_name.toLowerCase().trim() === normalizedName) || null;
}

/**
 * Search heroes by name (partial match, case-insensitive)
 * @param {string} searchTerm - Search term
 * @returns {Array} Array of matching heroes
 */
export function searchHeroesFromCSV(searchTerm) {
  if (!searchTerm) return parseHeroesCSV();

  const heroes = parseHeroesCSV();
  const normalizedTerm = searchTerm.toLowerCase().trim();

  return heroes.filter((hero) => hero.hero_name.toLowerCase().includes(normalizedTerm));
}

/**
 * Get heroes by role
 * @param {string} role - Role filter
 * @returns {Array} Array of heroes dengan role yang cocok
 */
export function getHeroesByRoleFromCSV(role) {
  if (!role) return parseHeroesCSV();

  const heroes = parseHeroesCSV();
  const normalizedRole = role.toLowerCase().trim();

  return heroes.filter((hero) => hero.role.toLowerCase().includes(normalizedRole));
}

/**
 * Get unique roles dari heroes.csv
 * @returns {Array} Array of unique roles
 */
export function getUniqueRolesFromCSV() {
  const heroes = parseHeroesCSV();
  const roles = new Set();

  heroes.forEach((hero) => {
    if (hero.role) {
      // Split by '/' untuk handle multiple roles (e.g., "Tank/Mage")
      hero.role.split('/').forEach((r) => roles.add(r.trim()));
    }
  });

  return Array.from(roles).sort();
}

/**
 * Clear cache (useful untuk development/testing)
 */
export function clearHeroesCache() {
  heroesCache = null;
  heroesCacheTimestamp = null;
}

/**
 * Get hero count
 * @returns {number} Jumlah heroes
 */
export function getHeroesCount() {
  return parseHeroesCSV().length;
}

/**
 * Validate hero exists
 * @param {string} heroName - Nama hero
 * @returns {boolean} True jika hero exists
 */
export function heroExistsInCSV(heroName) {
  return getHeroByNameFromCSV(heroName) !== null;
}

// Default export untuk backward compatibility
export default {
  parseHeroesCSV,
  getAllHeroesFromCSV,
  getHeroByNameFromCSV,
  searchHeroesFromCSV,
  getHeroesByRoleFromCSV,
  getUniqueRolesFromCSV,
  clearHeroesCache,
  getHeroesCount,
  heroExistsInCSV,
};
