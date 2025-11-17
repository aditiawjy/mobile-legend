# Strict Lane Validation for Draft Pick Simulator

## Problem Yang Diselesaikan

**Masalah awal:**
DraftPickSimulator memiliki validasi lane yang **terlalu longgar**:
- ❌ `isValid: true` always (line 140) - bahkan ketika ada mismatch
- ❌ Lane mismatch hanya warning, bukan error
- ❌ Tidak ada error untuk heroes tanpa data lanes
- ❌ Tidak ada threshold untuk "too many mismatches"

**Dampak:**
- User bisa menganggap draft sudah "oke" padahal lanes tidak cocok
- Tidak ada feedback jelas bahwa draft INVALID
- Hero tanpa data lanes tidak terdeteksi sebagai masalah

---

## Solution: Enhanced Strict Validation

### Validation Rules

#### 1. CRITICAL ERRORS (Block validation)

**A. Heroes Without Lane Data**
```javascript
if (heroesWithoutLanes.length > 0) {
  heroesWithoutLanes.forEach(hero => {
    errors.push(`⚠️ KRITIS: ${hero.name} tidak punya data lanes. Jalankan 'npm run sync:heroes' atau tambahkan lanes di DB.`);
  });
}
```

**Example:**
- Hero "NewHero" ada di heroes.csv tapi belum di hero_lanes table
- **Error:** "⚠️ KRITIS: NewHero tidak punya data lanes..."
- **isValid:** `false`

---

**B. Lane Mismatch (Per Hero)**
```javascript
const isLaneMatch = heroLanes.some(lane => lane.lane_name === assignedLane.lane);
if (!isLaneMatch) {
  errors.push(`❌ ${hero.name}: Tidak cocok untuk ${assignedLane.lane} (lanes: ${heroLanes.map(l => l.lane_name).join(', ')})`);
  mismatchCount++;
}
```

**Example:**
- Miya (Gold Lane hero) assigned to Jungling slot
- **Error:** "❌ Miya: Tidak cocok untuk Jungling (lanes: Gold Lane)"
- **isValid:** `false`

---

**C. Too Many Mismatches (Threshold: 3+)**
```javascript
if (mismatchCount >= 3 && heroesWithLanes.length >= 3) {
  errors.push(`⚠️ KRITIS: ${mismatchCount}/${heroesWithLanes.length} heroes tidak cocok dengan lane assignment. Draft tidak optimal!`);
}
```

**Example:**
- 3 out of 5 heroes tidak cocok dengan assigned lanes
- **Error:** "⚠️ KRITIS: 3/5 heroes tidak cocok dengan lane assignment..."
- **isValid:** `false`

---

#### 2. WARNINGS (Non-blocking)

**A. Duplicate Primary Lanes**
```javascript
if (usedPrimaryLanes.has(primaryLane) && primaryLane !== assignedLane.lane) {
  warnings.push(`⚠️ Duplicate primary lane: ${primaryLane} (${hero.name})`);
}
```

**Example:**
- Miya (Gold Lane) and Beatrix (Gold Lane) both in team
- **Warning:** "⚠️ Duplicate primary lane: Gold Lane (Beatrix)"
- **isValid:** `true` (warning only)

---

**B. Team Composition Checks**
```javascript
// No CC
if (!hasAnyCC) {
  warnings.push('⚠️ Tim tidak punya Crowd Control yang jelas (no hard CC).');
}

// No Burst
if (!hasAnyBurst) {
  warnings.push('⚠️ Tim tidak punya burst damage yang kuat (no burst).');
}

// No Objective Control
if (!hasAnyObjective) {
  warnings.push('⚠️ Tim lemah dalam objective control (Turtle/Lord).');
}
```

---

## Before vs After

### Before (❌ Too Lenient)

**Scenario:** Miya (Gold) forced to Jungling slot

**Validation:**
```javascript
{
  isValid: true,  // ← Always true!
  errors: [],
  warnings: ['Miya: Tidak cocok untuk Jungling'],
  heroesWithLanes: 5
}
```

**UI Display:**
- ⚠️ Yellow warning box
- No visual indication of INVALID draft
- User thinks: "Just a warning, probably fine"

---

### After (✅ Strict)

**Scenario:** Miya (Gold) forced to Jungling slot

**Validation:**
```javascript
{
  isValid: false,  // ← Now false!
  errors: ['❌ Miya: Tidak cocok untuk Jungling (lanes: Gold Lane)'],
  warnings: [],
  heroesWithLanes: 5,
  mismatchCount: 1
}
```

**UI Display:**
- 🚫 Red error box with "❌ INVALID"
- Clear indication draft is not optimal
- User thinks: "Need to fix this"

---

## Validation Logic Flow

