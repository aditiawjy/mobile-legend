# Auto vs Manual Draft: Inconsistency Analysis

## Problem Statement

**Auto draft** dan **Manual draft** menggunakan **2 sistem scoring berbeda** yang bisa menghasilkan rekomendasi tidak konsisten untuk hero yang sama:

### Auto Draft (`lib/draftPick.js` + `/api/draft-simulation`)
- **Data source:** `draft-rules.csv`
- **Scoring factors:**
  - `basePriority`: From draft-rules.csv hero_priority (1-10 per role)
  - `diversityBonus`: +2 if damage type differs
  - `synergyBonus`: From draft-rules.csv synergy rules (+0-3)
  - `laneCoverageBonus`: +5 if different primary lane, +3 if unique lanes, etc.

### Manual Draft (`components/ManualDraftPick.js`)
- **Data source:** MySQL DB (hero_combos, hero_compatibility, lanes)
- **Scoring factors:**
  1. Lane priority: +100 (primary), +50 (secondary)
  2. Role diversity: +30 if unique role
  3. Damage type balance: +40/+20
  4. Attack reliance balance: +35/+15
  5. Roaming-Mid synergy: +50/+45/+45
  6. Tank priority: +60 if team needs tank
  7. Hero combo synergy: +40-70 from hero_combos table
  8. Hero compatibility: +25-35 from hero_compatibility table

---

## Detailed Comparison

### 1. Data Source Duplication

| Data Type | Auto Draft (CSV) | Manual Draft (DB) | Synced? |
|-----------|------------------|-------------------|---------|
| **Synergy** | draft-rules.csv synergy rules | hero_combos + hero_compatibility | ❌ NO |
| **Role compatibility** | draft-rules.csv role_compatibility | NOT USED | ❌ NO |
| **Hero priority** | draft-rules.csv hero_priority | NOT USED | ❌ NO |
| **Lanes** | hero_lanes (DB, fetched) | hero_lanes (DB) | ✅ YES |

**Problem:** Synergy data exists in **3 places**:
1. `draft-rules.csv` synergy rules (e.g., Miya + Angela = +3)
2. `hero_combos` table (e.g., Miya + Angela, score 82)
3. `hero_compatibility` table (e.g., Miya → partner_hero3 = Angela)

These **are NOT synchronized** and can give different results.

---

### 2. Scoring Weight Differences

**Example: Miya + Angela synergy**

**Auto Draft:**
```javascript
synergyBonus = +3  // From draft-rules.csv (if synergy rule exists)
totalScore = basePriority(7) + diversityBonus(2) + synergyBonus(3) + laneCoverageBonus(5)
           = 17
```

**Manual Draft:**
```javascript
comboScore = +55   // From hero_combos (82 * 0.7 ≈ 57, normalized to 40-70 range)
compatScore = +25  // From hero_compatibility (if Angela in partner list)
totalScore = lanePriority(100) + roleDiversity(30) + damageBalance(40) + comboScore(55) + compatScore(25)
           = 250+
```

**Scale difference:** Auto uses ~5-20 range, Manual uses ~100-300 range.

---

### 3. Feature Coverage Gap

| Feature | Auto Draft | Manual Draft |
|---------|------------|--------------|
| **Role compatibility rules** | ✅ YES (CSV) | ❌ NO |
| **Hero priority per role** | ✅ YES (CSV) | ❌ NO |
| **Lane priority scoring** | ⚠️ Partial (laneCoverageBonus) | ✅ Full (+100/+50) |
| **Damage type balance** | ⚠️ Simple (+2 if different) | ✅ Advanced (considers team imbalance) |
| **Attack reliance balance** | ❌ NO | ✅ YES (+35/+15) |
| **Tank requirement check** | ⚠️ Validation only | ✅ Scoring bonus (+60) |
| **Roaming-Mid synergy** | ❌ NO | ✅ YES (+50/+45) |
| **Hero-specific combos** | ⚠️ Generic synergy | ✅ Detailed (hero_combos table) |
| **Explicit compatibility** | ❌ NO | ✅ YES (hero_compatibility table) |

