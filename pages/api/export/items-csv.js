import { query } from '../../../lib/db'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('[ITEMS-CSV] Starting items export...')
    
    // Fetch all items from database
    const items = await query(
      `SELECT item_name, category, price, attack, attack_speed, crit_chance, armor_pen, spell_vamp, 
              magic_power, hp, armor, magic_resist, movement_speed, cooldown_reduction, mana_regen, 
              hp_regen, description
       FROM items 
       ORDER BY item_name ASC`
    )

    console.log(`[ITEMS-CSV] Fetched ${items ? items.length : 0} items from database`)

    if (!items || items.length === 0) {
      console.log('[ITEMS-CSV] No items found in database')
      return res.status(400).json({ error: 'No items found in database' })
    }

    // Convert to CSV format
    const csvHeader = 'Item Name,Category,Price,Attack,Attack Speed,Crit Chance,Armor Penetration,Spell Vamp,Magic Power,HP,Armor,Magic Resist,Movement Speed,Cooldown Reduction,Mana Regen,HP Regen,Description\n'
    const csvRows = items.map(item => 
      `"${escapeCSV(item.item_name || '')}","${escapeCSV(item.category || '')}",${item.price || 0},${item.attack || 0},${item.attack_speed || 0},${item.crit_chance || 0},${item.armor_pen || 0},${item.spell_vamp || 0},${item.magic_power || 0},${item.hp || 0},${item.armor || 0},${item.magic_resist || 0},${item.movement_speed || 0},${item.cooldown_reduction || 0},${item.mana_regen || 0},${item.hp_regen || 0},"${escapeCSV(item.description || '')}"`
    ).join('\n')

    const csvContent = csvHeader + csvRows

    // Save to public/csv folder with single filename
    const csvDir = path.join(process.cwd(), 'public', 'csv')
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true })
    }

    const filepath = path.join(csvDir, 'items.csv')
    fs.writeFileSync(filepath, csvContent, 'utf-8')

    const stats = fs.statSync(filepath)
    
    console.log(`[ITEMS-CSV] Success! Items CSV updated: items.csv (${items.length} items, ${stats.size} bytes)`)

    // Return success response
    return res.status(200).json({ 
      success: true,
      message: 'Items CSV updated successfully',
      filename: 'items.csv',
      itemCount: items.length,
      fileSize: stats.size,
      url: '/csv/items.csv'
    })
  } catch (e) {
    console.error('[ITEMS-CSV] ERROR:', e.message)
    console.error('[ITEMS-CSV] Full error:', e)
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
