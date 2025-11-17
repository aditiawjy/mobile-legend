# Fix: ReferenceError - DRAFT_POSITIONS is not defined

## Error Report

**Error message:**
```
ReferenceError: DRAFT_POSITIONS is not defined
```

**Location:** `components/ManualDraftPick.js` line ~927

---

## Root Cause

During refactoring to data-driven lanes, one reference to `DRAFT_POSITIONS` was missed:

**Line 927 (before fix):**
```javascript
return DRAFT_POSITIONS.map((position, idx) => {
```

This reference was inside the hero counters section, which was not caught by the initial `change_all` edit because it had slightly different context.

---

## Fix Applied

**Changed:**
```javascript
// Before (❌ Error)
return DRAFT_POSITIONS.map((position, idx) => {

// After (✅ Fixed)
return lanes.map((position, idx) => {
```

**File:** `components/ManualDraftPick.js` line 927

---

## Verification

**Check 1: No more DRAFT_POSITIONS references**
```bash
grep -r "DRAFT_POSITIONS" components/
```

**Result:**
```
components/ManualDraftPick.js:15:  const [lanes, setLanes] = useState(getDefaultLanes()); // Dynamic lanes from DB (replaces DRAFT_POSITIONS)
```

✅ Only found in comment (safe)

---

**Check 2: No more LANE_ASSIGNMENTS references**
```bash
grep -r "LANE_ASSIGNMENTS" components/
```

**Result:** ✅ No matches found

---

**Check 3: Server still running**
```bash
curl -I http://localhost:3001
```

**Result:** ✅ 200 OK

---

## All References Fixed

### DraftPickSimulator.js
- ✅ Line 129: `LANE_ASSIGNMENTS[idx]` → `lanes[idx]`
- ✅ Line 253: `LANE_ASSIGNMENTS.map` → `lanes.map`
- ✅ Line 300: `LANE_ASSIGNMENTS[idx]` → `lanes[idx]`

### ManualDraftPick.js
- ✅ Line 251: `DRAFT_POSITIONS[laneIndex]` → `lanes[laneIndex]`
- ✅ Line 565: `DRAFT_POSITIONS.forEach` → `lanes.forEach`
- ✅ Line 602: `DRAFT_POSITIONS.map` → `lanes.map`
- ✅ Line 724: `DRAFT_POSITIONS.map` → `lanes.map`
- ✅ Line 846: `DRAFT_POSITIONS.map` → `lanes.map`
- ✅ Line 927: `DRAFT_POSITIONS.map` → `lanes.map` ← **This was the missing one**

---

## Prevention

To prevent similar issues in future refactoring:

### 1. Use Global Search
```bash
# Search all files recursively
grep -r "CONSTANT_NAME" .
```

### 2. Check Multiple Contexts
When using `change_all: true`, verify that ALL occurrences are in similar contexts. If some have different surrounding code, they might not match.

### 3. Test After Refactoring
- Reload page in browser
- Check console for errors
- Test key functionality

---

## Lesson Learned

**Pattern-based replacement (`change_all: true`) might miss occurrences with:**
- Different indentation
- Different surrounding context
- Inside complex nested structures

**Solution:** After bulk replace, always grep for any remaining references.

---

## Status

✅ **RESOLVED** - All hardcoded lane constants replaced with dynamic `lanes` state.