---

### 4. Concrete Example: Miya Draft

**Scenario:** User picks Miya (Marksman, Gold Lane)

#### Auto Draft Recommendation (top partner):
```
1. Tigreal (Tank, Roaming)
   - basePriority: 8 (high priority Tank)
   - diversityBonus: 0 (both physical)
   - synergyBonus: 2 (Marksman-Tank compatibility from CSV)
   - laneCoverageBonus: 5 (different primary lane)
   - Total: 15
```

#### Manual Draft Recommendation (Roaming slot):
```
1. Angela (Support, Roaming)
   - lanePriority: 100 (primary Roaming)
   - roleDiversity: 30 (Support is unique)
   - damageBalance: 40 (magic vs Miya physical)
   - comboScore: 55 (from hero_combos: Protect-Carry, score 82)
   - compatScore: 0 (not in hero_compatibility for Miya)
   - Total: 225

2. Tigreal (Tank, Roaming)
   - lanePriority: 100
   - roleDiversity: 30 (Tank is unique)
   - damageBalance: 0 (both physical)
   - tankBonus: 60 (team needs tank)
   - comboScore: 0 (no specific combo)
   - compatScore: 25 (in hero_compatibility for Miya)
   - Total: 215
```

**Result:** Auto recommends **Tigreal first**, Manual recommends **Angela first**.

**Why inconsistent?**
- Auto: Tigreal wins because high basePriority + synergy from CSV
- Manual: Angela wins because hero_combos score (82) + damage diversity
- **Both valid**, but user might be confused

---

## Root Causes

### 1. Data Duplication Without Sync
- Synergy data in CSV vs DB not aligned
- Updates to one don't reflect in the other
- Example: Add Angela-Miya combo to hero_combos → Auto draft doesn't see it

### 2. Different Design Philosophy
- **Auto:** Fast, generic, rule-based (CSV)
- **Manual:** Detailed, specific, data-rich (DB)
- Both valid, but serve different purposes

### 3. Historical Evolution
- Auto draft implemented first with CSV rules
- Manual draft added later with DB data
- No effort to unify

---

## Impact Analysis

### User Experience Impact
1. **Confusion:** "Auto recommends X but Manual recommends Y for same hero"
2. **Trust issues:** "Which one is more accurate?"
3. **Learning curve:** Need to understand 2 different systems

### Maintenance Impact
1. **Double work:** Update synergy in CSV AND DB
2. **Drift risk:** CSV and DB can diverge over time
3. **Inconsistent testing:** Need to test both systems separately

### Data Quality Impact
1. **No single source of truth** for synergy/compatibility
2. **Harder to validate** consistency
3. **Manual reconciliation** needed periodically

---

## Solution Options

### Option 1: CSV as Single Source of Truth ⭐ (Quick Win)

**Approach:**
- Keep draft-rules.csv as primary
- Manual draft ALSO reads draft-rules.csv (in addition to DB data)
- Merge scoring: CSV rules + DB specific data

**Changes needed:**
```javascript
// In ManualDraftPick.js
import { parseDraftRulesCSV, calculateSynergyBonus } from '../lib/draftPick';

// Add to scoring
const csvSynergy = calculateSynergyBonus(pickedHero, candidateHero, synergyRules);
score += csvSynergy * 15; // Normalize to Manual draft scale
```

**Pros:**
- ✅ Quick to implement
- ✅ CSV remains master (AGENTS.md compliant)
- ✅ No breaking changes to Auto draft
- ✅ Manual gets generic rules + specific data

**Cons:**
- ⚠️ Manual draft becomes slower (reads CSV)
- ⚠️ Still have hero_combos/hero_compatibility in DB (redundant?)

---

### Option 2: DB as Single Source of Truth (Long-term Ideal)

**Approach:**
- Migrate draft-rules.csv → MySQL tables
  - `draft_role_compatibility` (primary_role, compatible_role, priority)
  - `draft_hero_priority` (role, hero_name, priority)
  - `draft_synergy_rules` (selected_hero, partner_hero, bonus, notes)
