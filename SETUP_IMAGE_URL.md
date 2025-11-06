# Setup Image URL untuk Items

## Langkah 1: Migrasi Database

Sebelum menggunakan fitur gambar, Anda perlu menambahkan kolom `image_url` ke tabel items.

**Cara menjalankan migrasi:**

1. Start development server:
   ```bash
   npm run dev
   ```

2. Buka browser dan akses:
   ```
   http://localhost:3000/api/admin/add_items_image_url
   ```
   
   (Gunakan method POST, bisa dengan Postman atau tool lain. Atau ubah endpoint untuk menerima GET jika diperlukan)

3. Response sukses:
   ```json
   {
     "message": "Column image_url added successfully",
     "success": true
   }
   ```

## Langkah 2: Tambah Gambar ke Items

Setelah migrasi, Anda bisa menambahkan URL gambar untuk setiap item:

1. Buka halaman **Edit Items**: http://localhost:3000/edit-items
2. Pilih atau ketik nama item
3. Isi field **Image URL** dengan URL gambar item (contoh: `https://example.com/item.png`)
4. Klik **Simpan Perubahan**

## Fitur Lazy Loading

Gambar akan dimuat secara lazy (hanya saat terlihat di viewport) untuk meningkatkan performa:

✅ **Intersection Observer** - Gambar dimuat 50px sebelum masuk viewport
✅ **Loading skeleton** - Animasi loading saat gambar sedang dimuat
✅ **Error handling** - Fallback ke inisial jika gambar gagal load
✅ **Native lazy loading** - Atribut `loading="lazy"` untuk browser support
✅ **Smooth transition** - Fade-in animation saat gambar selesai dimuat

## Fallback

Jika tidak ada URL gambar atau gambar gagal load, sistem akan menampilkan:
- Circle dengan gradient hijau-biru
- Inisial huruf pertama dari nama item
- Design yang konsisten dengan theme aplikasi

## Lokasi File

- **LazyImage Component**: `/components/LazyImage.js`
- **Items List**: `/pages/items.js`
- **Item Detail**: `/pages/item/[name].js`
- **Edit Items**: `/pages/edit-items.js`
- **Migration API**: `/pages/api/admin/add_items_image_url.js`

## Tips

1. Gunakan URL gambar dari CDN untuk performa optimal
2. Ukuran gambar recommended: 128x128px atau lebih besar
3. Format yang didukung: PNG, JPG, WebP, GIF
4. Pastikan URL gambar dapat diakses publik (CORS enabled)
