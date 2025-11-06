import { query } from '../../../lib/db'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const csvDir = path.join(process.cwd(), 'public', 'csv')
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true })
    }

    const results = {
      heroes: null,
      items: null,
      errors: []
    }

    // Generate Heroes CSV
    try {
      const heroes = await query(
        `SELECT hero_name, role, damage_type, note, attack_reliance
         FROM heroes 
         ORDER BY hero_name ASC`
      )

      if (heroes && heroes.length > 0) {
        const csvHeader = 'Hero Name,Role,Damage Type,Attack Reliance,Note\n'
        const csvRows = heroes.map(h => 
          `"${escapeCSV(h.hero_name || '')}","${escapeCSV(h.role || '')}","${escapeCSV(h.damage_type || '')}","${escapeCSV(h.attack_reliance || '')}","${escapeCSV(h.note || '')}"`
        ).join('\n')
        
        const heroesPath = path.join(csvDir, 'heroes.csv')
        fs.writeFileSync(heroesPath, csvHeader + csvRows, 'utf-8')
        results.heroes = { count: heroes.length, status: 'success' }
      }
    } catch (e) {
      results.errors.push(`Heroes CSV: ${e.message}`)
    }

    // Generate Items CSV
    try {
      const items = await query(
        `SELECT item_name, category, price, attack, attack_speed, crit_chance, armor_pen, spell_vamp, 
                magic_power, hp, armor, magic_resist, movement_speed, cooldown_reduction, mana_regen, 
                hp_regen, description
         FROM items 
         ORDER BY item_name ASC`
      )

      if (items && items.length > 0) {
        const csvHeader = 'Item Name,Category,Price,Attack,Attack Speed,Crit Chance,Armor Penetration,Spell Vamp,Magic Power,HP,Armor,Magic Resist,Movement Speed,Cooldown Reduction,Mana Regen,HP Regen,Description\n'
        const csvRows = items.map(item => 
          `"${escapeCSV(item.item_name || '')}","${escapeCSV(item.category || '')}",${item.price || 0},${item.attack || 0},${item.attack_speed || 0},${item.crit_chance || 0},${item.armor_pen || 0},${item.spell_vamp || 0},${item.magic_power || 0},${item.hp || 0},${item.armor || 0},${item.magic_resist || 0},${item.movement_speed || 0},${item.cooldown_reduction || 0},${item.mana_regen || 0},${item.hp_regen || 0},"${escapeCSV(item.description || '')}"`
        ).join('\n')
        
        const itemsPath = path.join(csvDir, 'items.csv')
        fs.writeFileSync(itemsPath, csvHeader + csvRows, 'utf-8')
        results.items = { count: items.length, status: 'success' }
      }
    } catch (e) {
      results.errors.push(`Items CSV: ${e.message}`)
    }

    console.log('[INIT-CSV] CSV files initialized:', results)

    return res.status(200).json({
      success: true,
      message: 'CSV files initialized successfully',
      results,
      errors: results.errors.length > 0 ? results.errors : null
    })
  } catch (e) {
    console.error('[INIT-CSV] error:', e)
    return res.status(500).json({ error: 'Server error', details: e.message })
  }
}

function escapeCSV(str) {
  if (!str) return ''
  return str.replace(/"/g, '""')
}
