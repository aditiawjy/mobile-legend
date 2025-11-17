# Data-Driven Lanes: From Hardcoded to Database

## Problem Yang Diselesaikan

**Masalah awal:**
Lanes definitions (order, label, icon) di-hardcode di 2 tempat berbeda:
- `components/DraftPickSimulator.js` → `LANE_ASSIGNMENTS`
- `components/ManualDraftPick.js` → `DRAFT_POSITIONS`

**Dampak:**
- ❌ Duplikasi data (2 array identik di 2 file)
- ❌ Tidak sync dengan tabel `lanes` di database
- ❌ Jika DB berubah (new lane, rename, reorder), UI tidak ikut update
- ❌ Hardcoded icon dan label di-maintain manual

**Example conflict:**
```sql
-- Admin update lane name di DB
UPDATE lanes SET lane_name = 'Core Lane' WHERE lane_name = 'Jungling';
```
→ UI masih tampil "Jungling" karena hardcoded ❌

---

## Solution: Single Source of Truth (Database)

### Architecture

```
┌─────────────┐
│  lanes table│ ← Master data (DB)
│  (MySQL)    │   - id, lane_name, description
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ /api/lanes  │ ← API endpoint
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ lib/laneConstants│ ← Transformation layer
│ .js              │   - Fetch from API
│                  │   - Add icon mapping
│                  │   - Fallback defaults
└──────┬───────────┘
       │
       ├────────────────────┬─────────────────────┐
       ▼                    ▼                     ▼
┌─────────────┐   ┌──────────────────┐   ┌────────────┐
│ DraftPick   │   │ ManualDraftPick  │   │ Future     │
│ Simulator   │   │                  │   │ Components │
└─────────────┘   └──────────────────┘   └────────────┘
```

---

## Implementation Details

### 1. Shared Library: `lib/laneConstants.js`

**Purpose:** Centralize lane data fetching and transformation

**Key functions:**

#### `fetchLanes()`
```javascript
export async function fetchLanes() {
  try {
    const response = await fetch('/api/lanes');
    if (!response.ok) {
      return getDefaultLanes(); // Fallback
    }
    const dbLanes = await response.json();
    return transformLanesToUI(dbLanes);
  } catch (error) {
    console.error('Error fetching lanes:', error);
    return getDefaultLanes();
  }
}
```

**Returns:**
```javascript
[
  { id: 1, label: 'Gold Lane', lane: 'Gold Lane', icon: '💰', description: '...' },
  { id: 2, label: 'Exp Lane', lane: 'Exp Lane', icon: '⚔️', description: '...' },
  ...
]
```

---

#### `transformLanesToUI(dbLanes)`
```javascript
export function transformLanesToUI(dbLanes) {
  return dbLanes.map(lane => ({
    id: lane.id,
    label: lane.lane_name,
    lane: lane.lane_name,
    icon: LANE_ICONS[lane.lane_name] || '🔵', // Fallback icon
    description: lane.description,
  }));
}
```

**Why icon mapping in frontend?**
- Icons are **UI concern**, not data concern
- Easier to update icons without DB migration
- No need for emoji storage in MySQL

---

#### `LANE_ICONS` (Constant)
```javascript
export const LANE_ICONS = {
  'Gold Lane': '💰',
  'Exp Lane': '⚔️',
  'Mid Lane': '🎯',
  'Jungling': '🌳',
  'Roaming': '🛡️',
};
```

**Centralized mapping:**
- Single place to update icons
- Can add new lanes without code changes (just update DB)
- Fallback: '🔵' for unknown lanes

---

#### `getDefaultLanes()` (Fallback)
```javascript
export function getDefaultLanes() {
  return [
    { id: 1, label: 'Gold Lane', lane: 'Gold Lane', icon: '💰' },
    { id: 2, label: 'Exp Lane', lane: 'Exp Lane', icon: '⚔️' },
    { id: 3, label: 'Mid Lane', lane: 'Mid Lane', icon: '🎯' },
    { id: 4, label: 'Jungling', lane: 'Jungling', icon: '🌳' },
    { id: 5, label: 'Roaming', lane: 'Roaming', icon: '🛡️' },
  ];
}
```

**When used:**
- API fetch fails (network error, server down)
- DB query fails
- Ensures UI never breaks

---

### 2. Component Updates

#### Before (❌ Hardcoded)

**DraftPickSimulator.js:**
```javascript
const LANE_ASSIGNMENTS = [
  { id: 1, label: 'Gold Lane', lane: 'Gold Lane', icon: '💰' },
  // ...
];

// Used directly in JSX
const assignedLane = LANE_ASSIGNMENTS[idx];
```

**ManualDraftPick.js:**
```javascript
const DRAFT_POSITIONS = [
  { id: 1, label: 'Gold Lane', lane: 'Gold Lane', icon: '💰' },
  // ...
];

// Used directly in JSX
const targetLane = DRAFT_POSITIONS[laneIndex].lane;
```

**Problems:**
- Duplicate definitions
- Not synchronized
- Hard to update

---

#### After (✅ Data-Driven)

