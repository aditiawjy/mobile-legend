import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const csvDir = path.join(process.cwd(), 'public', 'csv')

    // Check if directory exists
    if (!fs.existsSync(csvDir)) {
      return res.status(200).json([])
    }

    // Get all CSV files
    const files = fs.readdirSync(csvDir)
      .filter(f => f.endsWith('.csv'))
      .sort()
      .reverse() // Latest first

    const csvFiles = files.map(filename => {
      const filepath = path.join(csvDir, filename)
      const stats = fs.statSync(filepath)
      return {
        name: filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/csv/${filename}`
      }
    })

    console.log(`[LIST-CSV] Found ${csvFiles.length} CSV files`)
    return res.status(200).json(csvFiles)
  } catch (e) {
    console.error('[LIST-CSV] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}
