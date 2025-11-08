# Lanes System - Setup & Usage Guide

## Overview
Sistem lanes mengelola data lanes (Gold Lane, Exp Lane, Mid Lane, Jungling, Roaming) dan relasinya dengan heroes melalui database MySQL.

## Database Schema

### Tabel `lanes`
```sql
CREATE TABLE lanes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lane_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lane_name (lane_name)
);
```

### Tabel `hero_lanes`
```sql
CREATE TABLE hero_lanes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hero_name VARCHAR(100) NOT NULL,
  lane_id INT NOT NULL,
  priority TINYINT DEFAULT 1 COMMENT '1=primary, 2=secondary, 3=situational',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_hero_lane (hero_name, lane_id),
  INDEX idx_hero_name (hero_name),
  INDEX idx_lane_id (lane_id),
  CONSTRAINT fk_hero_lanes_hero FOREIGN KEY (hero_name) REFERENCES heroes(hero_name)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_hero_lanes_lane FOREIGN KEY (lane_id) REFERENCES lanes(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
```

## Setup Instructions

### 1. Create Tables
Jalankan API endpoints berikut secara berurutan (bisa via browser atau Postman):

```bash
# 1. Create lanes table
GET/POST http://localhost:3000/api/admin/create_lanes_table

# 2. Create hero_lanes junction table
GET/POST http://localhost:3000/api/admin/create_hero_lanes_table

# 3. Seed lanes data (Gold Lane, Exp Lane, Mid Lane, Jungling, Roaming)
GET/POST http://localhost:3000/api/admin/seed_lanes
```

### 2. Verify Setup
```bash
# Check lanes created
GET http://localhost:3000/api/lanes

# Expected response:
[
  { "id": 1, "lane_name": "Gold Lane", "description": "..." },
  { "id": 2, "lane_name": "Exp Lane", "description": "..." },
  { "id": 3, "lane_name": "Mid Lane", "description": "..." },
  { "id": 4, "lane_name": "Jungling", "description": "..." },
  { "id": 5, "lane_name": "Roaming", "description": "..." }
]
```

## API Endpoints

### GET /api/lanes
Mengambil semua lanes yang tersedia.

**Response:**
```json
[
  {
    "id": 1,
    "lane_name": "Gold Lane",
    "description": "Lane for marksman and some mages...",
    "created_at": "2025-11-08T...",
    "updated_at": "2025-11-08T..."
  }
]
```

### GET /api/heroes
Mengambil semua heroes **dengan data lanes**.

**Response:**
```json
[
  {
    "hero_name": "Layla",
    "role": "Marksman",
    "damage_type": "physical_crit",
    "attack_reliance": "finisher/damage",
    "note": "...",
    "lanes": [
      {
        "lane_name": "Gold Lane",
        "description": "...",
        "priority": 1
      }
    ]
  }
]
```

### POST /api/admin/hero_lanes
Menambahkan lane ke hero.

**Request Body:**
```json
{
  "hero_name": "Layla",
  "lane_id": 1,
  "priority": 1
}
```

**Priority Values:**
- `1` = Primary lane (lane utama hero)
- `2` = Secondary lane (lane alternatif)
- `3` = Situational lane (bisa dimainkan tapi jarang)

**Response:**
```json
{
  "ok": true,
  "message": "Hero lane added successfully"
}
```

### DELETE /api/admin/hero_lanes
Menghapus lane dari hero.

**Request Body:**
```json
{
  "hero_name": "Layla",
  "lane_id": 1
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Hero lane removed successfully"
}
```

### GET /api/admin/hero_lanes
Mengambil semua relasi hero-lanes.

**Response:**
```json
[
  {
    "id": 1,
    "hero_name": "Layla",
    "lane_id": 1,
    "lane_name": "Gold Lane",
    "priority": 1
  }
]
```

## Usage Examples

### Menambahkan Lanes untuk Hero

```javascript
// Layla: Primary Gold Lane
await fetch('/api/admin/hero_lanes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hero_name: 'Layla',
    lane_id: 1, // Gold Lane
    priority: 1
  })
})

// Layla: Secondary Mid Lane
await fetch('/api/admin/hero_lanes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hero_name: 'Layla',
    lane_id: 3, // Mid Lane
    priority: 2
  })
})
```

### Mengambil Heroes dengan Lanes

```javascript
const response = await fetch('/api/heroes')
const heroes = await response.json()

// Filter heroes yang bisa main di Gold Lane
const goldLaneHeroes = heroes.filter(hero => 
  hero.lanes.some(lane => lane.lane_name === 'Gold Lane')
)
```

### Menghapus Lane dari Hero

```javascript
await fetch('/api/admin/hero_lanes', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hero_name: 'Layla',
    lane_id: 3 // Mid Lane
  })
})
```

## Lane Mapping Reference

| Lane ID | Lane Name  | Typical Roles                           |
|---------|------------|-----------------------------------------|
| 1       | Gold Lane  | Marksman, Mage                          |
| 2       | Exp Lane   | Fighter, Tank                           |
| 3       | Mid Lane   | Mage, Assassin                          |
| 4       | Jungling   | Assassin, Fighter, Tank, Mage           |
| 5       | Roaming    | Support, Tank                           |

## Notes

1. **Many-to-Many**: Satu hero bisa punya multiple lanes, satu lane bisa untuk multiple heroes.
2. **Priority**: Gunakan priority untuk menandai lane utama hero (1) vs lane situational (3).
3. **Cascade Delete**: Jika hero dihapus dari tabel `heroes`, semua relasi di `hero_lanes` akan otomatis terhapus.
4. **Unique Constraint**: Tidak bisa assign lane yang sama ke hero yang sama lebih dari sekali.
5. **Data Sync**: Lanes data hanya di database, tidak di CSV. Untuk backup/export, gunakan `GET /api/admin/hero_lanes`.

## Migration from CSV (Future)

Jika ingin menambahkan kolom Lanes ke heroes.csv untuk keperluan dokumentasi:

1. Lanes di CSV hanya untuk referensi/dokumentasi
2. Source of truth tetap di database MySQL
3. Format CSV: `"Hero Name","Role","Damage Type","Attack Reliance","Note","Lanes"`
4. Format Lanes: `"Gold Lane(1)|Mid Lane(2)"` (dengan priority)
