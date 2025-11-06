import { query } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    // Get ALL data for Lolita to see what's actually in the database
    const allData = await query(
      'SELECT * FROM heroes WHERE TRIM(LOWER(hero_name)) = TRIM(LOWER(?)) LIMIT 1',
      ['Lolita']
    )
    
    if (!allData || allData.length === 0) {
      return res.status(404).json({ error: 'Lolita not found' })
    }
    
    const hero = allData[0]
    
    // Check what columns exist
    const columns = Object.keys(hero)
    
    // Check specifically for skill columns
    const skillColumns = columns.filter(col => col.includes('skill') || col.includes('ultimate'))
    
    return res.status(200).json({
      hero_name: hero.hero_name,
      all_columns: columns,
      skill_columns: skillColumns,
      skill_data: {
        skill1_name: hero.skill1_name,
        skill1_desc: hero.skill1_desc,
        skill2_name: hero.skill2_name,
        skill2_desc: hero.skill2_desc,
        skill3_name: hero.skill3_name,
        skill3_desc: hero.skill3_desc,
        ultimate_name: hero.ultimate_name,
        ultimate_desc: hero.ultimate_desc,
        skill4_name: hero.skill4_name,
        skill4_desc: hero.skill4_desc
      },
      raw_hero_data: hero
    })
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ error: 'Database query failed', details: error.message })
  }
}
