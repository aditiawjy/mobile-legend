const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function generateHeroesCSV() {
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
    
    // Fetch heroes
    console.log('Fetching heroes from database...')
    const [heroes] = await connection.execute(
      `SELECT hero_name, role, damage_type, note, attack_reliance
       FROM heroes 
       ORDER BY hero_name ASC`
    )
    
    console.log(`Found ${heroes.length} heroes`)
    
    if (heroes.length === 0) {
      console.log('No heroes found in database!')
      return
    }
    
    // Generate CSV
    const csvHeader = 'Hero Name,Role,Damage Type,Attack Reliance,Note\n'
    
    const csvRows = heroes.map(hero => {
      const escapeCSV = (str) => {
        if (!str) return ''
        return String(str).replace(/"/g, '""')
      }
      
      return `"${escapeCSV(hero.hero_name || '')}","${escapeCSV(hero.role || '')}","${escapeCSV(hero.damage_type || '')}","${escapeCSV(hero.attack_reliance || '')}","${escapeCSV(hero.note || '')}"`
    }).join('\n')
    
    const csvContent = csvHeader + csvRows
    
    // Save to file
    const csvDir = path.join(__dirname, '..', 'public', 'csv')
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true })
    }
    
    const filepath = path.join(csvDir, 'heroes.csv')
    fs.writeFileSync(filepath, csvContent, 'utf-8')
    
    const stats = fs.statSync(filepath)
    
    console.log(`✅ Success! Heroes CSV generated:`)
    console.log(`   File: ${filepath}`)
    console.log(`   Heroes: ${heroes.length}`)
    console.log(`   Size: ${stats.size} bytes`)
    console.log(`   First hero: ${heroes[0].hero_name}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

generateHeroesCSV()
