import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check if additional_note column exists
    const checkColumn = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'heroes' 
      AND COLUMN_NAME = 'additional_note'
    `)

    // If column doesn't exist, add it
    if (checkColumn.length === 0) {
      await query(`
        ALTER TABLE heroes 
        ADD COLUMN additional_note TEXT NULL AFTER ultimate_desc
      `)
      console.log('Added additional_note column to heroes table')
    }

    const { hero_name, additional_note } = req.body

    if (!hero_name) {
      return res.status(400).json({ error: 'hero_name is required' })
    }

    // Check if hero exists
    const heroExists = await query(
      'SELECT hero_name FROM heroes WHERE LOWER(hero_name) = LOWER(?) LIMIT 1',
      [hero_name]
    )

    if (!heroExists || heroExists.length === 0) {
      return res.status(404).json({ error: 'Hero not found' })
    }

    // Update the additional_note
    await query(
      'UPDATE heroes SET additional_note = ? WHERE LOWER(hero_name) = LOWER(?)',
      [additional_note || null, hero_name]
    )

    return res.status(200).json({ 
      success: true, 
      message: 'Additional note updated successfully',
      hero_name: hero_name,
      additional_note: additional_note
    })

  } catch (error) {
    console.error('Error updating additional note:', error)
    return res.status(500).json({ 
      error: 'Failed to update additional note', 
      details: error.message 
    })
  }
}