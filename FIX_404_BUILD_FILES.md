# Fix Error 404: Next.js Build Files Not Found

## Error yang Terjadi

```
_app-5ae6eae2a985ba92.js:1  Failed to load resource: 404 (Not Found)
42-ca5c248fa56d7165.js:1  Failed to load resource: 404 (Not Found)
items-1bb520ac1e41e750.js:1  Failed to load resource: 404 (Not Found)
_buildManifest.js:1  Failed to load resource: 404 (Not Found)
_ssgManifest.js:1  Failed to load resource: 404 (Not Found)
```

## Penyebab

Ini terjadi karena **browser cache mismatch** dengan build files di server. Biasanya terjadi setelah:
- Running `npm run build` (production build)
- Hot reload/fast refresh issue
- Multiple builds tanpa clear cache
- Browser masih mencoba load old webpack chunks

## ✅ Solusi Lengkap

### Quick Fix (5 detik) - **COBA INI DULU**

**Step 1: Hard Refresh Browser**
- **Chrome/Edge:** `Ctrl + Shift + R` atau `Ctrl + F5`
- **Firefox:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

**Step 2: Clear Browser Cache**
- **Chrome:** F12 → Network tab → Check "Disable cache" → Refresh
- Atau klik kanan Refresh button → "Empty Cache and Hard Reload"

Jika masih error, lanjut ke solusi lengkap:

---

### Solusi Lengkap (Clean & Rebuild)

#### **Option 1: PowerShell (Windows)**

```powershell
# Stop dev server (Ctrl+C jika sedang running)

# Masuk ke folder project
cd D:\nextjs\ml

# Clean build folder
Remove-Item -Recurse -Force .next

# Clear node modules cache (optional, jika masih error)
Remove-Item -Recurse -Force node_modules\.cache

# Rebuild dan start dev server
npm run dev
```

#### **Option 2: Command Prompt (Windows)**

```cmd
cd D:\nextjs\ml

rmdir /s /q .next
rmdir /s /q node_modules\.cache

npm run dev
```

#### **Option 3: Bash/Git Bash (Windows)**

```bash
cd /d/nextjs/ml

rm -rf .next
rm -rf node_modules/.cache

npm run dev
```

---

### Jika Masih Error - Full Clean

```powershell
cd D:\nextjs\ml

# Stop dev server (Ctrl+C)

# Remove all build artifacts
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
Remove-Item -Recurse -Force out

# Clear npm cache
npm cache clean --force

# Reinstall dependencies (optional, hanya jika perlu)
# Remove-Item -Recurse -Force node_modules
# npm install

# Rebuild
npm run dev
```

---

## Penjelasan Error

### Apa itu Webpack Chunks?
Next.js memecah JavaScript code menjadi file-file kecil (chunks) untuk optimasi loading:
- `_app-[hash].js` = Main app wrapper
- `42-[hash].js` = Shared dependencies chunk
- `items-[hash].js` = Items page specific code
- `_buildManifest.js` = Mapping file chunks
- `_ssgManifest.js` = Static site generation manifest

### Hash Code (`-5ae6eae2a985ba92`)
- Setiap build menghasilkan hash unik
- Browser cache old hash, tapi server punya new hash
- Browser request old file → Server: "404 Not Found"

---

## Cara Mencegah Error Ini

### 1. **Restart Dev Server Setelah Major Changes**
```bash
# Stop: Ctrl+C
# Start: npm run dev
```

### 2. **Jangan Mix Development & Production Build**
```bash
# SALAH - Jangan lakukan ini:
npm run build    # Production build
npm run dev      # Dev server (akan confuse)

# BENAR - Pilih salah satu:
npm run dev      # Development
# ATAU
npm run build && npm start  # Production
```

### 3. **Clear Cache Saat Switch Mode**
```bash
# Sebelum switch dari production ke development:
rm -rf .next
npm run dev

# Sebelum switch dari development ke production:
rm -rf .next
npm run build
npm start
```

### 4. **Use Incognito/Private Window untuk Testing**
- Tidak ada cache
- Fresh start setiap kali
- Mudah verify fix

---

## Verification

Setelah fix, verify dengan:

1. **Open browser console** (F12)
2. **Clear semua error** (klik icon trash)
3. **Refresh halaman** (F5)
4. **Check console** - Seharusnya tidak ada error 404 untuk .js files

Expected console:
```
✅ No errors
✅ Network tab: All .js files status 200 OK
✅ Page loads normally
```

---

## Development vs Production

### Development Mode (`npm run dev`)
- Fast refresh enabled
- Unoptimized bundles
- Hot module replacement
- File watcher active
- **Untuk coding/development**

### Production Mode (`npm run build && npm start`)
- Optimized bundles
- Minified code
- No hot reload
- Static generation
- **Untuk testing production atau deploy**

---

## Troubleshooting Lanjutan

### Error Persists Setelah Clean?

**Check 1: Port Conflict**
```powershell
# Kill process di port 3000
netstat -ano | findstr :3000
# Note PID (contoh: 19132)
taskkill /F /PID 19132

# Start dev server lagi
npm run dev
```

**Check 2: Node Modules Issue**
```bash
# Full reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Check 3: Next.js Version**
```bash
# Check version
npm list next

# Update Next.js (optional)
npm install next@latest
```

**Check 4: Windows Defender/Antivirus**
- Add `D:\nextjs\ml` to exclusions
- `.next` folder kadang diblokir oleh antivirus

---

## Quick Commands Cheat Sheet

```bash
# Clean restart
rm -rf .next && npm run dev

# Full clean
rm -rf .next node_modules/.cache && npm run dev

# Nuclear option (complete reset)
rm -rf .next node_modules package-lock.json && npm install && npm run dev
```

---

## Status Check

Run this untuk verify everything is OK:

```bash
cd D:\nextjs\ml
ls .next/static/chunks    # Should show webpack chunks
npm run dev               # Should start without errors
```

Browser should show:
- ✅ No 404 errors in console
- ✅ Page loads correctly
- ✅ Hot reload works (edit file, auto refresh)

---

## Masih Ada Masalah?

Share info berikut:
1. **Output `npm run dev`** (terminal logs)
2. **Browser console screenshot** (full errors)
3. **Next.js version**: Run `npm list next`
4. **Node version**: Run `node -v`

Saya akan bantu debug lebih lanjut!