```
Start
  ↓
Check heroes without lanes
  → If any → ERROR (critical)
  ↓
Check each hero's lane match
  → If mismatch → ERROR + increment mismatchCount
  ↓
Check duplicate primary lanes
  → If duplicate → WARNING
  ↓
Check mismatch threshold
  → If mismatchCount >= 3 → ERROR (critical)
  ↓
Check team composition (CC, Burst, Objective)
  → If missing → WARNING
  ↓
Determine isValid
  → isValid = (errors.length === 0)
  ↓
Return { isValid, errors, warnings, mismatchCount }
```

---

## Error vs Warning Criteria

### ERRORS (Block validation, isValid = false)
| Condition | Threshold | Rationale |
|-----------|-----------|-----------|
| **Heroes without lanes** | Any (1+) | Cannot validate lane assignment |
| **Lane mismatch** | Per hero | Hero cannot effectively play this lane |
| **Too many mismatches** | 3+ out of 5 | Draft composition fundamentally flawed |

### WARNINGS (Non-blocking, isValid = true)
| Condition | Threshold | Rationale |
|-----------|-----------|-----------|
| **Duplicate primary lanes** | Any | Suboptimal but playable |
| **No CC** | Team check | Reduces team effectiveness |
| **No Burst** | Team check | Reduces kill potential |
| **No Objective control** | Team check | Harder to secure objectives |

---

## UI Changes

### Validation Summary Badge (NEW)

**Before:**
```jsx
{validation.errors.length === 0 && validation.warnings.length === 0 && (
  <div>✓ Draft looks good!</div>
)}
```

**After:**
```jsx
<div className={`p-3 rounded-lg border-2 ${
  validation.isValid 
    ? 'bg-green-900 border-green-500' 
    : 'bg-red-900 border-red-500'
}`}>
  <p className={`font-bold ${validation.isValid ? 'text-green-400' : 'text-red-400'}`}>
    {validation.isValid ? '✅ VALID' : '❌ INVALID'} - {validation.errors.length} errors, {validation.warnings.length} warnings
  </p>
  {validation.mismatchCount > 0 && (
    <p className="text-sm text-gray-300">
      Lane mismatches: {validation.mismatchCount}/{validation.heroesWithLanes}
    </p>
  )}
</div>
```

---

### Error Display (Enhanced)

**Before:**
```jsx
<div className="bg-red-900 bg-opacity-30">
  <p>Errors:</p>
  <ul>{errors.map(...)}</ul>
</div>
```

**After:**
```jsx
<div className="p-3 bg-red-900 bg-opacity-40 border-2 border-red-700 rounded">
  <p className="font-semibold text-red-400 mb-2">🚫 ERRORS (Draft tidak valid):</p>
  <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
    {validation.errors.map((error, idx) => (
      <li key={idx}>{error}</li>
    ))}
  </ul>
</div>
```

---

## Test Cases

### Test 1: Valid Draft (All Lanes Match)

**Input:**
```javascript
draftResult.draft.options = [
  { name: 'Miya', lanes: [{ lane_name: 'Gold Lane', priority: 1 }] },     // Slot 0: Gold
  { name: 'Thamuz', lanes: [{ lane_name: 'Exp Lane', priority: 1 }] },    // Slot 1: Exp
  { name: 'Kagura', lanes: [{ lane_name: 'Mid Lane', priority: 1 }] },    // Slot 2: Mid
  { name: 'Fanny', lanes: [{ lane_name: 'Jungling', priority: 1 }] },     // Slot 3: Jungle
  { name: 'Tigreal', lanes: [{ lane_name: 'Roaming', priority: 1 }] }     // Slot 4: Roaming
];
```

**Expected:**
```javascript
{
  isValid: true,
  errors: [],
  warnings: [],
  mismatchCount: 0
}
```

---

### Test 2: Single Mismatch

**Input:**
```javascript
draftResult.draft.options = [
  { name: 'Miya', lanes: [{ lane_name: 'Jungling', priority: 1 }] },  // ← Wrong! Miya tidak cocok Jungle
  { name: 'Thamuz', lanes: [{ lane_name: 'Exp Lane', priority: 1 }] },
  { name: 'Kagura', lanes: [{ lane_name: 'Mid Lane', priority: 1 }] },
  { name: 'Fanny', lanes: [{ lane_name: 'Gold Lane', priority: 1 }] },  // ← Wrong! Fanny bukan Gold Lane
  { name: 'Tigreal', lanes: [{ lane_name: 'Roaming', priority: 1 }] }
];
```

**Expected:**
```javascript
{
  isValid: false,  // ← 2 mismatches
  errors: [
    '❌ Miya: Tidak cocok untuk Gold Lane (lanes: Jungling)',
    '❌ Fanny: Tidak cocok untuk Jungling (lanes: Gold Lane)'
  ],
  warnings: [],
  mismatchCount: 2
}
```

---

### Test 3: Too Many Mismatches (3+)

