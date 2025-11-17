# Heroes CSV ↔ Database Sync

## Problem yang Diselesaikan

**Masalah awal:**
- `/api/draft-simulation` validasi hero ke `heroes.csv` via `parseHeroesCSV()`
- Lanes, combos, dan compatibility diambil dari MySQL DB
- Hero yang ada di CSV tapi belum di DB akan:
  - ✅ Pass validasi
  - ❌ Dapat `lanes: []` kosong
  - ❌ Tidak di-assign ke slot lane
  - ❌ Diganti hero lain saat pengisian slot

**Solusi:**
1. Buat sync script yang INSERT/UPDATE heroes dari CSV ke DB
2. Validasi API endpoint ke DB (bukan CSV lagi)
3. CSV tetap sebagai **master data** (sesuai AGENTS.md)
4. DB adalah **operational data** untuk runtime

---

## Usage

### 1. Sync Heroes CSV ke Database

```bash
npm run sync:heroes
```

**Script akan:**
- Parse `public/csv/heroes.csv` (validasi header sesuai AGENTS.md)
- Fetch existing heroes dari DB
- **INSERT** hero baru yang belum ada
- **UPDATE** hero existing dengan data terbaru dari CSV
- Report hasil: inserted/updated/skipped/errors

**Output contoh:**
```
=== Sync Heroes CSV to Database ===

✓ Parsed 129 heroes from CSV
✓ CSV columns validated
✓ Found 129 existing heroes in database

📊 Sync Plan:
   - Insert: 0 new heroes
   - Update: 129 existing heroes
   - Skipped: 0 invalid rows

=== Sync Complete ===
✓ Inserted: 0/0
✓ Updated: 129/129
```

---

## When to Run Sync

**WAJIB jalankan `npm run sync:heroes` setelah:**
1. ✏️ Edit `public/csv/heroes.csv` (tambah/update hero)
2. 🔄 Pull changes dari git yang mengubah heroes.csv
3. 🐛 Detect hero missing di DB via error message API

**Error message di API jika hero tidak ditemukan:**
```json
{
  "error": "Hero \"NamaHero\" tidak ditemukan di database. Jalankan 'npm run sync:heroes' untuk sinkronisasi CSV ke DB."
}
```

---

## Data Flow Diagram

```
┌─────────────────────┐
│  heroes.csv         │ ← Master Data (Edit disini)
│  (Master Data)      │
└──────────┬──────────┘
           │
           │ npm run sync:heroes
           ▼
┌─────────────────────┐
│  MySQL DB           │ ← Operational Data
│  - heroes table     │
│  - hero_lanes       │
│  - hero_combos      │
│  - hero_compat...   │
└──────────┬──────────┘
           │
           │ /api/draft-simulation
           │ /api/heroes
           ▼
┌─────────────────────┐
│  Frontend/Client    │
└─────────────────────┘
```

---

## CSV Columns Contract (AGENTS.md)

**Required columns:**
- `Hero Name` (PK, must match DB)
- `Role` 
- `Damage Type`
- `Attack Reliance`
- `Note`

**Extra columns** (optional, tidak di-sync ke DB):
- Skill columns, passive, etc.

---

## Validation Changes

### Before (❌ Inconsistent)
```javascript
// /api/draft-simulation.js (OLD)
const heroes = parseHeroesCSV();  // ← Validasi ke CSV
const heroExists = heroes.some(h => h.name === heroName);
```

### After (✅ Consistent)
```javascript
// /api/draft-simulation.js (NEW)
const heroCheck = await query(
  'SELECT hero_name FROM heroes WHERE hero_name = ? LIMIT 1',
  [heroName]
);  // ← Validasi ke DB
```

**Alasan:**
- Lanes, combos, compatibility semua dari DB
- Validasi harus konsisten dengan operational data
- CSV sync script memastikan DB selalu up-to-date dengan CSV

---

## Troubleshooting

### Hero tidak ditemukan di API
```bash
npm run sync:heroes
```

### Cek heroes yang ada di CSV vs DB
```bash
# Check CSV count
node -e "const fs=require('fs'); const csv=require('csv-parse/sync'); const data=csv.parse(fs.readFileSync('public/csv/heroes.csv','utf8'),{columns:true}); console.log('CSV:',data.length)"

# Check DB count
mysql -u root -p mobile_legend_db -e "SELECT COUNT(*) FROM heroes"
```

### Force re-sync semua heroes
Script sudah handle UPDATE otomatis, tidak perlu manual intervention.

---

## Integration with AGENTS.md

✅ **Compliance checklist:**
- [x] CSV sebagai sumber kebenaran (AGENTS.md)
- [x] Validasi header CSV sesuai kontrak kolom
- [x] Proses seluruh baris CSV (bukan subset)
- [x] Konsistensi referensi Hero Name antar CSV dan DB
- [x] Script report hasil analisis (inserted/updated/skipped)
- [x] Dokumentasi perubahan minimal

**Breaking changes:** NO
**Migration needed:** NO (script handle INSERT + UPDATE)

---

## Future Improvements

1. **Auto-sync on deploy:**
   ```json
   "scripts": {
     "build": "npm run sync:heroes && next build"
   }
   ```

2. **Validation endpoint:**
   ```
   GET /api/admin/heroes-sync-status
   → Reports heroes in CSV but not in DB
   ```

3. **Webhook trigger:**
   Auto-sync saat CSV di-commit ke git

---

## Files Modified

1. ✏️ `scripts/sync-heroes-csv-to-db.js` (NEW)
2. ✏️ `package.json` → added `sync:heroes` script
3. ✏️ `pages/api/draft-simulation.js` → validasi ke DB
4. ✏️ `scripts/README-SYNC-HEROES.md` (NEW, dokumentasi ini)
