import { query } from '../../../lib/db'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('[HEROES-CSV] Starting heroes export...')
    
    // Fetch all heroes from database
    const heroes = await query(
      `SELECT hero_name, role, damage_type, note, attack_reliance
       FROM heroes 
       ORDER BY hero_name ASC`
    )

    console.log(`[HEROES-CSV] Fetched ${heroes ? heroes.length : 0} heroes from database`)

    if (!heroes || heroes.length === 0) {
      console.log('[HEROES-CSV] No heroes found in database')
      return res.status(400).json({ error: 'No heroes found in database' })
    }

    // Convert to CSV format
    const csvHeader = 'Hero Name,Role,Damage Type,Attack Reliance,Note\n'
    const csvRows = heroes.map(h => 
      `"${escapeCSV(h.hero_name || '')}","${escapeCSV(h.role || '')}","${escapeCSV(h.damage_type || '')}","${escapeCSV(h.attack_reliance || '')}","${escapeCSV(h.note || '')}"`
    ).join('\n')

    const csvContent = csvHeader + csvRows

    console.log(`[HEROES-CSV] CSV content prepared: ${csvContent.length} bytes, ${heroes.length} heroes`)

    // Save to public/csv folder with single filename
    const csvDir = path.join(process.cwd(), 'public', 'csv')
    console.log(`[HEROES-CSV] CSV directory: ${csvDir}`)
    
    if (!fs.existsSync(csvDir)) {
      console.log('[HEROES-CSV] Creating CSV directory...')
      fs.mkdirSync(csvDir, { recursive: true })
    }

    const filepath = path.join(csvDir, 'heroes.csv')
    console.log(`[HEROES-CSV] Writing to: ${filepath}`)
    
    // Force write with explicit encoding
    fs.writeFileSync(filepath, csvContent, { encoding: 'utf-8', flag: 'w' })
    
    console.log('[HEROES-CSV] File written successfully')

    const stats = fs.statSync(filepath)
    console.log(`[HEROES-CSV] File stats - Size: ${stats.size} bytes, Modified: ${stats.mtime}`)
    
    console.log(`[HEROES-CSV] Success! Heroes CSV updated: heroes.csv (${heroes.length} heroes, ${stats.size} bytes)`)

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
    console.error('[HEROES-CSV] ERROR:', e.message)
    console.error('[HEROES-CSV] Full error:', e)
    return res.status(500).json({ 
      error: 'Server error', 
      details: e.message,
      code: e.code
    })
  }
}

function escapeCSV(str) {
  if (!str) return ''
  // Escape quotes and handle commas
  return str.replace(/"/g, '""')
}
