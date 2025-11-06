import { query } from '../../../lib/db'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Save to public/csv folder
    const csvDir = path.join(process.cwd(), 'public', 'csv')
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const filename = `heroes-${timestamp}.csv`
    const filepath = path.join(csvDir, filename)

    fs.writeFileSync(filepath, csvContent, 'utf-8')

    // Also keep a "latest" copy
    const latestPath = path.join(csvDir, 'heroes-latest.csv')
    fs.writeFileSync(latestPath, csvContent, 'utf-8')

    console.log(`[EXPORT] CSV generated: ${filename} (${heroes.length} heroes)`)

    // Return download response
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="heroes-${timestamp}.csv"`)
    return res.status(200).send(csvContent)
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
