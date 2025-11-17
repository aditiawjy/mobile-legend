// Lane icon mapping (UI concern, not database concern)
// Icons are kept in frontend for easy customization without DB changes
export const LANE_ICONS = {
  'Gold Lane': '💰',
  'Exp Lane': '⚔️',
  'Mid Lane': '🎯',
  'Jungling': '🌳',
  'Roaming': '🛡️',
};

// Default lane order (can be overridden by DB order)
export const DEFAULT_LANE_ORDER = [
  'Gold Lane',
  'Exp Lane',
  'Mid Lane',
  'Jungling',
  'Roaming',
];

/**
 * Transform DB lanes data into UI-ready format
 * @param {Array} dbLanes - Lanes from database (id, lane_name, description)
 * @returns {Array} - UI-ready lanes with icon and label
 */
export function transformLanesToUI(dbLanes) {
  if (!dbLanes || !Array.isArray(dbLanes)) {
    return getDefaultLanes();
  }

  return dbLanes.map(lane => ({
    id: lane.id,
    label: lane.lane_name,
    lane: lane.lane_name,
    icon: LANE_ICONS[lane.lane_name] || '🔵', // Fallback icon
    description: lane.description,
  }));
}

/**
 * Get default hardcoded lanes (fallback if API fails)
 * @returns {Array}
 */
export function getDefaultLanes() {
  return [
    { id: 1, label: 'Gold Lane', lane: 'Gold Lane', icon: '💰' },
    { id: 2, label: 'Exp Lane', lane: 'Exp Lane', icon: '⚔️' },
    { id: 3, label: 'Mid Lane', lane: 'Mid Lane', icon: '🎯' },
    { id: 4, label: 'Jungling', lane: 'Jungling', icon: '🌳' },
    { id: 5, label: 'Roaming', lane: 'Roaming', icon: '🛡️' },
  ];
}

/**
 * Fetch lanes from API with caching
 * @returns {Promise<Array>}
 */
export async function fetchLanes() {
  try {
    const response = await fetch('/api/lanes');
    if (!response.ok) {
      console.warn('Failed to fetch lanes from API, using default');
      return getDefaultLanes();
    }
    const dbLanes = await response.json();
    return transformLanesToUI(dbLanes);
  } catch (error) {
    console.error('Error fetching lanes:', error);
    return getDefaultLanes();
  }
}
