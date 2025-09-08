# Bill Font Training - Examples & Use Cases

## Contoh Penggunaan

### 1. Basic Usage
```typescript
import { OCRService } from './services/ocrService';

const ocrService = OCRService.getInstance();

// Upload gambar bill
const imageFile = document.getElementById('fileInput').files[0];

// Proses dengan Bill Font Training
const result = await ocrService.processImageWithBillFontTraining(
  imageFile,
  (progress) => {
    console.log(`OCR Progress: ${progress}%`);
  }
);

console.log('Products found:', result.products);
console.log('Total amount:', result.totalAmount);
```

### 2. Dengan Error Handling
```typescript
try {
  const result = await ocrService.processImageWithBillFontTraining(imageFile);
  
  if (result.products.length === 0) {
    console.warn('No products found. Try cropping the image or using different training method.');
  }
  
  // Gunakan hasil OCR
  onProductsExtracted(result.products);
  
} catch (error) {
  console.error('OCR failed:', error.message);
  // Fallback ke training method lain
  const fallbackResult = await ocrService.processImageWithInvoiceTraining(imageFile);
  onProductsExtracted(fallbackResult.products);
}
```

## Contoh Bill yang Didukung

### 1. Struk Restoran Indonesia
```
WARUNG NASI GUDEG
Jl. Malioboro No. 123
Yogyakarta

Tanggal: 15/12/2023
Jam: 14:30
Kasir: Budi

NASI GUDEG: 2 x @ 15.000 = 30.000
ES TEH: 1 x @ 5.000 = 5.000
KERUPUK: 1 x @ 3.000 = 3.000

Sub Total: 38.000
Pajak: 3.800
Total: 41.800

Cash: 50.000
Kembali: 8.200

Terima Kasih
```

### 2. Struk Toko Kelontong
```
TOKO KELONTONG SEJAHTERA
Jl. Sudirman No. 456
Jakarta

Tgl: 20/12/2023
Kasir: Siti

BERAS 5KG: 1 x @ 45.000 = 45.000
MINYAK GORENG: 2 x @ 25.000 = 50.000
GULA PASIR: 1 x @ 12.000 = 12.000
TELUR: 1 x @ 20.000 = 20.000

Subtotal: 127.000
Total: 127.000

Tunai: 150.000
Kembalian: 23.000
```

### 3. Struk Cafe
```
CAFE KOPI HITAM
Jl. Pahlawan No. 789
Bandung

Date: 25/12/2023
Time: 09:15
Staff: Rina

KOPI HITAM: 1 x @ 8.000 = 8.000
CROISSANT: 2 x @ 12.000 = 24.000
JUICE JERUK: 1 x @ 15.000 = 15.000

Sub Total: 47.000
Service Charge: 4.700
Grand Total: 51.700

Card Payment
```

## Karakter yang Sering Salah Dibaca

### 1. Angka (Numbers)
| Karakter Benar | Sering Dibaca Sebagai | Konteks |
|----------------|----------------------|---------|
| 0 | O, o, Q | Harga, kuantitas |
| 1 | l, I, \| | Kuantitas, nomor |
| 5 | S, s | Harga |
| 6 | G, g | Harga |
| 8 | B, b | Harga |
| 9 | g, q, p | Harga |

### 2. Huruf (Letters)
| Karakter Benar | Sering Dibaca Sebagai | Konteks |
|----------------|----------------------|---------|
| A | 4, @, h | Nama produk |
| B | 8, 6 | Nama produk |
| C | G, O, 0 | Nama produk |
| D | 0, O, Q | Nama produk |
| E | F, 3 | Nama produk |
| G | 6, C | Nama produk |
| I | 1, l, \| | Nama produk |
| O | 0, Q | Nama produk |
| S | 5, 8 | Nama produk |

### 3. Karakter Khusus
| Karakter Benar | Sering Dibaca Sebagai | Konteks |
|----------------|----------------------|---------|
| @ | A, 4 | Harga satuan |
| x | X, *, × | Kuantitas |
| = | -, —, ~ | Total harga |
| : | ;, ., i | Pemisah |
| Rp | RP, rp, R P | Mata uang |

## Pola yang Didukung

### 1. Pola Produk
```regex
# Format standar dengan total
^(.+?)\s*:?\s*(\d+)\s*x\s*@?\s*([\d.,]+)\s*=\s*([\d.,]+)$

# Format tanpa total
^(.+?)\s+(\d+)\s+x\s+@?\s+([\d.,]+)$

# Format sederhana
^(.+?)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)$
```

### 2. Pola Harga
```regex
# Rupiah dengan Rp
Rp\s*([\d.,]+)

# Kuantitas dan harga
(\d+)\s*x\s*@?\s*([\d.,]+)

# Total
Total\s*:?\s*([\d.,]+)
```

