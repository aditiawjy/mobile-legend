# Debug Error 500 - Internal Server Error

## 🔍 Apa itu Error 500?

**Error 500** = Server-side error - ada masalah di code backend (API routes).

Berbeda dengan error 404 (resource not found), error 500 artinya endpoint **ditemukan** tapi **gagal execute**.

---

## 🎯 Possible Causes (After Filter Implementation)

### 1. **Database Connection Error**
```
Error: connect ECONNREFUSED
Error: ER_ACCESS_DENIED_ERROR
```

### 2. **SQL Syntax Error** (Most Likely!)
```
Error: You have an error in your SQL syntax
```

Kemungkinan dari filter/sort query yang baru kita implementasikan.

### 3. **Null/Undefined Error**
```
TypeError: Cannot read property 'x' of undefined
```

### 4. **Missing Environment Variables**
```
Error: Missing .env.local configuration
```

---

## 🔧 Quick Debug Steps

### Step 1: Identify Failed Endpoint

**Open Browser Console (F12):**

Look for the failed request URL:
```
GET http://localhost:3000/api/items?category=...  500 (Internal Server Error)
GET http://localhost:3000/api/items/categories    500 (Internal Server Error)
```

**Note the URL** - ini yang bermasalah!

---

### Step 2: Check Dev Server Logs

**Look at terminal where `npm run dev` is running:**

You should see error stack trace, contoh:
```
Error: ER_PARSE_ERROR: You have an error in your SQL syntax
    at Query.Sequence._packetToError
    at D:\nextjs\ml\pages\api\items\index.js:45:20
```

**Copy full error message!**

---

### Step 3: Test API Directly

**Open browser and test API endpoints directly:**

```
http://localhost:3000/api/items
http://localhost:3000/api/items/categories
http://localhost:3000/api/items?category=Attack
```

Buka di browser → See error response.

---

## 🐛 Common Issues & Fixes

### Issue 1: SQL Template Literal Error

**Problem:**
```javascript
// WRONG - Template literal in string
const query = `
  SELECT ... 
  ${whereClause}    ← This won't work if whereClause is empty!
  LIMIT ? OFFSET ?
`
```

**Fix:**
```javascript
// CORRECT - Conditional building
let sql = 'SELECT ... FROM items'
if (whereClause) sql += ` ${whereClause}`
sql += ' LIMIT ? OFFSET ?'
```

---

### Issue 2: Empty WHERE Clause

**Problem:**
```javascript
const whereClause = ''  // Empty string
const query = `SELECT * FROM items WHERE ${whereClause}`
// Result: "SELECT * FROM items WHERE " ← Invalid SQL!
```

**Fix:**
```javascript
const whereClause = whereConditions.length > 0 
  ? `WHERE ${whereConditions.join(' AND ')}`
  : ''  // No WHERE if no conditions
```

---

### Issue 3: Parameter Mismatch

**Problem:**
```javascript
const params = [category, minPrice]  // 2 params
const sql = 'SELECT * WHERE category = ? AND price >= ? LIMIT ? OFFSET ?'
await query(sql, params)  // Need 4 params, only have 2! ❌
```

**Fix:**
```javascript
const params = [category, minPrice, limit, offset]  // All 4 params
await query(sql, params)  // ✅
```

---

### Issue 4: NULL Value in SQL

**Problem:**
```javascript
const category = null
const sql = 'SELECT * WHERE category = ?'
await query(sql, [category])  // category = NULL doesn't work as expected
```

**Fix:**
```javascript
// Only add to WHERE if value exists
if (category) {
  whereConditions.push('category = ?')
  params.push(category)
}
```

---

## 🔨 Likely Fix for Our Code

Based on the implementation, kemungkinan error di `/pages/api/items/index.js`:

### Check This Section:

```javascript
// Build WHERE clause
const whereConditions = []
const params = []

if (category) {
  whereConditions.push('category = ?')
  params.push(category)
}

if (minPrice !== null) {
  whereConditions.push('price >= ?')
  params.push(minPrice)
}

if (maxPrice !== null) {
  whereConditions.push('price <= ?')
  params.push(maxPrice)
}

const whereClause = whereConditions.length > 0 
  ? `WHERE ${whereConditions.join(' AND ')}`
  : ''

// This might cause issue:
const selectQuery = `
  SELECT item_name, category, price, description, image_url 
  FROM items 
  ${whereClause}      ← Problem if whereClause is malformed
  ${orderByClause}
  LIMIT ? OFFSET ?
