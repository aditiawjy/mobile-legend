# Comprehensive Team Composition Validation

## Problem Yang Diselesaikan

**Masalah awal:**
Validasi tim otomatis (`validateDraftTeam`) terlalu sederhana - hanya cek jumlah role berbeda ≥ 3. Tidak ada validasi eksplisit untuk:
- ❌ Minimal 1 Tank/tanky hero
- ❌ Crowd Control (CC)
- ❌ Burst damage
- ❌ Objective control

Padahal di manual draft pick (`components/ManualDraftPick.js`) sudah ada validasi kompleks tersebut.

**Dampak:**
- Auto recommendation bisa generate team tanpa tank → team lemah
- Tidak ada warning untuk kurang CC/burst
- User tidak aware jika team composition kurang balanced

---

## Solution: Shared Validation Module

### 1. New File: `lib/teamValidation.js`

**Exported functions:**
```javascript
// Helper checks
export function hasCC(hero)                // Check Crowd Control
export function hasBurst(hero)             // Check Burst damage
export function hasAreaDamage(hero)        // Check AoE damage
export function isTankOrTanky(hero)        // Check Tank/durable hero
export function hasObjectiveControl(hero)  // Check Jungler/objective
export function getRoamingPlaystyle(hero)  // Classify roaming style
export function getPrimaryRole(roleString) // Extract primary role

// Comprehensive validation
export function validateTeamComposition(heroes) // Main validation function
```

---

### 2. Validation Logic Details

**`validateTeamComposition(heroes)` returns:**
```javascript
{
  isValid: boolean,      // No CRITICAL errors
  errors: string[],      // CRITICAL issues (e.g., no tank for 5-hero team)
  warnings: string[],    // NON-CRITICAL issues (e.g., no CC, no burst)
  details: {
    roleDistribution: {},         // { Marksman: 1, Tank: 1, ... }
    damageTypes: {},               // { physical: 3, magic: 2, mixed: 0 }
    hasTank: boolean,              // Has Tank/tanky hero
    hasCC: boolean,                // Has Crowd Control
    hasBurst: boolean,             // Has Burst damage
    hasObjectiveControl: boolean   // Has Jungler/objective control
  }
}
```

---

### 3. Validation Rules

#### Critical Errors (Block team as invalid)
```javascript
// Team with 4-5 heroes MUST have tank
if (!details.hasTank && validHeroes.length >= 4) {
  errors.push('⚠️ KRITIS: Tim tidak punya Tank/Hero tahan badan! Tim akan sulit bertahan.');
}
```

#### Warnings (Non-blocking)
```javascript
// Team without CC (3+ heroes)
if (!details.hasCC && validHeroes.length >= 3) {
  warnings.push('Tim tidak punya Crowd Control yang jelas (no hard CC).');
}

// Team without Burst (3+ heroes)
if (!details.hasBurst && validHeroes.length >= 3) {
  warnings.push('Tim tidak punya burst damage yang kuat (no burst).');
}

// Team without Objective control (4+ heroes)
if (!details.hasObjectiveControl && validHeroes.length >= 4) {
  warnings.push('Tim lemah dalam objective control (Turtle/Lord).');
}

// Role diversity check (5 heroes)
if (validHeroes.length >= 5 && roleCount < 3) {
  warnings.push(`Tim kurang beragam: hanya ${roleCount} role berbeda.`);
}

// Damage type diversity (4+ heroes)
if (validHeroes.length >= 4) {
  if (details.damageTypes.physical === 0) {
    warnings.push('Tim tidak punya physical damage. Musuh bisa stack magic resist.');
  }
  if (details.damageTypes.magic === 0) {
    warnings.push('Tim tidak punya magic damage. Musuh bisa stack armor.');
  }
}
```

---

### 4. Helper Function Details

#### `isTankOrTanky(hero)`
```javascript
// Check if hero is Tank or has tanky properties
const role = hero.role?.toLowerCase() || '';
const ar = hero.attack_reliance?.toLowerCase() || '';
const note = hero.note?.toLowerCase() || '';

// Primary: Role contains "tank"
if (role.includes('tank')) return true;

// Secondary: Fighter/Support with durability keywords
const tankyKeywords = ['guard', 'regen', 'shield', 'defense', 'tebal', 'tahan', 'durability', 'sustain'];
if ((role.includes('fighter') || role.includes('support')) && 
    tankyKeywords.some(keyword => ar.includes(keyword) || note.includes(keyword))) {
  return true;
}

return false;
```

