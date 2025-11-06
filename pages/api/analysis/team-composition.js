import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { heroNames } = req.body
    
    if (!Array.isArray(heroNames) || heroNames.length === 0) {
      return res.status(400).json({ error: 'heroNames array required' })
    }

    // Fetch all heroes
    const placeholders = heroNames.map(() => 'LOWER(hero_name) = LOWER(?)').join(' OR ')
    const heroes = await query(
      `SELECT hero_name, damage_type, role FROM heroes WHERE ${placeholders}`,
      heroNames
    )

    if (!heroes || heroes.length === 0) {
      return res.status(404).json({ error: 'No heroes found' })
    }

    // Calculate composition
    const composition = {
      physical: 0,
      magic: 0,
      true: 0,
      roleDistribution: {},
      heroes: heroes.map(h => ({
        name: h.hero_name,
        damageType: h.damage_type,
        role: h.role
      }))
    }

    // Count damage types
    heroes.forEach(h => {
      const type = (h.damage_type || 'physical').toLowerCase()
      if (type === 'physical') composition.physical++
      else if (type === 'magic') composition.magic++
      else if (type === 'true') composition.true++
      
      // Track roles
      if (h.role) {
        composition.roleDistribution[h.role] = (composition.roleDistribution[h.role] || 0) + 1
      }
    })

    // Calculate threat level
    const total = heroes.length
    composition.threat = {
      physical: Math.round((composition.physical / total) * 100),
      magic: Math.round((composition.magic / total) * 100),
      true: Math.round((composition.true / total) * 100),
      primary: getPrimaryThreat(composition)
    }

    return res.status(200).json(composition)
  } catch (e) {
    console.error('[TEAM-COMPOSITION] error:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}

function getPrimaryThreat(composition) {
  const threats = [
    { type: 'physical', count: composition.physical },
    { type: 'magic', count: composition.magic },
    { type: 'true', count: composition.true }
  ]
  const primary = threats.sort((a, b) => b.count - a.count)[0]
  return primary.type
}