`

const rows = await query(selectQuery, [...params, limit, offset])
```

---

## 🧪 Test & Verify

### Manual Test Cases:

#### Test 1: No Filters (Default)
```
GET /api/items
Expected: 200 OK
```

#### Test 2: Category Filter
```
GET /api/items?category=Attack
Expected: 200 OK
```

#### Test 3: Price Range
```
GET /api/items?minPrice=1000
Expected: 200 OK
```

#### Test 4: Sort
```
GET /api/items?sortBy=price&sortOrder=desc
Expected: 200 OK
```

#### Test 5: Combined
```
GET /api/items?category=Attack&minPrice=1000&sortBy=price
Expected: 200 OK
```

---

## 🚨 Emergency Rollback

If you can't fix immediately, rollback to working version:

```bash
# Stop server (Ctrl+C)

# Restore old API
cd D:\nextjs\ml
git status  # See changes
git checkout pages/api/items/index.js  # Restore old version

# Or manually restore from backup
# (if you have items-old.js or git history)

# Restart server
npm run dev
```

---

## 📋 Debug Checklist

```
□ Check browser console for failed URL
□ Check terminal server logs for error
□ Test API endpoint directly in browser
□ Copy full error message
□ Check SQL syntax in code
□ Verify params array matches placeholders
□ Test with/without filters
□ Check database connection (.env.local)
```

---

## 💡 How to Read Server Logs

**Error Stack Trace Example:**
```
Error: ER_PARSE_ERROR: You have an error in your SQL syntax; 
check the manual that corresponds to your MySQL server version 
for the right syntax to use near 'WHERE  ORDER BY item_name ASC LIMIT 20 OFFSET 0' 
at line 4
    at Query.Sequence._packetToError 
    at D:\nextjs\ml\pages\api\items\index.js:64:20
                                             ^^^ Line number!
```

**Important Info:**
- **Error Type:** ER_PARSE_ERROR (SQL syntax error)
- **Problem SQL:** `WHERE  ORDER BY` ← Double space, empty WHERE!
- **File & Line:** items\index.js:64

---

## 🔍 Debugging Tools

### 1. Console.log SQL Before Execute

```javascript
// Add before query execution
console.log('SQL:', selectQuery)
console.log('Params:', params)

const rows = await query(selectQuery, params)
```

### 2. Test SQL in MySQL Directly

```sql
-- Copy the SQL from console.log
-- Replace ? with actual values
-- Run in MySQL workbench/CLI

SELECT item_name, category, price, description, image_url 
FROM items 
WHERE category = 'Attack'
ORDER BY item_name ASC 
LIMIT 20 OFFSET 0;
```

### 3. Use Try-Catch for Better Error Messages

```javascript
try {
  const rows = await query(selectQuery, params)
  return res.json({ items: rows })
} catch (error) {
  console.error('Full error:', error)
  console.error('SQL:', selectQuery)
  console.error('Params:', params)
  return res.status(500).json({ 
    error: error.message,
    sql: selectQuery,  // For debug only! Remove in production
    params 
  })
}
```

---

## 📝 Next Steps

1. **Share the error details:**
   - Screenshot of browser console
   - Copy server terminal logs
   - Failed API URL

2. **We'll fix together!**
   - Identify exact SQL error
   - Apply fix
   - Test thoroughly

---

## 🎯 Most Likely Fix Preview

If error is from empty WHERE clause:

```javascript
// Before (might cause error):
const whereClause = whereConditions.length > 0 
  ? `WHERE ${whereConditions.join(' AND ')}`
  : ''

const selectQuery = `
  SELECT ... FROM items 
  ${whereClause}
  ${orderByClause}
  LIMIT ? OFFSET ?
`

// After (safer):
let selectQuery = 'SELECT ... FROM items'

if (whereConditions.length > 0) {
  selectQuery += ` WHERE ${whereConditions.join(' AND ')}`
}

selectQuery += ` ${orderByClause} LIMIT ? OFFSET ?`
```

---

**Please share:**
1. Terminal server logs (full error)
2. Browser console screenshot
3. Which URL is failing

I'll help fix it immediately! 🚀
