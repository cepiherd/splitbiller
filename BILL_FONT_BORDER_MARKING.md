# Bill Font Training dengan Border Marking

## Overview
Fitur visual border marking untuk memudahkan identifikasi dan seleksi area yang perlu diproses dalam Bill Font Training.

## Fitur Utama

### **1. Visual Border Marking**
- **Click and Drag**: Buat area baru dengan mengklik dan menyeret mouse
- **Color Coding**: Setiap jenis area memiliki warna yang berbeda
- **Real-time Preview**: Lihat area yang sedang dibuat secara real-time
- **Interactive Selection**: Klik pada area untuk memilih dan mengedit

### **2. Area Types dengan Color Coding**
| Type | Color | Description |
|------|-------|-------------|
| **Product** | 🟢 Green | Area yang berisi nama produk |
| **Price** | 🟠 Orange | Area yang berisi harga |
| **Quantity** | 🟣 Purple | Area yang berisi kuantitas |
| **Total** | 🔴 Red | Area yang berisi total |
| **Header** | ⚫ Gray | Area header (nama toko, dll) |
| **Footer** | ⚫ Gray | Area footer (terima kasih, dll) |

### **3. Processing Modes**
- **Auto Mode**: Generate border secara otomatis dari hasil OCR
- **Guided Mode**: Auto + manual editing
- **Manual Mode**: Buat border sendiri dari awal

## Komponen yang Dibuat

### **1. OCRBorderOverlay.tsx**
```typescript
interface BorderArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  type: 'product' | 'price' | 'quantity' | 'total' | 'header' | 'footer';
  confidence?: number;
  isSelected: boolean;
}
```

**Fitur:**
- Canvas-based drawing
- Mouse event handling
- Area selection and editing
- Real-time visual feedback
- Color-coded borders

### **2. BillFontTrainingWithBorders.tsx**
```typescript
interface OCRResult {
  products: Array<{
    name: string;
    quantity: number;
    price: number;
    confidence: number;
    isValidated: boolean;
    isMarked: boolean;
    validationNotes?: string;
  }>;
  totalAmount: number;
  confidence: number;
  processingTime: number;
}
```

**Fitur:**
- File upload dan preview
- Processing mode selection
- Training mode toggle
- OCR result display
- Area validation
- Export training data

### **3. InvoiceUpload.tsx (Updated)**
**Fitur:**
- Tab navigation (Standard OCR, Bill Font Training, Bill Font with Borders)
- Conditional rendering
- Seamless integration

## Cara Menggunakan

### **Step 1: Pilih Mode**
1. Buka aplikasi
2. Pilih tab "Bill Font with Borders"
3. Pilih processing mode:
   - **Auto**: Generate border otomatis
   - **Guided**: Auto + manual editing
   - **Manual**: Buat border sendiri

### **Step 2: Upload Gambar**
1. Klik "Select Image"
2. Pilih gambar invoice
3. Gambar akan ditampilkan dengan canvas overlay

### **Step 3: Training Mode (Optional)**
1. Enable "Training Mode"
2. Click and drag untuk membuat area baru
3. Pilih jenis area (Product, Price, Quantity, dll)
4. Beri label yang sesuai

### **Step 4: Process OCR**
1. Klik "Process with Bill Font Training"
2. Sistem akan:
   - Generate border otomatis (jika auto/guided mode)
   - Extract produk dengan Bill Font Training
   - Tampilkan hasil dengan confidence score

### **Step 5: Validasi dan Edit**
1. Review hasil OCR
2. Klik area untuk memilih
3. Edit label atau jenis area
4. Validasi atau reject area
5. Export training data

## Visual Interface

### **Border Overlay**
```
┌─────────────────────────────────────┐
│  🟢 Product: ES TEKLEK (95%)       │
│  ┌─────────────────────────────────┐ │
│  │                                 │ │
│  │        ES TEKLEK                │ │
│  │        1 x 6,364                │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                     │
│  🟠 Price: 6,364 (90%)             │
│  ┌─────────────────────────────────┐ │
│  │                                 │ │
│  │           6,364                 │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Area Management Panel**
```
┌─────────────────────────────────────┐
│ Marked Areas (2)                    │
├─────────────────────────────────────┤
│ 🟢 ES TEKLEK                        │
│    Product • 200×40px • 95% conf   │
│    [Product ▼] [Label: ES TEKLEK] [×]│
├─────────────────────────────────────┤
│ 🟠 6,364                            │
│    Price • 100×30px • 90% conf     │
│    [Price ▼] [Label: 6,364] [×]    │
└─────────────────────────────────────┘
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + D` | Enable/Disable Training Mode |
| `Delete` | Delete selected area |
| `Escape` | Cancel current drawing |
| `Ctrl + S` | Save training data |
| `Ctrl + Z` | Undo last action |

## Export Training Data

### **Format JSON**
```json
{
  "imageUrl": "blob:...",
  "markedAreas": [
    {
      "id": "product_0",
      "x": 50,
      "y": 100,
      "width": 200,
      "height": 40,
      "label": "ES TEKLEK",
      "type": "product",
      "confidence": 0.95,
      "isSelected": false
    }
  ],
  "ocrResult": {
    "products": [...],
    "totalAmount": 6364,
    "confidence": 0.95,
    "processingTime": 1200
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Benefits

### **1. Visual Feedback**
- ✅ Mudah mengidentifikasi area yang perlu diproses
- ✅ Color coding untuk membedakan jenis area
- ✅ Real-time preview saat membuat area

### **2. User Control**
- ✅ Manual editing untuk fine-tuning
- ✅ Area validation dan rejection
- ✅ Export training data untuk analisis

### **3. Training Enhancement**
- ✅ Visual confirmation untuk training data
- ✅ Confidence scoring untuk setiap area
- ✅ Easy correction dan improvement

### **4. Workflow Integration**
- ✅ Seamless integration dengan existing OCR
- ✅ Tab-based navigation
- ✅ Consistent UI/UX

## Technical Implementation

### **Canvas Drawing**
```typescript
const drawArea = (ctx: CanvasRenderingContext2D, area: BorderArea) => {
  // Set border color based on type
  let borderColor = getColorByType(area.type);
  
  // Draw border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = area.isSelected ? 3 : 2;
  ctx.strokeRect(area.x, area.y, area.width, area.height);
  
  // Draw label
  drawLabel(ctx, area);
};
```

### **Mouse Event Handling**
```typescript
const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!isTrainingMode) return;
  
  const { x, y } = getMousePosition(e);
  setIsDrawing(true);
  setStartPoint({ x, y });
};
```

### **Area Management**
```typescript
const updateAreaType = (areaId: string, type: BorderArea['type']) => {
  const updatedAreas = areas.map(area => 
    area.id === areaId ? { ...area, type } : area
  );
  setAreas(updatedAreas);
  onAreasChange(updatedAreas);
};
```

## Conclusion

Bill Font Training dengan Border Marking menyediakan:

- ✅ **Visual Interface** yang intuitif untuk identifikasi area
- ✅ **Interactive Editing** untuk fine-tuning hasil OCR
- ✅ **Color Coding** untuk membedakan jenis area
- ✅ **Training Data Export** untuk analisis dan improvement
- ✅ **Seamless Integration** dengan existing OCR workflow

Dengan fitur ini, Anda dapat dengan mudah mengidentifikasi dan memilih area yang perlu diproses dalam Bill Font Training! 🎯
