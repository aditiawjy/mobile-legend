import { query } from '../../../lib/db'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('[HERO-ADJUSTMENTS-CSV] Starting hero adjustments export...')
    
    // Fetch all hero adjustments from database
    const adjustments = await query(
      `SELECT hero_name, adj_date, season, description
       FROM hero_adjustments 
       ORDER BY adj_date DESC, hero_name ASC`
    )

    console.log(`[HERO-ADJUSTMENTS-CSV] Fetched ${adjustments ? adjustments.length : 0} adjustments from database`)

    if (!adjustments || adjustments.length === 0) {
      console.log('[HERO-ADJUSTMENTS-CSV] No adjustments found in database')
      return res.status(400).json({ error: 'No hero adjustments found in database' })
    }

    // Convert to CSV format
    const csvHeader = 'Hero Name,Date,Season,Description\n'
    
    const csvRows = adjustments.map(adj => {
      // Format date to dd-mm-yyyy
      let formattedDate = ''
      if (adj.adj_date) {
        const date = new Date(adj.adj_date)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        formattedDate = `${day}-${month}-${year}`
      }
      
      return `"${escapeCSV(adj.hero_name || '')}","${formattedDate}","${escapeCSV(adj.season || '')}","${escapeCSV(adj.description || '')}"`
    }).join('\n')

    const csvContent = csvHeader + csvRows

    console.log(`[HERO-ADJUSTMENTS-CSV] CSV content prepared: ${csvContent.length} bytes, ${adjustments.length} adjustments`)

    // Save to public/csv folder with single filename
    const csvDir = path.join(process.cwd(), 'public', 'csv')
    console.log(`[HERO-ADJUSTMENTS-CSV] CSV directory: ${csvDir}`)
    
    if (!fs.existsSync(csvDir)) {
      console.log('[HERO-ADJUSTMENTS-CSV] Creating CSV directory...')
      fs.mkdirSync(csvDir, { recursive: true })
    }

    const filepath = path.join(csvDir, 'hero-adjustments.csv')
    console.log(`[HERO-ADJUSTMENTS-CSV] Writing to: ${filepath}`)
    
    // Force write with explicit encoding
    fs.writeFileSync(filepath, csvContent, { encoding: 'utf-8', flag: 'w' })
    
    console.log('[HERO-ADJUSTMENTS-CSV] File written successfully')

    const stats = fs.statSync(filepath)
    console.log(`[HERO-ADJUSTMENTS-CSV] File stats - Size: ${stats.size} bytes, Modified: ${stats.mtime}`)
    
    console.log(`[HERO-ADJUSTMENTS-CSV] Success! Hero Adjustments CSV updated: hero-adjustments.csv (${adjustments.length} adjustments, ${stats.size} bytes)`)

    // Return success response
    return res.status(200).json({ 
      success: true,
      message: 'CSV updated successfully',
      filename: 'hero-adjustments.csv',
      adjustmentCount: adjustments.length,
      fileSize: stats.size,
      url: '/csv/hero-adjustments.csv'
    })
  } catch (e) {
    console.error('[HERO-ADJUSTMENTS-CSV] ERROR:', e.message)
    console.error('[HERO-ADJUSTMENTS-CSV] Full error:', e)
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
  return String(str).replace(/"/g, '""')
}