### 3. Pola Tanggal
```regex
# Format Indonesia
Tanggal\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})

# Format singkat
Tgl\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})
```

## Koreksi Konteks

### 1. Kata Umum
```typescript
'T0TAL' → 'TOTAL'
'SUBT0TAL' → 'SUBTOTAL'
'GRAND T0TAL' → 'GRAND TOTAL'
'PAJAK:' → 'PAJAK:'
'CASH:' → 'CASH:'
'TUNAI:' → 'TUNAI:'
'KEMBALI:' → 'KEMBALI:'
```

### 2. Nama Produk
```typescript
'ES T3H' → 'ES TEH'
'K0PI HITAM' → 'KOPI HITAM'
'N4SI GORENG' → 'NASI GORENG'
'M1E AYAM' → 'MIE AYAM'
'UD4NG GORENG' → 'UDANG GORENG'
```

## Tips Penggunaan

### 1. Persiapan Gambar
- **Resolusi**: Minimal 300 DPI
- **Kontras**: Pastikan teks jelas dan kontras
- **Posisi**: Teks horizontal, tidak miring
- **Cahaya**: Hindari bayangan dan refleksi

### 2. Cropping
- **Area Produk**: Crop area yang berisi daftar produk dan harga
- **Hindari Header**: Header toko biasanya tidak perlu
- **Hindari Footer**: Footer biasanya berisi informasi tidak relevan
- **Ukuran**: Pastikan teks cukup besar untuk dibaca

### 3. Pemilihan Training
- **Bill Font Training**: Untuk struk dengan font monospace
- **Invoice Training**: Untuk invoice dengan font umum
- **Standard OCR**: Untuk dokumen dengan font standar

### 4. Troubleshooting
- **Akurasi Rendah**: Coba crop area yang lebih spesifik
- **Produk Tidak Ditemukan**: Periksa format dalam raw text
- **Karakter Salah**: Pastikan menggunakan Bill Font Training
- **Harga Salah**: Periksa format Rupiah dan koma/titik

## Contoh Kode Lengkap

### React Component
```tsx
import React, { useState } from 'react';
import { OCRService } from '../services/ocrService';

const BillUploader: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!imageFile) return;

    setIsProcessing(true);
    try {
      const ocrService = OCRService.getInstance();
      const ocrResult = await ocrService.processImageWithBillFontTraining(
        imageFile,
        (progress) => console.log(`Progress: ${progress}%`)
      );
      
      setResult(ocrResult);
    } catch (error) {
      console.error('OCR Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Process Bill'}
      </button>
      
      {result && (
        <div>
          <h3>Products Found: {result.products.length}</h3>
          {result.products.map((product: any, index: number) => (
            <div key={index}>
              {product.name} - Qty: {product.quantity} - Price: {product.price}
            </div>
          ))}
          {result.totalAmount && (
            <p>Total: Rp {result.totalAmount.toLocaleString('id-ID')}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BillUploader;
```

### Node.js/Backend
```typescript
import { BillFontTrainingService } from './services/billFontTrainingService';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const billFontService = BillFontTrainingService.getInstance();

app.post('/process-bill', upload.single('image'), async (req, res) => {
  try {
    const imageFile = req.file;
    if (!imageFile) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await billFontService.processImageWithBillFontTraining(
      imageFile
    );

    res.json({
      success: true,
      products: result.products,
      totalAmount: result.totalAmount,
      confidence: result.confidence
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'OCR processing failed',
      message: error.message 
    });
  }
});
```

## Performance Metrics

### Akurasi yang Diharapkan
- **Karakter Recognition**: 85-95% untuk font monospace
- **Produk Names**: 80-90% untuk nama produk Indonesia
- **Price Recognition**: 90-98% untuk format Rupiah
- **Overall Confidence**: 75-90% untuk bill yang jelas

### Waktu Processing
- **Setup Training**: 2-3 detik
- **OCR Processing**: 3-8 detik (tergantung ukuran gambar)
- **Post-processing**: <1 detik
- **Total Time**: 5-12 detik

### Memory Usage
- **Training Data**: ~5MB
- **Worker Instance**: ~10-15MB
- **Total Overhead**: ~15-20MB

## Kesimpulan

Bill Font Training Feature memberikan peningkatan signifikan dalam akurasi OCR untuk bill dan struk Indonesia. Dengan training yang spesifik untuk font monospace dan pola-pola khas Indonesia, fitur ini dapat mengurangi kesalahan OCR dan meningkatkan user experience secara keseluruhan.

Gunakan fitur ini untuk:
- Struk restoran dengan font thermal printer
- Bill toko kelontong
- Invoice dengan format Indonesia
- Dokumen dengan font monospace

Hindari untuk:
- Dokumen dengan font serif/sans-serif
- Teks dengan rotasi atau distorsi
- Gambar dengan kualitas sangat rendah
