import { query } from '../../../lib/db'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Fetch all heroes from database
    const heroes = await query(
      `SELECT hero_name, role, damage_type, note, attack_reliance
       FROM heroes 
       ORDER BY hero_name ASC`
    )

    if (!heroes || heroes.length === 0) {
      return res.status(400).json({ error: 'No heroes found' })
    }

    // Convert to CSV format
    const csvHeader = 'Hero Name,Role,Damage Type,Attack Reliance,Note\n'
    const csvRows = heroes.map(h => 
      `"${escapeCSV(h.hero_name || '')}","${escapeCSV(h.role || '')}","${escapeCSV(h.damage_type || '')}","${escapeCSV(h.attack_reliance || '')}","${escapeCSV(h.note || '')}"`
    ).join('\n')

    const csvContent = csvHeader + csvRows

    // Save to public/csv folder with single filename
    const csvDir = path.join(process.cwd(), 'public', 'csv')
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true })
    }

    const filepath = path.join(csvDir, 'heroes.csv')
    fs.writeFileSync(filepath, csvContent, 'utf-8')

    const stats = fs.statSync(filepath)
    
    console.log(`[EXPORT] CSV updated: heroes.csv (${heroes.length} heroes, ${stats.size} bytes)`)

    // Return success response
    return res.status(200).json({ 
      success: true,
      message: 'CSV updated successfully',
      filename: 'heroes.csv',
      heroCount: heroes.length,
      fileSize: stats.size,
      url: '/csv/heroes.csv'
    })
  } catch (e) {
    console.error('[EXPORT-CSV] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}

function escapeCSV(str) {
  if (!str) return ''
  // Escape quotes and handle commas
  return str.replace(/"/g, '""')
}
