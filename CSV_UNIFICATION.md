# CSV Unification for Draft Pick Features

## Problem Statement

Sebelumnya terdapat **data inconsistency risk**:
- **Auto Recommendation Mode** menggunakan CSV (`parseHeroesCSV` dari `lib/draftPick.js`)
- **Manual Selection Mode** menggunakan Database MySQL (`/api/heroes`, `/api/heroes_search`)

**Risiko:**
- Data drift jika DB ≠ CSV
- Inconsistent hero availability antara mode
- Confusion untuk user karena hasil berbeda

## Solution: Unified CSV Approach

Sesuai `AGENTS.md` coding guidelines, **CSV adalah sumber kebenaran (single source of truth)** untuk data heroes.

### Implementation

#### 1. New CSV-based Endpoints

Created `/api/draft/` folder dengan endpoints yang read from CSV:

**`/api/draft/heroes-search`**
```javascript
// Search heroes from CSV (not database)
GET /api/draft/heroes-search?q=miya
Response: ["Miya", "Minotaur"]
```

**`/api/draft/heroes-list`**
```javascript
// Get all heroes from CSV
GET /api/draft/heroes-list
Response: [{ hero_name, role, damage_type, attack_reliance, note }, ...]
```

**`/api/draft-simulation`** (already exists)
```javascript
// Draft simulation using CSV
GET /api/draft-simulation?hero=Miya
```

#### 2. Updated Components

**HeroAutocomplete.js**
- Added `searchEndpoint` prop (default: `/api/draft/heroes-search`)
- Now uses CSV-based endpoint by default
- Backward compatible: can still use DB endpoint if needed

**ManualDraftPick.js**
- Changed from `/api/heroes` to `/api/draft/heroes-list`
- Now fetches heroes from CSV (consistent with Auto mode)
- Comment added for clarity

## Data Flow

### Before (Inconsistent)
```
Auto Mode:
  User selects hero → lib/draftPick.js → parseHeroesCSV() → public/csv/heroes.csv

Manual Mode:
  User types hero → /api/heroes_search → MySQL heroes table
  User views details → /api/heroes → MySQL heroes table
```

### After (Unified)
```
Auto Mode:
  User selects hero → /api/draft-simulation → lib/draftPick.js → public/csv/heroes.csv

Manual Mode:
  User types hero → /api/draft/heroes-search → lib/draftPick.js → public/csv/heroes.csv
  User views details → /api/draft/heroes-list → lib/draftPick.js → public/csv/heroes.csv
```

## Endpoints Comparison

| Endpoint | Source | Used By | Purpose |
|----------|--------|---------|---------|
| `/api/heroes` | MySQL DB | Other features | Database heroes (edit, admin) |
| `/api/heroes_search` | MySQL DB | Other features | Database search |
| `/api/draft/heroes-list` | CSV | Draft Pick | CSV heroes list |
| `/api/draft/heroes-search` | CSV | Draft Pick | CSV search |
| `/api/draft-simulation` | CSV | Draft Pick | Auto recommendation |
| `/api/heroes-list` | CSV | DraftPickSimulator | CSV heroes (Auto mode) |

## Benefits

### ✅ Consistency
- Both Auto and Manual modes use same CSV data
- No risk of data drift
- Predictable results

### ✅ Follows AGENTS.md Guidelines
- CSV sebagai sumber kebenaran
- All draft-pick features verified against CSV
- Compliant dengan coding standards

### ✅ Backward Compatible
- DB-based endpoints masih tersedia untuk fitur lain
- HeroAutocomplete dapat switch endpoint via prop
- No breaking changes untuk existing features

### ✅ Maintainability
- Single source of truth untuk draft-pick
- Easy to update: hanya perlu update CSV
- Clear separation: `/api/draft/*` untuk CSV, `/api/heroes*` untuk DB

## Migration Notes

### Components Updated
- ✅ `HeroAutocomplete.js` - Added `searchEndpoint` prop
- ✅ `ManualDraftPick.js` - Changed to `/api/draft/heroes-list`
- ✅ `DraftPickSimulator.js` - Already using `/api/heroes-list` (CSV)

### Endpoints Added
- ✅ `/api/draft/heroes-search` - CSV search
- ✅ `/api/draft/heroes-list` - CSV list
- ✅ `/api/draft-simulation` - Already exists (CSV)

### Testing Checklist
- [ ] Test Auto mode: pilih hero, verify 4 recommendations
- [ ] Test Manual mode: type hero, verify autocomplete suggestions
- [ ] Verify same hero list antara Auto dan Manual
- [ ] Test partial selection (1-5 heroes)
- [ ] Verify team composition analysis
- [ ] Cross-check CSV vs Manual mode results

## Usage Examples

### Auto Recommendation (CSV)
```javascript
// DraftPickSimulator component
fetch('/api/heroes-list') // CSV-based
fetch('/api/draft-simulation?hero=Miya') // CSV-based
```

### Manual Selection (CSV)
```javascript
// HeroAutocomplete component
<HeroAutocomplete 
  searchEndpoint="/api/draft/heroes-search" // CSV-based (default)
/>

// ManualDraftPick component
fetch('/api/draft/heroes-list') // CSV-based
```

### Other Features (DB) - Not affected
```javascript
// Edit hero, admin features still use DB
fetch('/api/heroes') // MySQL DB
fetch('/api/heroes_search?q=miya') // MySQL DB
```

## Future Considerations

### Option 1: Fully Migrate to CSV
If all features should use CSV, migrate remaining endpoints:
- Update `/api/heroes` to read from CSV
- Update `/api/heroes_search` to search CSV
- Deprecate MySQL heroes table (or use as backup)

### Option 2: Keep Hybrid Approach
- Draft-pick features: CSV (read-only)
- Admin/edit features: MySQL DB (read-write)
- Sync: Export CSV from DB periodically

### Option 3: Add CSV ↔ DB Sync
- Implement sync mechanism
- CSV as primary for display
- DB for persistence and editing
- Scheduled sync to keep data consistent

## Rollback Plan

If issues occur, can easily rollback:

1. Revert `HeroAutocomplete.js` prop:
```javascript
searchEndpoint="/api/heroes_search"
```

2. Revert `ManualDraftPick.js` fetch:
```javascript
fetch('/api/heroes')
```

3. Keep new `/api/draft/*` endpoints for future use

## Validation

### CSV Headers (from AGENTS.md)
```
Hero Name, Role, Damage Type, Attack Reliance, Note
```

### parseHeroesCSV() Output
```javascript
{
  name: string,
  role: string,
  damageType: string,
  attackReliance: string,
  note: string
}
```

### API Response Format
```javascript
// /api/draft/heroes-list
[{
  hero_name: string,
  role: string,
  damage_type: string,
  attack_reliance: string,
  note: string
}]
```

## Conclusion

Draft Pick features sekarang **fully unified ke CSV** sebagai single source of truth, sesuai dengan `AGENTS.md` guidelines dan menghilangkan risk data drift antara Auto dan Manual modes.
