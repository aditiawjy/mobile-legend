import { query } from '../../../lib/db'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting emblems CSV export...')
    
    // Get all emblems from database
    const emblems = await query('SELECT * FROM emblems ORDER BY id')
    console.log(`Found ${emblems.length} emblems`)

    if (emblems.length === 0) {
      return res.status(404).json({ error: 'No emblems found' })
    }

    // Get column names from first row
    const columns = Object.keys(emblems[0])
    
    // Create CSV header
    let csvContent = columns.join(',') + '\n'
    
    // Add data rows
    emblems.forEach(emblem => {
      const row = columns.map(col => {
        const value = emblem[col]
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
    const csvPath = path.join(process.cwd(), 'public', 'csv', 'emblems.csv')
    fs.writeFileSync(csvPath, csvContent, 'utf8')
    
    console.log(`Emblems CSV exported successfully to ${csvPath}`)

    res.status(200).json({
      success: true,
      message: 'Emblems CSV updated successfully',
      emblemCount: emblems.length,
      path: '/csv/emblems.csv'
    })
  } catch (error) {
    console.error('Error exporting emblems CSV:', error)
    res.status(500).json({
      error: 'Failed to export emblems CSV',
      message: error.message
    })
  }
}
