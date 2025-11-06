import { query } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    // Check if Lolita exists
    const heroCheck = await query(
      'SELECT hero_name FROM heroes WHERE TRIM(LOWER(hero_name)) = TRIM(LOWER(?)) LIMIT 1',
      ['Lolita']
    )
    
    if (!heroCheck || heroCheck.length === 0) {
      return res.status(404).json({ error: 'Hero Lolita not found in database' })
    }
    
    // Populate dummy data for Lolita
    const dummyData = {
      skill1_name: 'Charge!',
      skill1_desc: 'Lolita bergerak maju dan memberikan damage kepada musuh di jalurnya, sambil mengurangi cooldown skill lain.',
      skill2_name: 'Guardian\'s Bulwark',
      skill2_desc: 'Lolita mengangkat perisai untuk memblokir projectile musuh dan memberikan shield kepada ally terdekat.',
      skill3_name: 'Noumenon Blast',
      skill3_desc: 'Lolita melepaskan energi dari hammernya yang memberikan damage area dan memperlambat musuh.',
      ultimate_name: 'Pulverize',
      ultimate_desc: 'Lolita melompat tinggi dan menghantam tanah dengan kekuatan penuh, memberikan damage besar dan stun kepada musuh di area.',
      skill4_name: 'Energy Absorption',
      skill4_desc: 'Pasif: Lolita menyerap energi dari skill musuh yang diblokir untuk mengurangi cooldown skillnya.'
    }
    
    // Update the hero with dummy data
    const updateFields = Object.keys(dummyData).map(key => `${key} = ?`).join(', ')
    const updateValues = [...Object.values(dummyData), 'Lolita']
    
    const result = await query(
      `UPDATE heroes SET ${updateFields} WHERE TRIM(LOWER(hero_name)) = TRIM(LOWER(?))`,
      updateValues
    )
    
    return res.status(200).json({ 
      message: 'Successfully populated dummy data for Lolita', 
      data: dummyData,
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ error: 'Failed to populate dummy data', details: error.message })
  }
}
