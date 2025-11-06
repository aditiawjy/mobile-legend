const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function generateItemsCSV() {
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
    
    // Fetch items
    console.log('Fetching items from database...')
    const [items] = await connection.execute(
      `SELECT item_name, category, price, attack, attack_speed, crit_chance, armor_pen, spell_vamp, 
              magic_power, hp, armor, magic_resist, movement_speed, cooldown_reduction, mana_regen, 
              hp_regen, description
       FROM items 
       ORDER BY item_name ASC`
    )
    
    console.log(`Found ${items.length} items`)
    
    if (items.length === 0) {
      console.log('No items found in database!')
      return
    }
    
    // Generate CSV
    const csvHeader = 'Item Name,Category,Price,Attack,Attack Speed,Crit Chance,Armor Penetration,Spell Vamp,Magic Power,HP,Armor,Magic Resist,Movement Speed,Cooldown Reduction,Mana Regen,HP Regen,Description\n'
    
    const csvRows = items.map(item => {
      const escapeCSV = (str) => {
        if (!str) return ''
        return String(str).replace(/"/g, '""')
      }
      
      return `"${escapeCSV(item.item_name || '')}","${escapeCSV(item.category || '')}",${item.price || 0},${item.attack || 0},${item.attack_speed || 0},${item.crit_chance || 0},${item.armor_pen || 0},${item.spell_vamp || 0},${item.magic_power || 0},${item.hp || 0},${item.armor || 0},${item.magic_resist || 0},${item.movement_speed || 0},${item.cooldown_reduction || 0},${item.mana_regen || 0},${item.hp_regen || 0},"${escapeCSV(item.description || '')}"`
    }).join('\n')
    
    const csvContent = csvHeader + csvRows
    
    // Save to file
    const csvDir = path.join(__dirname, '..', 'public', 'csv')
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true })
    }
    
    const filepath = path.join(csvDir, 'items.csv')
    fs.writeFileSync(filepath, csvContent, 'utf-8')
    
    const stats = fs.statSync(filepath)
    
    console.log(`✅ Success! Items CSV generated:`)
    console.log(`   File: ${filepath}`)
    console.log(`   Items: ${items.length}`)
    console.log(`   Size: ${stats.size} bytes`)
    console.log(`   First item: ${items[0].item_name}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

generateItemsCSV()