#### `hasCC(hero)`
```javascript
// Check for Crowd Control keywords
const ccKeywords = ['control', 'crowd', 'stun', 'immobilize', 'knock', 'slow', 'suppress', 'pull', 'freeze', 'terrify'];
return ccKeywords.some(keyword => ar.includes(keyword) || note.includes(keyword));
```

#### `hasBurst(hero)`
```javascript
// Check for Burst damage keyword
return ar.includes('burst') || note.includes('burst');
```

#### `hasObjectiveControl(hero)`
```javascript
// Check for Jungler/objective control keywords
const junglerKeywords = ['jungle', 'jungling', 'hyper', 'retri', 'retribution'];
const objectiveKeywords = ['lord', 'turtle', 'objective', 'secure', 'steal'];

if (junglerKeywords.some(keyword => ar.includes(keyword) || note.includes(keyword))) {
  return true;
}
if (objectiveKeywords.some(keyword => note.includes(keyword))) {
  return true;
}
return false;
```

---

## Before vs After

### Before (❌ Simple Validation)

**Code (lib/draftPick.js, validateDraftTeam):**
```javascript
function validateDraftTeam(heroes) {
  const roles = heroes.map(h => getPrimaryRole(h.role));
  const roleCount = {};
  roles.forEach(role => {
    roleCount[role] = (roleCount[role] || 0) + 1;
  });

  return {
    isBalanced: Object.keys(roleCount).length >= 3,  // ← TOO SIMPLE
    roleDistribution: roleCount,
  };
}
```

**Output:**
```json
{
  "isBalanced": true,
  "roleDistribution": { "Marksman": 2, "Mage": 2, "Support": 1 }
}
```

**Problems:**
- ❌ No tank check → team tanpa tank dianggap valid
- ❌ No CC check
- ❌ No burst check
- ❌ No objective control check
- ❌ No damage type diversity check

---

### After (✅ Comprehensive Validation)

**Code (lib/draftPick.js, validateDraftTeam):**
```javascript
import { validateTeamComposition } from './teamValidation.js';

function validateDraftTeam(heroes) {
  return validateTeamComposition(heroes);  // ← Use comprehensive validation
}
```

**Output:**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [],
  "details": {
    "roleDistribution": { "Marksman": 1, "Tank": 1, "Support": 1, "Mage": 1, "Fighter": 1 },
    "damageTypes": { "physical": 3, "magic": 2, "mixed": 0 },
    "hasTank": true,
    "hasCC": true,
    "hasBurst": true,
    "hasObjectiveControl": true
  }
}
```

**Benefits:**
- ✅ Explicit tank check
- ✅ Explicit CC check
- ✅ Explicit burst check
- ✅ Explicit objective control check
- ✅ Damage type diversity check
- ✅ Errors vs Warnings separation

---

## Test Results

### Test Case 1: Balanced Team (Miya + recommended partners)

**API Call:**
```bash
GET /api/draft-simulation?hero=Miya
```

**Validation Result:**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [],
  "details": {
    "roleDistribution": {
      "Marksman": 1,
      "Tank": 1,
      "Support": 1,
      "Mage": 1,
      "Fighter": 1
    },
    "damageTypes": {
      "physical": 3,
      "magic": 2,
      "mixed": 0
    },
    "hasTank": true,
    "hasCC": true,
    "hasBurst": true,
    "hasObjectiveControl": true
  }
}
```

**Analysis:**
- ✅ Perfect balanced team
- ✅ All checks passed
- ✅ No errors or warnings

---

### Test Case 2: Team Without Tank (Hypothetical)

**Team composition:**
- Layla (Marksman, physical)
- Beatrix (Marksman, physical)
- Kagura (Mage, magic)
- Harley (Mage, magic)
- Angela (Support, magic)

**Expected validation:**
```json
{
  "isValid": false,
  "errors": [
    "⚠️ KRITIS: Tim tidak punya Tank/Hero tahan badan! Tim akan sulit bertahan."
  ],
  "warnings": [
    "Tim tidak punya Crowd Control yang jelas (no hard CC).",
    "Tim lemah dalam objective control (Turtle/Lord)."
  ],
  "details": {
    "roleDistribution": { "Marksman": 2, "Mage": 2, "Support": 1 },
    "damageTypes": { "physical": 2, "magic": 3, "mixed": 0 },
    "hasTank": false,
    "hasCC": false,
    "hasBurst": true,
    "hasObjectiveControl": false
  }
}
```

