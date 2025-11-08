import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Sample hero lanes data - you can expand this list
    const heroLanesData = [
      // Marksman - Gold Lane
      { hero_name: 'Layla', lane_name: 'Gold Lane', priority: 1 },
      { hero_name: 'Miya', lane_name: 'Gold Lane', priority: 1 },
      { hero_name: 'Clint', lane_name: 'Gold Lane', priority: 1 },
      { hero_name: 'Irithel', lane_name: 'Gold Lane', priority: 1 },
      { hero_name: 'Karrie', lane_name: 'Gold Lane', priority: 1 },
      { hero_name: 'Claude', lane_name: 'Gold Lane', priority: 1 },
      { hero_name: 'Lesley', lane_name: 'Gold Lane', priority: 1 },
      { hero_name: 'Melissa', lane_name: 'Gold Lane', priority: 1 },
      
      // Some marksman can also jungle
      { hero_name: 'Claude', lane_name: 'Jungling', priority: 2 },
      
      // Fighters - Exp Lane
      { hero_name: 'Balmond', lane_name: 'Exp Lane', priority: 1 },
      { hero_name: 'Hilda', lane_name: 'Exp Lane', priority: 1 },
      { hero_name: 'Martis', lane_name: 'Exp Lane', priority: 1 },
      { hero_name: 'Cici', lane_name: 'Exp Lane', priority: 1 },
      { hero_name: 'Fredrinn', lane_name: 'Exp Lane', priority: 1 },
      { hero_name: 'Arlott', lane_name: 'Exp Lane', priority: 1 },
      
      // Some fighters can jungle
      { hero_name: 'Balmond', lane_name: 'Jungling', priority: 2 },
      { hero_name: 'Fredrinn', lane_name: 'Jungling', priority: 2 },
      { hero_name: 'Arlott', lane_name: 'Jungling', priority: 1 },
      
      // Mages - Mid Lane
      { hero_name: 'Eudora', lane_name: 'Mid Lane', priority: 1 },
      { hero_name: 'Cyclops', lane_name: 'Mid Lane', priority: 1 },
      { hero_name: 'Lunox', lane_name: 'Mid Lane', priority: 1 },
      { hero_name: 'Cecilion', lane_name: 'Mid Lane', priority: 1 },
      { hero_name: 'Harley', lane_name: 'Mid Lane', priority: 1 },
      { hero_name: 'Nana', lane_name: 'Mid Lane', priority: 1 },
      { hero_name: 'Change', lane_name: 'Mid Lane', priority: 1 },
      { hero_name: 'Luo Yi', lane_name: 'Mid Lane', priority: 1 },
      
      // Some mages can roam
      { hero_name: 'Luo Yi', lane_name: 'Roaming', priority: 2 },
      
      // Assassins - Jungling
      { hero_name: 'Hayabusa', lane_name: 'Jungling', priority: 1 },
      { hero_name: 'Harley', lane_name: 'Jungling', priority: 2 },
      { hero_name: 'Benedetta', lane_name: 'Jungling', priority: 1 },
      { hero_name: 'Julian', lane_name: 'Jungling', priority: 1 },
      
      // Tanks - Roaming
      { hero_name: 'Gatotkaca', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Franco', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Akai', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Khufra', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Grock', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Atlas', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Johnson', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Baxia', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Lolita', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Hylos', lane_name: 'Roaming', priority: 1 },
      
      // Some tanks can exp lane
      { hero_name: 'Gatotkaca', lane_name: 'Exp Lane', priority: 2 },
      { hero_name: 'Grock', lane_name: 'Exp Lane', priority: 2 },
      
      // Supports - Roaming
      { hero_name: 'Estes', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Angela', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Diggie', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Mathilda', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Floryn', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Minotaur', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Carmilla', lane_name: 'Roaming', priority: 1 },
      
      // Fighter/Mage hybrid
      { hero_name: 'Bane', lane_name: 'Exp Lane', priority: 1 },
      { hero_name: 'Bane', lane_name: 'Gold Lane', priority: 2 },
      
      // Tank/Mage
      { hero_name: 'Esmeralda', lane_name: 'Exp Lane', priority: 1 },
      { hero_name: 'Esmeralda', lane_name: 'Jungling', priority: 2 },
      
      // Tank/Fighter
      { hero_name: 'Edith', lane_name: 'Exp Lane', priority: 1 },
      { hero_name: 'Edith', lane_name: 'Roaming', priority: 2 },
      
      // Fighter/Support
      { hero_name: 'Kalea', lane_name: 'Roaming', priority: 1 },
      { hero_name: 'Kalea', lane_name: 'Exp Lane', priority: 2 },
      
      // Marksman/Mage
      { hero_name: 'Kimmy', lane_name: 'Gold Lane', priority: 1 },
      { hero_name: 'Kimmy', lane_name: 'Jungling', priority: 2 },
    ]

    // Get lane IDs first
    const lanes = await query('SELECT id, lane_name FROM lanes')
    const laneMap = {}
    lanes.forEach(lane => {
      laneMap[lane.lane_name] = lane.id
    })

    const inserted = []
    const errors = []
    
    for (const data of heroLanesData) {
      try {
        const laneId = laneMap[data.lane_name]
        if (!laneId) {
          errors.push(`Lane not found: ${data.lane_name}`)
          continue
        }

        await query(
          `INSERT INTO hero_lanes (hero_name, lane_id, priority) 
           VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE priority = VALUES(priority)`,
          [data.hero_name, laneId, data.priority]
        )
        inserted.push(`${data.hero_name} → ${data.lane_name} (priority ${data.priority})`)
      } catch (e) {
        errors.push(`${data.hero_name} → ${data.lane_name}: ${e.message}`)
      }
    }

    return res.status(200).json({ 
      ok: true, 
      message: 'Hero lanes seeded successfully',
      inserted: inserted.length,
      total: heroLanesData.length,
      details: inserted,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (e) {
    console.error('[seed_hero_lanes] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
