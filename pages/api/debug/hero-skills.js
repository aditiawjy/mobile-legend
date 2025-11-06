import { query } from '../../../lib/db'

export default async function handler(req, res) {
  const { name } = req.query
  
  if (!name) {
    return res.status(400).json({ error: 'Hero name is required' })
  }
  
  try {
    // Check if hero exists
    const heroCheck = await query(
      'SELECT hero_name FROM heroes WHERE TRIM(LOWER(hero_name)) = TRIM(LOWER(?)) LIMIT 1',
      [name]
    )
    
    if (!heroCheck || heroCheck.length === 0) {
      return res.status(404).json({ error: 'Hero not found in database' })
    }
    
    // Get skill data
    const skillData = await query(
      'SELECT skill1_name, skill1_desc, skill2_name, skill2_desc, skill3_name, skill3_desc, ultimate_name, ultimate_desc, skill4_name, skill4_desc FROM heroes WHERE TRIM(LOWER(hero_name)) = TRIM(LOWER(?)) LIMIT 1',
      [name]
    )
    
    if (!skillData || skillData.length === 0) {
      return res.status(404).json({ error: 'Skill data not found' })
    }
    
    // Check which fields are empty
    const data = skillData[0]
    const emptyFields = Object.keys(data).filter(key => !data[key] || data[key].toString().trim() === '')
    const filledFields = Object.keys(data).filter(key => data[key] && data[key].toString().trim() !== '')
    
    return res.status(200).json({
      hero_name: heroCheck[0].hero_name,
      skill_data: data,
      empty_fields: emptyFields,
      filled_fields: filledFields,
      all_fields_empty: emptyFields.length === Object.keys(data).length
    })
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ error: 'Database query failed', details: error.message })
  }
}