- Auto draft queries DB instead of CSV
- Unified data source

**Changes needed:**
1. Create migration script: CSV → DB
2. Update lib/draftPick.js to query DB
3. Add API endpoints for rule management
4. Admin UI to edit rules (optional)

**Pros:**
- ✅ Single source of truth (DB)
- ✅ Query-able, scalable
- ✅ Easier to manage large datasets
- ✅ Can add UI for rule editing

**Cons:**
- ❌ Breaking change (CSV no longer used)
- ❌ More complex migration
- ❌ AGENTS.md says "CSV as source of truth" (need update)

---

### Option 3: Hybrid Approach (Recommended) ⭐⭐

**Approach:**
- **CSV** for generic, rule-based data:
  - role_compatibility (Tank works with Marksman)
  - Base hero_priority per role
  - Generic synergy rules (Marksman-Tank = +3)
  
- **DB** for specific, detailed data:
  - hero_combos (Miya-Angela specific combo, score 82)
  - hero_compatibility (explicit partner lists)
  - lanes (lane assignments)

- **Both systems use BOTH sources:**
  - Auto: CSV rules (primary) + DB combos (bonus)
  - Manual: DB data (primary) + CSV rules (fallback/enhancement)

**Implementation:**

**Auto draft enhancement:**
```javascript
// lib/draftPick.js - already has CSV
// Add DB combo bonus
async function getRecommendedPartnersWithLanes(selected, allHeroes, numberOfRecs) {
  // ... existing code ...
  
  // NEW: Fetch hero combos from DB
  const combos = await query('SELECT * FROM hero_combos WHERE hero1 = ? OR hero2 = ?', 
    [selected.name, selected.name]);
  
  // Add combo bonus to scoring
  const comboBonus = combos.find(c => 
    c.hero1 === candidateHero.name || c.hero2 === candidateHero.name
  );
  
  if (comboBonus) {
    totalScore += (comboBonus.synergy_score / 10); // Normalize 80 → +8
  }
}
```

**Manual draft enhancement:**
```javascript
// components/ManualDraftPick.js - already has DB
// Add CSV rules bonus
useEffect(() => {
  // Fetch draft rules from CSV via API
  fetch('/api/draft-rules')
    .then(res => res.json())
    .then(rules => setDraftRules(rules));
}, []);

// In scoring
const csvSynergy = calculateSynergyBonus(pickedHero, hero, draftRules.synergyRules);
score += csvSynergy * 15; // Normalize to Manual scale
```

**Pros:**
- ✅ Best of both worlds
- ✅ Gradual migration path
- ✅ No breaking changes
- ✅ More consistent over time
- ✅ AGENTS.md compliant (CSV still used)

**Cons:**
- ⚠️ Slight complexity (2 sources)
- ⚠️ Need to decide priority when conflict

---

### Option 4: Document & Accept (Pragmatic) ⭐

**Approach:**
- Document differences clearly
- Explain use cases:
  - **Auto draft:** Fast, generic recommendations for quick team building
  - **Manual draft:** Detailed, lane-specific recommendations with combos
- User chooses which to trust based on context

**Documentation additions:**
```markdown
## Draft Modes Comparison

### Auto Draft (/api/draft-simulation)
- **Best for:** Quick team suggestions, learning role compatibility
- **Data source:** Generic rules from draft-rules.csv
- **Scoring:** Role-based priorities + synergy rules
- **Speed:** Fast (no DB queries for combos)

### Manual Draft (Manual Draft Pick page)
- **Best for:** Lane-specific picks, combo optimization
- **Data source:** Detailed DB data (hero_combos, hero_compatibility)
- **Scoring:** Lane priority + specific combos + team balance
- **Speed:** Slower (more data processing)

**Note:** Recommendations may differ between modes due to different data sources and scoring algorithms.
```

**Pros:**
- ✅ Zero code changes
- ✅ Fastest to implement
- ✅ User aware of differences
- ✅ No breaking changes

**Cons:**
- ❌ Doesn't solve inconsistency
- ❌ Users still confused (even if documented)
- ❌ Maintenance still duplicated

