# Draft Rules CSV Documentation

## Overview
Sesuai `AGENTS.md` guidelines, **magic values/hardcoded rules dihilangkan** dan dipindahkan ke CSV terstruktur untuk mudah di-audit dan di-maintain.

## Problem (Before)
```javascript
// lib/draftPick.js - HARDCODED MAGIC VALUES ❌
const ROLE_COMPATIBILITY = {
  'Marksman': ['Tank', 'Support', 'Mage', 'Fighter'],
  'Mage': ['Tank', 'Support', 'Marksman', 'Assassin', 'Fighter'],
  // ... 20+ baris hardcoded
};

const HERO_PRIORITY = {
  'Tank': { 'Akai': 9, 'Franco': 8, 'Khufra': 8, ... },
  'Support': { 'Angela': 9, 'Lolita': 8, ... },
  // ... 30+ baris hardcoded
};
```

**Issues:**
- Tidak bisa di-audit tanpa baca kode
- Sulit update priority/rules
- Magic numbers tidak terdokumentasi
- Tidak konsisten dengan AGENTS.md (CSV as source of truth)

## Solution (After)
```javascript
// lib/draftPick.js - CSV-BASED ✅
const { roleCompatibility, heroPriority } = parseDraftRulesCSV();
// Rules loaded dari public/csv/draft-rules.csv
```

## CSV Structure

### `public/csv/draft-rules.csv`

**Headers:**
```
Rule Type, Primary Role, Compatible Role, Priority, Hero Name, Notes
```

**Rule Types:**
1. **`role_compatibility`** - Define compatible roles untuk draft recommendation
2. **`hero_priority`** - Define priority score per hero (1-10)

### Example Rows

#### Role Compatibility Rules
```csv
role_compatibility,Marksman,Tank,1,,Tank protects backline ADC
role_compatibility,Marksman,Support,2,,Support heals and buffs ADC
role_compatibility,Mage,Tank,1,,Tank initiates for mage follow-up
```

**Format:**
- `Rule Type`: `role_compatibility`
- `Primary Role`: Hero role yang dipilih user
- `Compatible Role`: Role yang cocok dengan primary role
- `Priority`: Order priority (1 = highest)
- `Hero Name`: (empty untuk role compatibility)
- `Notes`: Reasoning kenapa compatible

#### Hero Priority Rules
```csv
hero_priority,Tank,,9,Akai,Strong initiator with CC
hero_priority,Tank,,8,Franco,Long range hook for picks
hero_priority,Support,,9,Angela,Global presence and shields
```

**Format:**
- `Rule Type`: `hero_priority`
- `Primary Role`: Hero role
- `Compatible Role`: (empty untuk hero priority)
- `Priority`: Score 1-10 (higher = better recommendation)
- `Hero Name`: Specific hero name
- `Notes`: Reasoning for priority score

## Validation

### CSV Validation Script
```bash
npm run validate:csv
```

**Checks:**
- ✅ `items.csv` - All numeric columns parseable as numbers (0 anomalies)
- ✅ `hero-adjustments.csv` - Date format dd-MM-yyyy (0 anomalies)
- ✅ `heroes.csv` - Structure valid (70 heroes)
- ✅ `draft-rules.csv` - Loaded and parsed successfully

### Full Validation + Build
```bash
npm run validate:build
```

## API Endpoint

### GET `/api/draft/rules`
Exposes draft rules untuk audit dan debugging.

**Response:**
```json
{
  "success": true,
  "data": {
    "roleCompatibility": {
      "Marksman": ["Tank", "Support", "Mage", "Fighter"],
      "Mage": ["Tank", "Support", "Marksman", "Assassin", "Fighter"],
      "Tank": ["Marksman", "Mage", "Support", "Fighter", "Assassin"],
      ...
    },
    "heroPriority": {
      "Tank": {
        "Akai": 9,
        "Franco": 8,
        "Khufra": 8,
        "Tigreal": 9,
        ...
      },
      "Support": {
        "Angela": 9,
        "Lolita": 8,
        ...
      },
      ...
    }
  },
  "meta": {
    "source": "public/csv/draft-rules.csv",
    "description": "Draft pick rules loaded from CSV (no hardcoded magic values)"
  }
}
```

## Usage in Code

### Before (Hardcoded)
```javascript
const compatibleRoles = ROLE_COMPATIBILITY[selectedPrimaryRole] || [];
const priority = HERO_PRIORITY[role]?.[hero.name] || 5;
```

### After (CSV-based)
```javascript
const { roleCompatibility, heroPriority } = parseDraftRulesCSV();
const compatibleRoles = roleCompatibility[selectedPrimaryRole] || [];
const priority = heroPriority[role]?.[hero.name] || 5;
```

## Benefits

### ✅ Auditability
- Rules visible di CSV tanpa baca kode
- Non-technical users bisa audit priority scores
- Clear reasoning di Notes column

