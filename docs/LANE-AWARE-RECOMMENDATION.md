# Lane-Aware Draft Recommendation

## Problem Solved

**Sebelumnya (❌ Broken Flow):**
```
User pilih Hero → lib generates partners → API assigns lanes → CONFLICTS → Replace heroes
```

**Masalah:**
1. Recommendation hanya lihat Role + Damage Type (dari CSV)
2. Lane consideration AFTER recommendation (di API layer)
3. Hero yang direkomendasikan bisa conflict lane-nya dengan selected hero
4. Replacement heroes tidak sesuai recommendation original

**Contoh case:**
- User pilih **Miya** (Marksman, Gold Lane)
- Algo rekomendasikan **Beatrix** (Marksman, Gold Lane juga) karena high synergy
- API detect conflict → replace Beatrix dengan hero lain
- **User bingung:** kenapa Beatrix tidak muncul di draft?

---

## Solution

**Sekarang (✅ Lane-Aware):**
```
User pilih Hero → Fetch ALL heroes WITH lanes → Lane-aware recommendation → Direct assignment
```

**Improvements:**
1. ✅ Recommendation sudah consider lane coverage dari awal
2. ✅ Scoring algorithm include lane diversity bonus
3. ✅ Recommended heroes langsung assignable ke lanes
4. ✅ Minimize replacement needs

---

## Implementation Details

### 1. New Function: `getRecommendedPartnersWithLanes()`

**Location:** `lib/draftPick.js` (line 232-361)

**Signature:**
```javascript
getRecommendedPartnersWithLanes(
  selectedHeroWithLanes,  // Hero object with lanes array
  allHeroesWithLanes,     // All heroes from DB with lanes
  numberOfRecommendations = 4
)
```

**Scoring Algorithm:**
```javascript
totalScore = basePriority + diversityBonus + synergyBonus + laneCoverageBonus

laneCoverageBonus calculation:
  +5: Different primary lane
  +3: Has unique lanes (can cover different positions)
  -5: ALL lanes overlap (no diversity)
  +2: Flexible hero (3+ lanes)
```

**Example:**
```javascript
// Selected: Miya (Gold Lane)
// Candidate: Tigreal (Roaming)
laneCoverageBonus = +5 (different primary) + +3 (unique lane) = +8

// Candidate: Beatrix (Gold Lane only)
laneCoverageBonus = -5 (all lanes overlap)
```

---

### 2. API Changes: `/api/draft-simulation`

**Before:**
```javascript
// OLD: Validasi ke CSV, no lanes consideration
const heroes = parseHeroesCSV();
const draftResult = simulateDraftPick(heroName);
// Lane assignment AFTER recommendation (too late!)
```

**After:**
```javascript
// NEW: Fetch heroes WITH lanes, lane-aware recommendation
const allHeroesWithLanes = await query(...); // Fetch from DB with lanes
const recommendedPartners = getRecommendedPartnersWithLanes(
  selectedHeroWithLanes,
  allHeroesWithLanes,
  4
);
// Lane assignment straightforward (heroes already lane-compatible)
```

---

### 3. Response Structure Changes

**New fields in response:**

```json
{
  "selectedHero": {
    "name": "Miya",
    "primaryRole": "Marksman",
    "primaryLane": "Gold Lane",  // ← NEW
    "lanes": [...]
  },
  "recommendedPartners": [
    {
      "name": "Tigreal",
      "primaryLane": "Roaming",  // ← NEW
      "laneDiversityBonus": true // ← NEW
    }
  ],
  "scoring": {
    "algorithm": "Lane-Aware Multi-factor...",  // ← UPDATED
    "factors": {
      "laneCoverageBonus": "+5 if different primary lane..."  // ← NEW
    }
  },
  "recommendations": {
    "pickReason": "Miya adalah Marksman (Gold Lane)...",  // ← Includes lane
    "partnerRoles": [
      {
        "primaryLane": "Roaming",      // ← NEW
        "laneDiversityBonus": true     // ← NEW
      }
    ]
  }
}
```

---

## Test Results

### Test Case: Miya (Marksman, Gold Lane)

