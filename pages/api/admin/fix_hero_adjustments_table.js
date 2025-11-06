import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check if skill column exists
    const checkResult = await query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'hero_adjustments' AND COLUMN_NAME = 'skill'`
    )

    if (!checkResult || checkResult.length === 0) {
      // Column doesn't exist, add it
      await query(
        `ALTER TABLE hero_adjustments ADD COLUMN skill VARCHAR(100) NULL`
      )
      return res.status(200).json({ ok: true, message: 'skill column added' })
    }

    return res.status(200).json({ ok: true, message: 'skill column already exists' })
  } catch (e) {
    console.error('[fix_hero_adjustments_table] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
