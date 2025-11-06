# Troubleshooting Error 404

## Kemungkinan Penyebab Error 404

### 1. **Image URL Tidak Valid atau Kosong**
**Penyebab paling umum setelah implementasi lazy loading**

Jika kolom `image_url` di database:
- Kosong (NULL)
- Berisi URL yang tidak valid
- Mengarah ke file yang tidak ada

**Solusi:**
- Error ini **NORMAL dan sudah di-handle** oleh LazyImage component
- Component akan otomatis fallback ke gradient circle dengan inisial
- Tidak perlu khawatir - ini bukan bug

**Cara mengisi image URL yang benar:**
1. Buka: `http://localhost:3000/edit-items`
2. Pilih item
3. Isi field "Image URL" dengan URL valid, contoh:
   ```
   https://i.imgur.com/example.png
   https://cdn.example.com/items/item-name.jpg
   ```

---

### 2. **Kolom image_url Belum Ada di Database**
**Jika migration belum dijalankan**

**Cek di browser console:**
```
Error: Unknown column 'image_url' in 'field list'
```

**Solusi:**

**Cara 1 - Via API (Recommended):**
1. Start dev server: `npm run dev`
2. Buat file test atau gunakan Postman/curl:
   ```bash
   curl -X POST http://localhost:3000/api/admin/add_items_image_url
   ```
3. Atau temporary ubah endpoint untuk accept GET dan buka di browser

**Cara 2 - Manual via MySQL:**
```sql
ALTER TABLE items ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;
```

**Cara 3 - Update migration endpoint untuk accept GET:**

Edit `/pages/api/admin/add_items_image_url.js`:
```javascript
// Ubah baris ini:
if (req.method !== 'POST') {
  return res.status(405).json({ error: 'Method not allowed' })
}

// Menjadi:
if (req.method !== 'POST' && req.method !== 'GET') {
  return res.status(405).json({ error: 'Method not allowed' })
}
```

Lalu akses di browser: `http://localhost:3000/api/admin/add_items_image_url`

---

### 3. **API Route Tidak Ditemukan**

**Cek di browser Network tab:**
- URL yang di-request: Contoh `/api/items/some-item-name`
- Status: 404

**Kemungkinan:**
- Next.js dev server belum di-restart setelah update
- File API route ter-delete atau di lokasi salah

**Solusi:**
1. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Verify API files ada:**
   ```
   pages/api/items/index.js        ✅ Should exist
   pages/api/items/[name].js       ✅ Should exist
   pages/api/items_search.js       ✅ Should exist
   ```

3. **Test API langsung di browser:**
   ```
   http://localhost:3000/api/items
   http://localhost:3000/api/items/Blade%20of%20Despair
   ```

---

### 4. **Next.js Static Build Issue**

Jika menjalankan production build (`npm run build && npm start`):

**Problem:** Dynamic routes mungkin tidak ter-generate

**Solusi:**
```bash
# Clean build
rm -rf .next

# Rebuild
npm run build

# Start
npm start
```

---

### 5. **CORS Error untuk External Images**

**Cek browser console:**
```
Failed to load resource: net::ERR_FAILED
Access to image at '...' from origin '...' has been blocked by CORS policy
```

**Solusi:**
- Gunakan image hosting yang support CORS (Imgur, Cloudinary, dll)
- Atau host images di `/public` folder Next.js
- Contoh valid image URLs:
  ```
  https://i.imgur.com/abc123.png         ✅ Works
  https://cdn.jsdelivr.net/...           ✅ Works  
  http://localhost:3000/images/item.png  ✅ Works
  ```

---

## Cara Debug Error 404

### Step 1: Buka Browser Developer Tools
- **Chrome/Edge:** F12 atau Ctrl+Shift+I
- **Firefox:** F12
- **Safari:** Cmd+Option+I

### Step 2: Check Console Tab
Cari error messages seperti:
```
GET http://localhost:3000/api/items/... 404 (Not Found)
GET https://invalid-url.com/image.png 404 (Not Found)
```

### Step 3: Check Network Tab
1. Klik tab "Network"
2. Refresh halaman
3. Filter "XHR" atau "Fetch" untuk API calls
4. Filter "Img" untuk image requests
5. Klik request yang merah (failed)
6. Lihat:
   - **Request URL:** URL yang diminta
   - **Status Code:** 404, 403, 500, dll
   - **Response:** Error message dari server

### Step 4: Identify Resource Type

**Jika image (*.png, *.jpg, dll):**
- ✅ **NORMAL** - LazyImage akan fallback
- Tidak perlu action

**Jika API (/api/...):**
- ❌ **PERLU FIX** - Check API endpoint
- Verify file exists dan syntax benar

---

## Quick Fixes

### Fix 1: Populate Sample Image URLs
```sql
-- Update beberapa items dengan sample images
UPDATE items 
SET image_url = 'https://i.imgur.com/placeholder.png' 
WHERE item_name = 'Blade of Despair';

UPDATE items 
SET image_url = 'https://i.imgur.com/placeholder2.png' 
WHERE item_name = 'Demon Hunter Sword';
```

### Fix 2: Update Migration Endpoint untuk GET
Edit `/pages/api/admin/add_items_image_url.js`:
```javascript
export default async function handler(req, res) {
  // Allow both GET and POST
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  // ... rest of code
}
```

### Fix 3: Add Default Image in LazyImage
Jika ingin default image untuk semua items tanpa URL:
```javascript
// Di LazyImage.js, update:
const renderFallback = () => {
  if (fallback) return fallback

  // Option 1: Use default image
  if (!src && defaultImage) {
    return <img src={defaultImage} alt={alt} className={className} />
  }

  // Option 2: Keep gradient fallback
  const firstLetter = alt ? alt.charAt(0).toUpperCase() : '?'
  return (
    <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center">
      <span className="text-white font-bold text-lg">{firstLetter}</span>
    </div>
  )
}
```

---

## Expected Behavior

### ✅ Normal (Tidak perlu fix):
- Image 404 → Fallback ke gradient circle dengan inisial
- Component masih render dengan baik
- Tidak ada error merah di console (hanya warning)

### ❌ Perlu Fix:
- API endpoint 404 → Halaman blank atau infinite loading
- Database error → Data tidak muncul
- "Unknown column" error → Migration belum jalan

---

## Pertanyaan Lanjutan?

Jika masih ada error, tolong share:
1. **Screenshot console error** (full error message)
2. **Screenshot Network tab** (request yang failed)
3. **URL yang diakses** (contoh: `/items?showAll=true`)
4. **Dev server logs** (terminal output)

Saya akan bantu debug lebih detail!
