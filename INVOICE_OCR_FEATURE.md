# Fitur OCR Invoice - SplitBiller

## Deskripsi
Fitur ini memungkinkan pengguna untuk mengupload gambar invoice dan secara otomatis mengekstrak informasi produk (nama, quantity, dan harga) menggunakan teknologi OCR (Optical Character Recognition).

## Komponen yang Dibuat

### 1. Tipe Data Baru (`src/types/bill.ts`)
- `OCRProduct`: Interface untuk produk yang diekstrak dari OCR
- `OCRResult`: Interface untuk hasil lengkap OCR

### 2. Service OCR (`src/services/ocrService.ts`)
- `OCRService`: Class untuk memproses gambar menggunakan Tesseract.js (100% gratis)
- Method `processImage()`: Memproses file gambar dan mengembalikan hasil OCR
- Method `parseProductsFromText()`: Parsing teks OCR menjadi array produk dengan multiple patterns
- Method `extractTotalAmount()`: Mengekstrak total amount dari teks
- Method `parsePrice()`: Helper untuk parsing harga dengan berbagai format
- Method `cleanup()`: Cleanup worker untuk menghemat memory

### 3. Komponen Upload Invoice (`src/components/InvoiceUpload.tsx`)
- Interface untuk upload dan preview gambar
- Validasi file (tipe dan ukuran)
- Preview gambar yang diupload
- **Fitur Crop**: Tombol untuk crop area yang berisi item dan harga
- Proses OCR dengan loading indicator dan progress bar
- Tampilan hasil ekstraksi produk
- Opsi untuk menampilkan teks mentah OCR
- Konfirmasi untuk menggunakan produk yang diekstrak

### 4. Komponen Image Cropper (`src/components/ImageCropper.tsx`)
- Interface untuk crop gambar dengan drag & drop
- Aspect ratio 16:9 untuk area crop
- Petunjuk penggunaan crop
- Preview real-time saat crop
- Tombol reset dan konfirmasi

### 5. Integrasi dengan ExpenseForm (`src/components/ExpenseForm.tsx`)
- Tombol "Upload Invoice" di section Menu Items
- Modal untuk menampilkan komponen InvoiceUpload
- Auto-fill menu items dari hasil OCR
- Auto-fill total amount dari hasil OCR

## Cara Penggunaan

1. **Buat Bill Baru**: Buat bill dengan peserta yang akan membagi tagihan
2. **Tambah Pengeluaran**: Pilih "Tambah Pengeluaran" dari menu
3. **Upload Invoice**: 
   - Klik tombol "Upload Invoice" di section Menu Items
   - Pilih gambar invoice (JPG, PNG, GIF, maksimal 10MB)
   - **Opsional**: Klik "Crop" untuk memilih area yang berisi item dan harga
   - Klik "Proses Gambar" untuk memulai OCR
   - Review hasil ekstraksi produk
   - Klik "Gunakan Produk" untuk mengisi form
4. **Lengkapi Form**: Isi deskripsi, pilih yang membayar, dan pilih peserta
5. **Simpan**: Klik "Tambah Pengeluaran" untuk menyimpan

## Fitur OCR

### Tesseract.js (100% Gratis)
- **Client-side**: Berjalan di browser, tidak perlu server
- **Gratis**: Tidak ada biaya atau limit
- **Multi-format**: Mendukung berbagai format harga (1,234.56, 1.234,56, dll)
- **Progress tracking**: Menampilkan progress real-time
- **Memory efficient**: Auto cleanup worker

### Alternatif Lain (Berbayar)
- Google Vision API (1,000 request/bulan gratis)
- AWS Textract (1,000 halaman/bulan gratis)
- Azure Computer Vision (5,000 transaksi/bulan gratis)

### Parsing Produk
- Mendeteksi pola: `Nama Produk Qty Harga`
- Filter kata kunci yang bukan produk (subtotal, total, pajak, dll)
- Ekstrak total amount dari teks
- Menyediakan confidence score untuk setiap produk

### Validasi
- Validasi tipe file (hanya gambar)
- Validasi ukuran file (maksimal 10MB)
- Error handling untuk proses OCR

## Keunggulan

1. **Otomatis**: Mengurangi input manual untuk menu items
2. **Akurat**: OCR dengan confidence score untuk validasi
3. **Crop Image**: Fokus pada area yang berisi item dan harga untuk akurasi lebih tinggi
4. **User-friendly**: Interface yang intuitif dengan preview dan crop
5. **Fleksibel**: Dapat mengedit hasil OCR sebelum digunakan
6. **Terintegrasi**: Langsung terintegrasi dengan workflow yang ada

## Catatan Implementasi

- OCR service menggunakan Tesseract.js (100% gratis, client-side)
- Tidak perlu server atau API key
- **Fitur Crop**: Menggunakan react-image-crop untuk crop area yang relevan
- Confidence score dari Tesseract untuk validasi kualitas ekstraksi
- Error handling sudah disiapkan untuk berbagai skenario
- Progress bar untuk user experience yang lebih baik
- Auto cleanup worker untuk menghemat memory
- Crop area membantu OCR fokus pada data yang penting