**Both components:**
```javascript
import { fetchLanes, getDefaultLanes } from '../lib/laneConstants';

export default function Component() {
  const [lanes, setLanes] = useState(getDefaultLanes());

  useEffect(() => {
    async function loadLanes() {
      try {
        const fetchedLanes = await fetchLanes();
        setLanes(fetchedLanes);
        console.log('Loaded lanes from DB:', fetchedLanes.map(l => l.lane).join(', '));
      } catch (error) {
        console.error('Error loading lanes:', error);
      }
    }
    loadLanes();
  }, []);

  // Use dynamic lanes state
  const assignedLane = lanes[idx];
}
```

**Benefits:**
- ✅ Single source of truth (DB)
- ✅ Automatic UI update when DB changes
- ✅ Graceful fallback if API fails
- ✅ No code duplication

---

### 3. API Endpoint: `/api/lanes`

**Already exists:** `pages/api/lanes/index.js`

**Query:**
```javascript
const lanes = await query('SELECT * FROM lanes ORDER BY id');
```

**Response format:**
```json
[
  {
    "id": 1,
    "lane_name": "Gold Lane",
    "description": "Lane for marksman and some mages...",
    "created_at": "2025-11-08T...",
    "updated_at": "2025-11-08T..."
  },
  ...
]
```

**Note:** No `icon` field in DB (by design - UI concern)

---

## Before vs After Comparison

### Data Flow

#### Before (Hardcoded)
```
Component A: LANE_ASSIGNMENTS = [...]  ← Hardcoded
Component B: DRAFT_POSITIONS = [...]   ← Hardcoded (duplicate!)
```

No connection to database ❌

---

#### After (Data-Driven)
```
Database (lanes table)
  ↓
/api/lanes (fetch)
  ↓
lib/laneConstants.js (transform + icon mapping)
  ↓
Component state (lanes)
  ↓
UI rendering
```

Single source of truth ✅

---

### Update Scenario

#### Scenario: Rename "Jungling" → "Core Lane"

**Before:**
```sql
UPDATE lanes SET lane_name = 'Core Lane' WHERE lane_name = 'Jungling';
```

Then manually update:
1. ❌ `DraftPickSimulator.js` → change LANE_ASSIGNMENTS
2. ❌ `ManualDraftPick.js` → change DRAFT_POSITIONS
3. ❌ Any other hardcoded references

**Result:** Error-prone, 3+ places to update

---

**After:**
```sql
UPDATE lanes SET lane_name = 'Core Lane' WHERE lane_name = 'Jungling';
```

Then optionally update icon mapping:
```javascript
// lib/laneConstants.js
export const LANE_ICONS = {
  'Core Lane': '🌳',  // Renamed from 'Jungling'
  // ...
};
```

**Result:** 
- ✅ UI auto-updates from DB
- ✅ Only 1 place to update (icon mapping, optional)
- ✅ All components sync automatically

---

### Add New Lane Scenario

**Scenario: Add "Off Lane" (new 6th lane)**

**Before:**
```sql
INSERT INTO lanes (lane_name, description) VALUES ('Off Lane', '...');
```

Then manually update:
1. ❌ LANE_ASSIGNMENTS → add 6th element
2. ❌ DRAFT_POSITIONS → add 6th element
3. ❌ All JSX that assumes 5 lanes

**Result:** Lots of code changes

---

**After:**
```sql
INSERT INTO lanes (lane_name, description) VALUES ('Off Lane', '...');
```

Then add icon mapping:
```javascript
// lib/laneConstants.js
export const LANE_ICONS = {
  'Off Lane': '🛤️',  // New icon
  // ...
};
```

**Result:**
- ✅ UI fetches 6 lanes from DB automatically
- ✅ Components loop through `lanes` state (no hardcoded 5)
- ✅ Only icon needs to be added

---

## Testing

### Test 1: Normal Operation

**Steps:**
1. Open DraftPickSimulator
2. Check browser console

**Expected:**
```
Loaded lanes from DB: Gold Lane, Exp Lane, Mid Lane, Jungling, Roaming
```

**Verify:**
- UI shows 5 lane slots
- Each has correct icon (💰, ⚔️, 🎯, 🌳, 🛡️)
- Lane names from DB, not hardcoded

---

### Test 2: API Failure (Fallback)

**Steps:**
1. Stop API server or break `/api/lanes` endpoint
2. Reload page

**Expected:**
```
Error fetching lanes: ...
```

**Verify:**
- UI still works with default lanes
- No crash
- Graceful degradation

---

### Test 3: Database Update

**Steps:**
1. Update DB:
   ```sql
   UPDATE lanes SET lane_name = 'Gold Farm Lane' WHERE id = 1;
   ```
2. Reload page

**Expected:**
```
Loaded lanes from DB: Gold Farm Lane, Exp Lane, Mid Lane, Jungling, Roaming
```

**Verify:**
- UI shows "Gold Farm Lane" instead of "Gold Lane"
- Icon still correct (💰 from mapping)
- No code changes needed

---

### Test 4: New Lane Addition

**Steps:**
1. Insert new lane:
   ```sql
   INSERT INTO lanes (lane_name, description) 
   VALUES ('Off Lane', 'Flexible 6th role for adaptive strategies');
   ```
