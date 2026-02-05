import { getAllItemsFromCSV } from '../../../lib/itemsCSV';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { threatType, limit = 8 } = req.body;

    if (!threatType || !['physical', 'magic', 'true'].includes(threatType)) {
      return res.status(400).json({ error: 'Valid threatType required: physical, magic, or true' });
    }

    // Get all items from CSV
    const allItems = getAllItemsFromCSV();
    let items = [];

    if (threatType === 'physical') {
      // Items with high armor or physical defense
      items = allItems
        .filter((item) => item.armor > 0 || item.hp > 0)
        .sort((a, b) => {
          const aDefense = (a.armor || 0) + (a.hp || 0) / 10;
          const bDefense = (b.armor || 0) + (b.hp || 0) / 10;
          const aEfficiency = a.price > 0 ? aDefense / a.price : 0;
          const bEfficiency = b.price > 0 ? bDefense / b.price : 0;
          return bEfficiency - aEfficiency;
        })
        .slice(0, limit);
    } else if (threatType === 'magic') {
      // Items with high magic resist or magic defense
      items = allItems
        .filter((item) => item.magic_resist > 0 || item.hp > 0)
        .sort((a, b) => {
          const aDefense = (a.magic_resist || 0) + (a.hp || 0) / 10;
          const bDefense = (b.magic_resist || 0) + (b.hp || 0) / 10;
          const aEfficiency = a.price > 0 ? aDefense / a.price : 0;
          const bEfficiency = b.price > 0 ? bDefense / b.price : 0;
          return bEfficiency - aEfficiency;
        })
        .slice(0, limit);
    } else if (threatType === 'true') {
      // Items that counter true damage (heal/regen items)
      items = allItems
        .filter((item) => item.hp_regen > 0 || item.mana_regen > 0 || item.cooldown_reduction > 0)
        .sort((a, b) => {
          const aDefense = (a.hp_regen || 0) + (a.cooldown_reduction || 0);
          const bDefense = (b.hp_regen || 0) + (b.cooldown_reduction || 0);
          const aEfficiency = a.price > 0 ? aDefense / a.price : 0;
          const bEfficiency = b.price > 0 ? bDefense / b.price : 0;
          return bEfficiency - aEfficiency;
        })
        .slice(0, limit);
    }

    if (!items || items.length === 0) {
      return res.status(200).json([]);
    }

    // Calculate efficiency for each item
    const formattedItems = items.map((item) => {
      let defense_stat = 0;
      let stat_name = '';

      if (threatType === 'physical') {
        defense_stat = (item.armor || 0) + (item.hp || 0) / 10;
        stat_name = 'Physical Defense';
      } else if (threatType === 'magic') {
        defense_stat = (item.magic_resist || 0) + (item.hp || 0) / 10;
        stat_name = 'Magic Defense';
      } else if (threatType === 'true') {
        defense_stat = (item.hp_regen || 0) + (item.cooldown_reduction || 0);
        stat_name = 'True Defense';
      }

      return {
        name: item.item_name,
        category: item.category || 'Item',
        price: item.price || 0,
        defense_stat: Math.round(defense_stat * 10) / 10,
        stat_name: stat_name,
        efficiency: item.price > 0 ? Math.round((defense_stat / item.price) * 100) / 100 : 0,
        description: item.description || '',
      };
    });

    return res.status(200).json(formattedItems);
  } catch (e) {
    console.error('[RECOMMEND-ITEMS] error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
