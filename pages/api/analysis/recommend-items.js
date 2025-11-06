import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { threatType, limit = 8 } = req.body
    
    if (!threatType || !['physical', 'magic', 'true'].includes(threatType)) {
      return res.status(400).json({ error: 'Valid threatType required: physical, magic, or true' })
    }

    // Query items with defense stats based on threat type
    let items = []
    
    if (threatType === 'physical') {
      // Items with high armor or physical defense
      items = await query(
        `SELECT item_name, price, armor, hp, category, description, cooldown_reduction
         FROM items 
         WHERE armor > 0 OR (hp > 0 AND armor IS NOT NULL)
         ORDER BY (COALESCE(armor, 0) + COALESCE(hp, 0) / 10) / price DESC
         LIMIT ?`,
        [limit]
      )
    } else if (threatType === 'magic') {
      // Items with high magic resist or magic defense
      items = await query(
        `SELECT item_name, price, magic_resist, hp, category, description, cooldown_reduction
         FROM items 
         WHERE magic_resist > 0 OR (hp > 0 AND magic_resist IS NOT NULL)
         ORDER BY (COALESCE(magic_resist, 0) + COALESCE(hp, 0) / 10) / price DESC
         LIMIT ?`,
        [limit]
      )
    } else if (threatType === 'true') {
      // Items that counter true damage (heal/regen items)
      items = await query(
        `SELECT item_name, price, hp_regen, mana_regen, cooldown_reduction, category, description
         FROM items 
         WHERE hp_regen > 0 OR mana_regen > 0 OR cooldown_reduction > 0
         ORDER BY (COALESCE(hp_regen, 0) + COALESCE(cooldown_reduction, 0)) / price DESC
         LIMIT ?`,
        [limit]
      )
    }

    if (!items || items.length === 0) {
      return res.status(200).json([])
    }

    // Calculate efficiency for each item
    const formattedItems = items.map(item => {
      let defense_stat = 0
      let stat_name = ''
      
      if (threatType === 'physical') {
        defense_stat = (item.armor || 0) + (item.hp || 0) / 10
        stat_name = 'Physical Defense'
      } else if (threatType === 'magic') {
        defense_stat = (item.magic_resist || 0) + (item.hp || 0) / 10
        stat_name = 'Magic Defense'
      } else if (threatType === 'true') {
        defense_stat = (item.hp_regen || 0) + (item.cooldown_reduction || 0)
        stat_name = 'True Defense'
      }

      return {
        name: item.item_name,
        category: item.category || 'Item',
        price: item.price || 0,
        defense_stat: Math.round(defense_stat * 10) / 10,
        stat_name: stat_name,
        efficiency: item.price > 0 ? Math.round((defense_stat / item.price) * 100) / 100 : 0,
        description: item.description || ''
      }
    })

    return res.status(200).json(formattedItems)
  } catch (e) {
    console.error('[RECOMMEND-ITEMS] error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