### ✅ Maintainability
- Update rules tanpa edit code
- Add/remove heroes priority via CSV edit
- Version control friendly (CSV diffs clear)

### ✅ AGENTS.md Compliance
```
Hindari magic values: gunakan header kolom atau konstanta util yang jelas,
bukan indeks kolom mentah.
```

✅ No more magic values!
✅ CSV sebagai sumber kebenaran
✅ Rules terstruktur dan terdokumentasi

### ✅ Transparency
- Priority scores explained dengan notes
- Role compatibility reasoning clear
- Easy to challenge/discuss decisions

## Adding New Rules

### Add Role Compatibility
1. Open `public/csv/draft-rules.csv`
2. Add row:
   ```csv
   role_compatibility,NewRole,CompatibleRole,1,,Reasoning here
   ```
3. Run `npm run validate:csv` to verify
4. No code changes needed!

### Add Hero Priority
1. Open `public/csv/draft-rules.csv`
2. Add row:
   ```csv
   hero_priority,Role,,8,HeroName,Reasoning for priority 8
   ```
3. Run `npm run validate:csv` to verify
4. No code changes needed!

### Update Priority Score
1. Find hero in CSV
2. Change Priority column (1-10)
3. Update Notes with reasoning
4. Restart server to reload cache

## Cache Management

Rules are **cached in memory** untuk performance:
```javascript
let draftRulesCache = null;

function parseDraftRulesCSV() {
  if (draftRulesCache) return draftRulesCache;
  // ... parse CSV
  draftRulesCache = { roleCompatibility, heroPriority };
  return draftRulesCache;
}
```

**Cache refresh:**
- ✅ Restart server
- ✅ Clear cache manually: `draftRulesCache = null`

**Future:** Add endpoint `POST /api/draft/rules/reload` untuk reload without restart.

## Testing

### Unit Test Draft Recommendation
```javascript
// Test dengan Miya (Marksman)
const partners = getRecommendedPartners('Miya', 4);
// Expected: Tank (Akai prio 9), Support (Angela prio 9), Mage, Fighter

// Test priority ordering
// Tank: Akai (9) > Tigreal (9) > Franco (8) > Khufra (8)
```

### Integration Test
```bash
# Test Auto Recommendation
curl http://localhost:3001/api/draft-simulation?hero=Miya

# Verify rules loaded
curl http://localhost:3001/api/draft/rules
```

## Current Rules Summary

### Role Compatibility (32 rules)
- Marksman → Tank, Support, Mage, Fighter
- Mage → Tank, Support, Marksman, Assassin, Fighter
- Tank → Marksman, Mage, Support, Fighter, Assassin
- Support → Marksman, Tank, Mage, Fighter, Assassin
- Fighter → Tank, Support, Mage, Assassin, Marksman
- Assassin → Support, Mage, Tank, Fighter
- Jungler → Tank, Marksman, Mage, Support

### Hero Priority (28 heroes)
- **Priority 9**: Akai, Tigreal, Angela, Lunox
- **Priority 8**: Franco, Khufra, Grock, Atlas, Lolita, Estes, Minotaur, Cecilion, Eudora, Novaria, Luo Yi, Hilda, X.Borg, Arlott, Hayabusa, Selena, Benedetta, Claude, Karrie
- **Priority 7**: Diggie, Ruby, Balmond, Saber, Miya
- **Priority 6**: Layla

## Migration Checklist

- [x] Create `public/csv/draft-rules.csv`
- [x] Add `parseDraftRulesCSV()` function
- [x] Remove hardcoded `ROLE_COMPATIBILITY`
- [x] Remove hardcoded `HERO_PRIORITY`
- [x] Update `getRecommendedPartners()` to use CSV
- [x] Add `/api/draft/rules` endpoint
- [x] Add `validate:csv` script to package.json
- [x] Test build successfully
- [x] Document changes

## Future Enhancements

### 1. Dynamic Priority Calculation
```csv
hero_priority,Tank,,dynamic,Akai,Calculate based on win rate + pick rate
```

### 2. Counter-Pick Rules
```csv
counter_pick,Miya,Assassin,8,Hayabusa,High mobility counters immobile MM
```

### 3. Synergy Rules
```csv
synergy,Angela,Marksman,9,Miya,Angela ult on Miya = strong combo
```

### 4. Meta Rules (Seasonal)
```csv
meta_rule,Season 38,Tank,boost,10,Buff tank meta this season
```

## Conclusion

Draft Pick features sekarang **fully transparent** dan **audit-friendly** dengan:
- ✅ 0 hardcoded magic values
- ✅ CSV sebagai single source of truth
- ✅ Clear reasoning untuk setiap rule
- ✅ Easy to update tanpa code changes
- ✅ AGENTS.md compliant