**Input:**
```javascript
draftResult.draft.options = [
  { name: 'Miya', lanes: [{ lane_name: 'Mid Lane', priority: 1 }] },      // ← Wrong
  { name: 'Thamuz', lanes: [{ lane_name: 'Roaming', priority: 1 }] },    // ← Wrong
  { name: 'Kagura', lanes: [{ lane_name: 'Gold Lane', priority: 1 }] },   // ← Wrong
  { name: 'Fanny', lanes: [{ lane_name: 'Jungling', priority: 1 }] },    // ✓ Correct
  { name: 'Tigreal', lanes: [{ lane_name: 'Roaming', priority: 1 }] }    // ✓ Correct
];
```

**Expected:**
```javascript
{
  isValid: false,
  errors: [
    '❌ Miya: Tidak cocok untuk Gold Lane (lanes: Mid Lane)',
    '❌ Thamuz: Tidak cocok untuk Exp Lane (lanes: Roaming)',
    '❌ Kagura: Tidak cocok untuk Mid Lane (lanes: Gold Lane)',
    '⚠️ KRITIS: 3/5 heroes tidak cocok dengan lane assignment. Draft tidak optimal!'
  ],
  warnings: [],
  mismatchCount: 3
}
```

---

### Test 4: Heroes Without Lanes

**Input:**
```javascript
draftResult.draft.options = [
  { name: 'Miya', lanes: [{ lane_name: 'Gold Lane', priority: 1 }] },
  { name: 'NewHero', lanes: [] },  // ← No lanes data!
  { name: 'Kagura', lanes: [{ lane_name: 'Mid Lane', priority: 1 }] },
  { name: 'Fanny', lanes: [{ lane_name: 'Jungling', priority: 1 }] },
  { name: 'Tigreal', lanes: [{ lane_name: 'Roaming', priority: 1 }] }
];
```

**Expected:**
```javascript
{
  isValid: false,
  errors: [
    '⚠️ KRITIS: NewHero tidak punya data lanes. Jalankan \'npm run sync:heroes\' atau tambahkan lanes di DB.'
  ],
  warnings: [],
  mismatchCount: 0,
  heroesWithLanes: 4
}
```

---

## Integration with API Response

**API `/api/draft-simulation` already returns:**
```javascript
{
  "teamValidation": {
    "isValid": true/false,
    "errors": [...],
    "warnings": [...],
    "details": { ... }
  }
}
```

**DraftPickSimulator uses:**
```javascript
const validation = draftResult ? laneValidation() : { isValid: true, errors: [], warnings: [] };
```

**Consistent validation structure:**
- Both use `isValid` boolean
- Both have `errors` and `warnings` arrays
- UI can display both consistently

---

## Benefits

### 1. Clear Feedback
- ✅ User knows immediately if draft is VALID or INVALID
- ✅ Errors clearly distinguish critical issues from warnings
- ✅ Visual indicators (red vs yellow vs green)

### 2. Data Quality
- ✅ Detect heroes without lanes data early
- ✅ Prevent misleading "valid" status
- ✅ Encourage proper lane assignments

### 3. Consistency
- ✅ Matches ManualDraftPick validation strictness
- ✅ Same error/warning patterns
- ✅ Predictable behavior across UI

### 4. Better UX
- ✅ "Draft tidak valid" → User knows to fix it
- ✅ Threshold-based errors (3+ mismatches) → Prevents extreme cases
- ✅ Actionable error messages (with hero lanes info)

---

## Files Modified

1. ✅ `components/DraftPickSimulator.js`
   - Enhanced `laneValidation()` function
   - Added heroes without lanes check
   - Added mismatch count tracking
   - Added threshold for too many mismatches
   - Changed `isValid` from `true` always → `errors.length === 0`

2. ✅ `docs/STRICT-LANE-VALIDATION.md` (NEW, this document)

---

## Related Documentation

- **Comprehensive validation:** `docs/COMPREHENSIVE-VALIDATION.md`
- **Lane-aware recommendation:** `docs/LANE-AWARE-RECOMMENDATION.md`
- **Phase 1 Hybrid approach:** `docs/PHASE1-IMPLEMENTATION-SUMMARY.md`

---

## Future Enhancements

### 1. Configurable Threshold
```javascript
const MISMATCH_THRESHOLD = process.env.NEXT_PUBLIC_MISMATCH_THRESHOLD || 3;
```

### 2. Auto-fix Suggestions
```javascript
if (!isLaneMatch) {
  const suggestedSlot = findBestSlotForHero(hero, allHeroes);
  errors.push(`❌ ${hero.name}: Tidak cocok untuk ${assignedLane.lane}. Coba assign ke ${suggestedSlot.lane}.`);
}
```

### 3. Severity Levels
```javascript
{
  critical: ['Heroes without lanes', 'Too many mismatches'],
  high: ['Single lane mismatch'],
  medium: ['Duplicate primary lanes'],
  low: ['Team composition warnings']
}
```

---

## Conclusion

Enhanced strict validation ensures DraftPickSimulator provides **accurate and actionable feedback** about lane assignments. Users can now trust that `isValid: true` means draft is genuinely optimal, not just "no critical system errors."

**Key Achievement:** Moved from "always valid" to "validated based on actual lane data and thresholds."