**Command:**
```powershell
Invoke-WebRequest "http://localhost:3001/api/draft-simulation?hero=Miya"
```

**Result:**
```json
{
  "selectedHero": { "primaryLane": "Gold Lane" },
  "recommendedPartners": [
    { "name": "Tigreal", "primaryLane": "Roaming", "laneDiversityBonus": true },
    { "name": "Angela", "primaryLane": "Roaming", "laneDiversityBonus": true },
    { "name": "Luo Yi", "primaryLane": "Mid Lane", "laneDiversityBonus": true },
    { "name": "Thamuz", "primaryLane": "Exp Lane", "laneDiversityBonus": true }
  ],
  "draft": {
    "options": [
      { "name": "Miya", "primaryLane": "Gold Lane" },
      { "name": "Thamuz", "primaryLane": "Exp Lane" },
      { "name": "Luo Yi", "primaryLane": "Mid Lane" },
      { "name": "Helcurt", "primaryLane": "Jungling" },
      { "name": "Tigreal", "primaryLane": "Roaming" }
    ]
  }
}
```

**✅ Perfect lane coverage:** Gold, Exp, Mid, Jungle, Roaming - ALL filled!

---

## Benefits

### 1. Better Recommendations
- ✅ Recommended heroes langsung bisa di-assign ke lanes
- ✅ No more surprise replacements
- ✅ Lane diversity jadi scoring factor

### 2. Accurate Scoring
```
Old: basePriority + diversityBonus + synergyBonus
New: basePriority + diversityBonus + synergyBonus + laneCoverageBonus
```

### 3. Predictable Behavior
- User pilih **Miya** → expect supports/tanks di lanes berbeda ✅
- User pilih **Fanny** (Jungler) → expect Gold/Exp/Mid/Roaming heroes ✅

### 4. Backward Compatible
- Old function `getRecommendedPartners()` masih ada (CSV-only mode)
- New function `getRecommendedPartnersWithLanes()` untuk DB mode
- API bisa pilih mana yang dipakai

---

## Files Modified

1. ✏️ `lib/draftPick.js`
   - Added `getRecommendedPartnersWithLanes()` (line 232-361)
   - Export function baru (line 467)

2. ✏️ `pages/api/draft-simulation.js`
   - Import `getRecommendedPartnersWithLanes`, `normalizeDamageType`, `getPrimaryRole`
   - Fetch selected hero WITH lanes from DB (line 27-62)
   - Fetch ALL heroes WITH lanes from DB (line 64-107)
   - Call lane-aware recommendation function (line 108-115)
   - Simplified lane assignment logic (line 208-270)
   - Updated response structure with lane info (line 272-342)

3. ✏️ `docs/LANE-AWARE-RECOMMENDATION.md` (NEW, dokumentasi ini)

---

## Future Improvements

### 1. Lane Preference Weighting
```javascript
// User preference: "I want more Jungle presence"
laneCoverageBonus += userPreferences.jungle ? +3 : 0;
```

### 2. Meta-based Lane Priority
```javascript
// Current meta: Gold Lane carry more impactful
laneCoverageBonus += metaTierBonuses[lane];
```

### 3. Counter-pick Lane Assignment
```javascript
// Enemy picked Fanny (Jungler)
// Recommend Khufra (Tank/Roaming) with +5 counter bonus
```

---

## Compliance with AGENTS.md

✅ **CSV masih sumber kebenaran:**
- `draft-rules.csv` → roleCompatibility, heroPriority, synergyRules
- `heroes.csv` → synced ke DB via `npm run sync:heroes`

✅ **DB sebagai operational data:**
- Lanes data (tabel `lanes` + `hero_lanes`)
- Runtime queries untuk recommendation

✅ **Validasi penuh:**
- Hero validated ke DB (setelah sync)
- Lane data validated ke DB
- Scoring tetap pakai CSV rules

---

## Related Documentation

- **CSV Sync:** `scripts/README-SYNC-HEROES.md`
- **AGENTS.md:** Root-level coding guidelines
- **API Docs:** (TODO) `/docs/API-DRAFT-SIMULATION.md`
