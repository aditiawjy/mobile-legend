import { query } from '../../../lib/db'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting battle spells CSV export...')
    
    // Get all battle spells from database
    const spells = await query('SELECT * FROM battle_spells ORDER BY id')
    console.log(`Found ${spells.length} battle spells`)

    if (spells.length === 0) {
      return res.status(404).json({ error: 'No battle spells found' })
    }

    // Get column names from first row
    const columns = Object.keys(spells[0])
    
    // Create CSV header
    let csvContent = columns.join(',') + '\n'
    
    // Add data rows
    spells.forEach(spell => {
      const row = columns.map(col => {
        const value = spell[col]
        // Handle null/undefined
        if (value === null || value === undefined) return ''
        // Escape quotes and wrap in quotes if contains comma or newline
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return '"' + stringValue.replace(/"/g, '""') + '"'
        }
        return stringValue
      })
      csvContent += row.join(',') + '\n'
    })

    // Write to file
    const csvPath = path.join(process.cwd(), 'public', 'csv', 'battle-spells.csv')
    fs.writeFileSync(csvPath, csvContent, 'utf8')
    
    console.log(`Battle spells CSV exported successfully to ${csvPath}`)

    res.status(200).json({
      success: true,
      message: 'Battle spells CSV updated successfully',
      spellCount: spells.length,
      path: '/csv/battle-spells.csv'
    })
  } catch (error) {
    console.error('Error exporting battle spells CSV:', error)
    res.status(500).json({
      error: 'Failed to export battle spells CSV',
      message: error.message
    })
  }
}
