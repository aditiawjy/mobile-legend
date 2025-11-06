const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function generateHeroAdjustmentsCSV() {
  let connection
  
  try {
    console.log('Connecting to database...')
    
    // Load environment variables manually
    const envPath = path.join(__dirname, '..', '.env.local')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8')
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          process.env[key.trim()] = value
        }
      })
    }
    
    console.log(`DB Config: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    })
    
    console.log('Connected to database!')
    
    // Fetch hero adjustments
    console.log('Fetching hero adjustments from database...')
    const [adjustments] = await connection.execute(
      `SELECT hero_name, adj_date, season, description
       FROM hero_adjustments 
       ORDER BY adj_date DESC, hero_name ASC`
    )
    
    console.log(`Found ${adjustments.length} hero adjustments`)
    
    if (adjustments.length === 0) {
      console.log('No hero adjustments found in database!')
      return
    }
    
    // Generate CSV
    const csvHeader = 'Hero Name,Date,Season,Description\n'
    
    const csvRows = adjustments.map(adj => {
      const escapeCSV = (str) => {
        if (!str) return ''
        return String(str).replace(/"/g, '""')
      }
      
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
    
    // Save to file
    const csvDir = path.join(__dirname, '..', 'public', 'csv')
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true })
    }
    
    const filepath = path.join(csvDir, 'hero-adjustments.csv')
    fs.writeFileSync(filepath, csvContent, 'utf-8')
    
    const stats = fs.statSync(filepath)
    
    console.log(`✅ Success! Hero Adjustments CSV generated:`)
    console.log(`   File: ${filepath}`)
    console.log(`   Adjustments: ${adjustments.length}`)
    console.log(`   Size: ${stats.size} bytes`)
    console.log(`   First adjustment: ${adjustments[0].hero_name} (${adjustments[0].season})`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

generateHeroAdjustmentsCSV()