---

## Recommended Solution: **Hybrid Approach (Option 3)**

### Phase 1: Quick Win (Week 1)
1. Manual draft reads draft-rules.csv (via API endpoint)
2. Add CSV synergy bonus to Manual scoring
3. Document current state

### Phase 2: Enhancement (Week 2-3)
1. Auto draft queries hero_combos from DB
2. Add DB combo bonus to Auto scoring
3. Standardize score normalization

### Phase 3: Long-term (Month 2+)
1. Create admin UI to manage rules
2. Sync CSV ↔ DB periodically
3. Deprecate duplicated data gradually

---

## Implementation Priority

### High Priority (Do Now)
1. ✅ **Document inconsistency** (this doc)
2. 🔧 **Add /api/draft-rules endpoint** to serve CSV data to client
3. 🔧 **Manual draft: Add CSV synergy bonus** to scoring
4. 🔧 **Update Auto draft: Add hero_combos bonus** to scoring

### Medium Priority (Next Sprint)
1. 🔧 Standardize score normalization (0-100 scale?)
2. 🔧 Create comparison test suite
3. 📝 User-facing documentation

### Low Priority (Future)
1. 🔧 Migrate CSV → DB (if scaling issues)
2. 🔧 Admin UI for rule management
3. 🔧 A/B test different scoring algorithms

---

## Testing Strategy

### 1. Consistency Tests
```javascript
// Test that same hero gets similar recommendations
const autoResult = await fetch('/api/draft-simulation?hero=Miya');
const manualResult = await calculateManualRecommendations('Miya', allHeroes);

// Check top 3 recommendations overlap
const overlap = autoResult.partners.filter(p => 
  manualResult.top3.some(m => m.name === p.name)
);

expect(overlap.length).toBeGreaterThan(1); // At least 2/3 match
```

### 2. Score Calibration Tests
```javascript
// Test that scores are in reasonable ranges
expect(autoScore).toBeInRange(5, 25);
expect(manualScore).toBeInRange(100, 300);

// After normalization
expect(normalizedAutoScore).toBeInRange(0, 100);
expect(normalizedManualScore).toBeInRange(0, 100);
```

### 3. Data Sync Tests
```javascript
// Test that synergy data is consistent
const csvSynergy = parseDraftRulesCSV().synergyRules.find(/* ... */);
const dbCombo = await query('SELECT * FROM hero_combos WHERE ...');

if (csvSynergy && dbCombo) {
  // If both exist, they should be similar
  expect(Math.abs(csvSynergy.bonus * 10 - dbCombo.synergy_score)).toBeLessThan(20);
}
```

---

## Compliance with AGENTS.md

✅ **CSV as source of truth respected:**
- draft-rules.csv remains primary for generic rules
- DB used for specific, detailed data
- Hybrid approach maintains CSV authority

✅ **No breaking changes:**
- Auto draft still works with CSV
- Manual draft enhanced (not replaced)
- Gradual migration path

✅ **Documented:**
- Clear explanation of differences
- Rationale for hybrid approach
- Migration path specified

---

## Related Documentation

- **Lane-aware recommendation:** `docs/LANE-AWARE-RECOMMENDATION.md`
- **Comprehensive validation:** `docs/COMPREHENSIVE-VALIDATION.md`
- **Fallback logic fix:** `docs/FIX-FALLBACK-LOGIC.md`
- **CSV Sync:** `scripts/README-SYNC-HEROES.md`
- **AGENTS.md:** Root-level coding guidelines

---

## Files to Modify (Phase 1)

1. ✏️ **`pages/api/draft-rules.js`** (NEW)
   - Endpoint to serve draft-rules.csv data

2. ✏️ **`components/ManualDraftPick.js`**
   - Fetch draft rules from API
   - Add CSV synergy bonus to scoring

3. ✏️ **`lib/draftPick.js`**
   - Import hero_combos query
   - Add DB combo bonus to Auto scoring

4. ✏️ **`docs/AUTO-VS-MANUAL-INCONSISTENCY.md`** (NEW, this doc)
