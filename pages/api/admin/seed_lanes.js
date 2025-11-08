import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const lanes = [
      {
        name: 'Gold Lane',
        description: 'Lane for marksman and some mages, focused on farming gold and late-game carry potential'
      },
      {
        name: 'Exp Lane',
        description: 'Lane for fighters and tanks, focused on gaining experience and becoming tanky/strong in mid-game'
      },
      {
        name: 'Mid Lane',
        description: 'Lane for mages and assassins, focused on wave clear and roaming to help other lanes'
      },
      {
        name: 'Jungling',
        description: 'Role for assassins, fighters, and some mages/tanks who farm jungle monsters and gank lanes'
      },
      {
        name: 'Roaming',
        description: 'Role for supports and tanks who help all lanes, set up kills, and provide vision/protection'
      }
    ]

    const insertedLanes = []
    for (const lane of lanes) {
      try {
        await query(
          'INSERT INTO lanes (lane_name, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)',
          [lane.name, lane.description]
        )
        insertedLanes.push(lane.name)
      } catch (e) {
        console.error(`Error inserting lane ${lane.name}:`, e.message)
      }
    }

    return res.status(200).json({ 
      ok: true, 
      message: 'Lanes seeded successfully',
      lanes: insertedLanes
    })
  } catch (e) {
    console.error('[seed_lanes] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
