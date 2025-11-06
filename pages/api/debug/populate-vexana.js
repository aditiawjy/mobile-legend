import { query } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    // Check if Vexana exists
    const heroCheck = await query(
      'SELECT hero_name FROM heroes WHERE TRIM(LOWER(hero_name)) = TRIM(LOWER(?)) LIMIT 1',
      ['Vexana']
    )
    
    if (!heroCheck || heroCheck.length === 0) {
      return res.status(404).json({ error: 'Hero Vexana not found in database' })
    }
    
    // Populate dummy data for Vexana
    const dummyData = {
      skill1_name: 'Shadow Wave',
      skill1_desc: 'Mengirimkan gelombang energi ke target yang memberikan damage dan menyembuhkan diri sendiri.',
      skill2_name: 'Spirit Call',
      skill2_desc: 'Memanggil roh untuk menyerang musuh terdekat dan memberikan damage berkelanjutan.',
      skill3_name: 'Nightmare',
      skill3_desc: 'Mengubah area menjadi mimpi buruk yang memperlambat musuh dan memberikan damage.',
      ultimate_name: 'Torment',
      ultimate_desc: 'Mengutuk musuh yang menyebabkan damage besar dan efek kontrol yang kuat.',
      skill4_name: 'Shadow Step',
      skill4_desc: 'Bergerak cepat ke belakang musuh dan memberikan damage tambahan.'
    }
    
    // Update the hero with dummy data
    const updateFields = Object.keys(dummyData).map(key => `${key} = ?`).join(', ')
    const updateValues = [...Object.values(dummyData), 'Vexana']
    
    const result = await query(
      `UPDATE heroes SET ${updateFields} WHERE TRIM(LOWER(hero_name)) = TRIM(LOWER(?))`,
      updateValues
    )
    
    return res.status(200).json({ 
      message: 'Successfully populated dummy data for Vexana', 
      data: dummyData,
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ error: 'Failed to populate dummy data', details: error.message })
  }
}