**Analysis:**
- ❌ Critical: No tank
- ⚠️ Warning: No CC
- ⚠️ Warning: No objective control
- ✅ Has burst damage
- ✅ Damage type diversity OK

---

## Integration Points

### 1. Auto Draft Recommendation (`/api/draft-simulation`)

**Response structure:**
```json
{
  "success": true,
  "data": {
    "selectedHero": { ... },
    "recommendedPartners": [ ... ],
    "draft": { "options": [...] },
    "teamValidation": {
      "isValid": true,
      "errors": [],
      "warnings": [],
      "details": { ... }
    }
  }
}
```

### 2. Manual Draft Pick (Future)

**Can use shared functions:**
```javascript
import { 
  validateTeamComposition, 
  isTankOrTanky, 
  hasCC, 
  hasBurst, 
  hasObjectiveControl 
} from '../lib/teamValidation';

// Use in component
const validation = validateTeamComposition(pickedHeroes);
```

---

## Validation Thresholds

| Check | Threshold | Type |
|-------|-----------|------|
| **Tank/Tanky** | 4-5 heroes | ERROR (critical) |
| **Tank/Tanky** | 2-3 heroes | WARNING |
| **CC** | 3+ heroes | WARNING |
| **Burst** | 3+ heroes | WARNING |
| **Objective Control** | 4+ heroes | WARNING |
| **Role Diversity** | 5 heroes, <3 roles | WARNING |
| **Physical Damage** | 4+ heroes, 0 physical | WARNING |
| **Magic Damage** | 4+ heroes, 0 magic | WARNING |

---

## Field Compatibility

**Both field name variations supported:**
```javascript
// Database format (snake_case)
hero.attack_reliance
hero.damage_type

// CSV format (camelCase)
hero.attackReliance
hero.damageType
```

**Code handles both:**
```javascript
const ar = hero.attack_reliance?.toLowerCase() || hero.attackReliance?.toLowerCase() || '';
```

---

## Benefits

### 1. Consistency
- ✅ Same validation logic for auto + manual draft
- ✅ No divergence between UI and API
- ✅ Single source of truth

### 2. Better UX
- ✅ User gets clear feedback on team weaknesses
- ✅ Errors vs Warnings distinction
- ✅ Actionable recommendations

### 3. Maintainability
- ✅ Shared code in `lib/teamValidation.js`
- ✅ Easy to add new checks
- ✅ Easy to update thresholds

### 4. Data-Driven
- ✅ Validation based on hero data (attack_reliance, note)
- ✅ No hardcoded hero names
- ✅ Works with any hero in database

---

## Files Modified

1. ✏️ **`lib/teamValidation.js`** (NEW)
   - Helper functions: hasCC, hasBurst, isTankOrTanky, hasObjectiveControl, etc.
   - Main function: validateTeamComposition()

2. ✏️ **`lib/draftPick.js`**
   - Import validateTeamComposition
   - Replace simple validateDraftTeam() logic

3. ✏️ **`docs/COMPREHENSIVE-VALIDATION.md`** (NEW, dokumentasi ini)

---

## Future Enhancements

### 1. Counter-Pick Validation
```javascript
// Check if team can counter enemy picks
export function validateCounterPicks(myTeam, enemyTeam) {
  // Check if we have CC for mobile assassins
  // Check if we have burst for squishy mages
  // etc.
}
```

### 2. Meta-Aware Validation
```javascript
// Adjust thresholds based on current meta
if (currentMeta.isTankMeta) {
  // Require 2 tanks instead of 1
}
```

### 3. Lane-Specific Validation
```javascript
// Validate lane matchups
export function validateLaneMatchups(myDraft, enemyDraft) {
  // Check Gold Lane: Marksman vs Marksman
  // Check Exp Lane: Fighter/Tank sustainability
  // etc.
}
```

---

## Compliance with AGENTS.md

✅ **Data-driven validation:**
- Hero properties (attack_reliance, note) from CSV/DB
- No hardcoded hero lists
- Keyword-based detection

✅ **Consistent with existing manual validation:**
- Same helper functions logic
- Same thresholds
- Same error/warning messages

✅ **Documented:**
- Clear validation rules
- Test cases included
- Integration points specified

---

## Related Documentation

- **Lane-aware recommendation:** `docs/LANE-AWARE-RECOMMENDATION.md`
- **Fallback logic fix:** `docs/FIX-FALLBACK-LOGIC.md`
- **CSV Sync:** `scripts/README-SYNC-HEROES.md`
