import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Cache untuk parsed data
let adjustmentsCache = null;
let adjustmentsCacheTimestamp = null;
const CACHE_DURATION = 60000; // 1 menit

/**
 * Parse hero-adjustments.csv
 * @returns {Array} Array of adjustment objects
 */
function parseAdjustmentsCSV() {
  if (
    adjustmentsCache &&
    adjustmentsCacheTimestamp &&
    Date.now() - adjustmentsCacheTimestamp < CACHE_DURATION
  ) {
    return adjustmentsCache;
  }

  const filePath = path.join(process.cwd(), 'public/csv/hero-adjustments.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true,
    trim: true,
    skip_empty_lines: true,
  });

  // Transform ke format API response
  adjustmentsCache = records.map((record, index) => ({
    id: index + 1, // Generate ID dari index
    hero_name: record['Hero Name'] || '',
    adjustment_date: record['Date'] || null,
    season: record['Season'] || '',
    description: record['Description'] || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  adjustmentsCacheTimestamp = Date.now();
  return adjustmentsCache;
}

/**
 * Get adjustments by hero name (case-insensitive)
 * @param {string} heroName - Nama hero
 * @returns {Array} Array of adjustments untuk hero tersebut
 */
function getAdjustmentsByHeroName(heroName) {
  if (!heroName) return [];

  const adjustments = parseAdjustmentsCSV();
  const normalizedName = heroName.toLowerCase().trim();

  return adjustments.filter((adj) => adj.hero_name.toLowerCase().trim() === normalizedName);
}

/**
 * Get all adjustments dengan optional filtering
 * @param {Object} options - Filter options
 * @param {number} options.limit - Maximum number of results
 * @param {string} options.sort - Sort order (date_desc, date_asc, hero_name)
 * @returns {Array} Array of adjustments
 */
function getAllAdjustments(options = {}) {
  const { limit = 10, sort = 'date_desc' } = options;

  let adjustments = parseAdjustmentsCSV();

  // Filter out empty descriptions
  adjustments = adjustments.filter((adj) => adj.description && adj.description.trim() !== '');

  // Sort
  switch (sort) {
    case 'date_asc':
      adjustments.sort((a, b) => {
        if (!a.adjustment_date) return 1;
        if (!b.adjustment_date) return -1;
        return new Date(a.adjustment_date) - new Date(b.adjustment_date);
      });
      break;
    case 'hero_name':
      adjustments.sort((a, b) => a.hero_name.localeCompare(b.hero_name));
      break;
    case 'date_desc':
    default:
      adjustments.sort((a, b) => {
        if (!a.adjustment_date) return -1;
        if (!b.adjustment_date) return 1;
        return new Date(b.adjustment_date) - new Date(a.adjustment_date);
      });
      break;
  }

  // Apply limit
  return adjustments.slice(0, Math.min(limit, 50));
}

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;
  const name = (raw || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    if (req.method === 'GET') {
      const adjustments = getAdjustmentsByHeroName(name);
      return res.status(200).json(adjustments);
    }

    if (req.method === 'POST') {
      // POST not supported with CSV storage
      return res.status(501).json({
        error: 'Creating adjustments via API is not supported with CSV storage',
        message: 'Please add adjustments directly to public/csv/hero-adjustments.csv file',
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[ADJ] error:', e);
    return res.status(200).json([]);
  }
}

export { parseAdjustmentsCSV, getAdjustmentsByHeroName, getAllAdjustments };