2. Add icon mapping:
   ```javascript
   LANE_ICONS['Off Lane'] = '🛤️';
   ```
3. Reload page

**Expected:**
- UI shows 6 lanes
- New lane has icon 🛤️
- Components handle 6 lanes automatically (loop through `lanes` state)

---

## Benefits

### 1. Single Source of Truth
- ✅ Database is master
- ✅ No duplicate definitions
- ✅ Changes propagate automatically

### 2. Maintainability
- ✅ Update once (DB) → all components sync
- ✅ Icon mapping centralized
- ✅ Less code to maintain

### 3. Flexibility
- ✅ Add/remove/rename lanes without code changes
- ✅ Reorder lanes via DB `ORDER BY`
- ✅ Easy to extend (add metadata, priority, etc.)

### 4. Reliability
- ✅ Graceful fallback if API fails
- ✅ Never breaks UI
- ✅ Console logs for debugging

---

## Migration Guide

### For New Components

When creating new components that need lane data:

```javascript
import { fetchLanes, getDefaultLanes } from '../lib/laneConstants';

export default function MyComponent() {
  const [lanes, setLanes] = useState(getDefaultLanes());

  useEffect(() => {
    async function loadLanes() {
      const fetchedLanes = await fetchLanes();
      setLanes(fetchedLanes);
    }
    loadLanes();
  }, []);

  // Use lanes state
  return lanes.map(lane => (
    <div key={lane.id}>
      {lane.icon} {lane.label}
    </div>
  ));
}
```

---

### For Existing Components

**Steps:**
1. Remove hardcoded `LANE_ASSIGNMENTS` or `DRAFT_POSITIONS`
2. Import from `lib/laneConstants`
3. Add state: `const [lanes, setLanes] = useState(getDefaultLanes());`
4. Add useEffect to fetch lanes
5. Replace references: `LANE_ASSIGNMENTS[idx]` → `lanes[idx]`

**Example diff:**
```diff
- const LANE_ASSIGNMENTS = [...]
+ import { fetchLanes, getDefaultLanes } from '../lib/laneConstants';

export default function Component() {
+  const [lanes, setLanes] = useState(getDefaultLanes());
+
+  useEffect(() => {
+    async function loadLanes() {
+      const fetchedLanes = await fetchLanes();
+      setLanes(fetchedLanes);
+    }
+    loadLanes();
+  }, []);

-  const lane = LANE_ASSIGNMENTS[idx];
+  const lane = lanes[idx];
}
```

---

## Files Modified

### New Files
1. ✅ `lib/laneConstants.js` - Shared library for lane data

### Modified Files
1. ✅ `components/DraftPickSimulator.js`
   - Removed `LANE_ASSIGNMENTS` constant
   - Added dynamic `lanes` state
   - Fetch from API on mount
   
2. ✅ `components/ManualDraftPick.js`
   - Removed `DRAFT_POSITIONS` constant
   - Added dynamic `lanes` state
   - Fetch from API on mount

3. ✅ `docs/DATA-DRIVEN-LANES.md` (NEW, this document)

---

## Future Enhancements

### 1. Caching
```javascript
// Cache lanes in localStorage to reduce API calls
const cachedLanes = localStorage.getItem('lanes');
if (cachedLanes) {
  setLanes(JSON.parse(cachedLanes));
} else {
  const fetchedLanes = await fetchLanes();
  localStorage.setItem('lanes', JSON.stringify(fetchedLanes));
}
```

### 2. Icon in Database
```sql
ALTER TABLE lanes ADD COLUMN icon VARCHAR(10);
UPDATE lanes SET icon = '💰' WHERE lane_name = 'Gold Lane';
```

Then remove `LANE_ICONS` mapping from frontend.

### 3. Lane Reordering
```sql
ALTER TABLE lanes ADD COLUMN display_order INT DEFAULT 0;
SELECT * FROM lanes ORDER BY display_order, id;
```

UI respects DB order automatically.

### 4. Lane Metadata
```sql
ALTER TABLE lanes ADD COLUMN color VARCHAR(20);
ALTER TABLE lanes ADD COLUMN tooltip TEXT;
```

Add more context for UI rendering.

---

## Compliance with AGENTS.md

✅ **Database as master:**
- lanes table defined in AGENTS.md schema
- UI respects DB order and content

✅ **No magic values:**
- Lane names from DB, not hardcoded strings
- Icon mapping explicit and centralized

✅ **Consistent:**
- All components use same data source
- No divergence between components

---

## Related Documentation

- **CSV Sync:** `scripts/README-SYNC-HEROES.md`
- **Phase 1 Hybrid:** `docs/PHASE1-IMPLEMENTATION-SUMMARY.md`
- **Comprehensive Validation:** `docs/COMPREHENSIVE-VALIDATION.md`

---

## Conclusion

Moving from hardcoded lane definitions to data-driven approach significantly improves maintainability and flexibility. Database becomes single source of truth, UI automatically syncs, and adding/updating lanes no longer requires code changes.

**Key Achievement:** Zero component updates needed when lanes change in database.
