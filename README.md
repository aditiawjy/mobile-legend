# ML Helper Frontend (Next.js)

Frontend Next.js untuk aplikasi ML Helper. Terhubung ke backend PHP yang berada di direktori `php/` pada proyek yang sama dan berjalan melalui MAMP.

## Struktur

- `pages/index.js` — Halaman utama dengan input autocomplete dan detail hero.
- `next.config.js` — Rewrites proxy `/api/:path*` ke backend PHP di MAMP.
- `package.json` — Skrip dan dependencies Next.js/React.

## Menjalankan

1) Pastikan MAMP berjalan dan situs dapat diakses:
   - Default URL backend: `http://localhost:8888/ml/php/`
   - Jika port MAMP bukan 8888 (mis. 80), ubah `destination` di `next.config.js` sesuai.

2) Install dependencies dan jalankan dev server:

```bash
npm install
npm run dev
```

3) Akses frontend:
- http://localhost:3000

## Integrasi Backend

Frontend melakukan fetch ke endpoint PHP melalui proxy Next.js:
- `/api/heroes_search.php?q=...` -> `php/heroes_search.php`
- `/api/get_hero_detail.php?name=...` -> `php/get_hero_detail.php`

Tujuannya agar bebas CORS dan URL frontend tetap bersih.

## Catatan Keamanan

File `php/db.php` menyimpan kredensial database secara hardcoded. Untuk produksi:
- Gunakan environment variables dan hindari commit kredensial ke repository publik.
