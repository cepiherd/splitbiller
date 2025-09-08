# SplitBiller 💰

Aplikasi web modern untuk membagi tagihan dengan teman-teman. Dibangun dengan React, TypeScript, dan clean architecture principles.

## ✨ Fitur

- 🏗️ **Clean Architecture** - Struktur kode yang terorganisir dengan separation of concerns
- 🎨 **Modern UI** - Interface yang indah menggunakan shadcn/ui dan Tailwind CSS
- 📱 **Responsive Design** - Bekerja sempurna di desktop dan mobile
- 💾 **State Management** - Menggunakan Zustand untuk state management yang efisien
- 🧪 **Unit Testing** - Comprehensive testing dengan Vitest dan Testing Library
- 💰 **Smart Calculations** - Otomatis menghitung pembagian tagihan dan hutang
- 📊 **Real-time Summary** - Lihat balance dan transaksi yang diperlukan
- 🔄 **Persistent Storage** - Data tersimpan di localStorage

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Testing**: Vitest + Testing Library
- **Icons**: Lucide React

## 📁 Struktur Proyek

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── BillForm.tsx    # Form untuk membuat bill baru
│   ├── ExpenseForm.tsx # Form untuk menambah pengeluaran
│   └── BillSummary.tsx # Tampilan summary dan balance
├── services/           # Business logic layer
│   └── billService.ts  # Service untuk kalkulasi bill
├── stores/             # State management
│   └── billStore.ts    # Zustand store
├── types/              # TypeScript type definitions
│   └── bill.ts         # Domain models
├── pages/              # Page components
│   └── HomePage.tsx    # Halaman utama
├── lib/                # Utility functions
│   └── utils.ts        # Helper functions
└── __tests__/          # Test files
    ├── setup.ts        # Test setup
    ├── billService.test.ts
    └── BillForm.test.tsx
```

## 🛠️ Instalasi & Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd splitbiller
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Jalankan development server**
   ```bash
   npm run dev
   ```

4. **Buka browser**
   ```
   http://localhost:5173
   ```

## 🧪 Testing

```bash
# Jalankan semua tests
npm run test

# Jalankan tests dengan UI
npm run test:ui

# Jalankan tests sekali (CI mode)
npm run test:run
```

## 📦 Build untuk Production

```bash
# Build aplikasi
npm run build

# Preview build
npm run preview
```

## 🎯 Cara Penggunaan

### 1. Buat Bill Baru
- Klik "Buat Bill"
- Masukkan judul dan deskripsi (opsional)
- Tambahkan peserta dengan mengetik nama dan klik "Tambah"
- Klik "Buat Bill" untuk menyimpan

### 2. Tambah Pengeluaran
- Pilih bill yang sudah dibuat
- Klik "Tambah Pengeluaran"
- Isi deskripsi, jumlah, dan kategori
- Pilih siapa yang membayar
- Pilih peserta yang akan membagi pengeluaran
- Klik "Tambah Pengeluaran"

### 3. Lihat Summary
- Klik "Lihat Summary" untuk melihat:
  - Total pengeluaran
  - Balance setiap peserta
  - Transaksi yang diperlukan untuk melunasi hutang
  - Daftar semua pengeluaran

## 🏗️ Clean Architecture

Aplikasi ini mengikuti prinsip clean architecture:

- **Domain Layer** (`types/`): Business entities dan rules
- **Service Layer** (`services/`): Business logic dan calculations
- **Presentation Layer** (`components/`, `pages/`): UI components
- **Data Layer** (`stores/`): State management dan persistence

## 🧪 Testing Strategy

- **Unit Tests**: Service layer dan utility functions
- **Component Tests**: UI components dengan user interactions
- **Integration Tests**: Store dan service integration
- **Coverage**: Target 80%+ code coverage

## 🎨 Design System

Menggunakan shadcn/ui design system dengan:
- Consistent color palette
- Typography scale
- Spacing system
- Component variants
- Dark/light mode support

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interactions
- Optimized for mobile usage

## 🔧 Development

### Code Style
- ESLint untuk linting
- Prettier untuk formatting
- TypeScript strict mode
- Consistent naming conventions

### Git Workflow
- Feature branches
- Conventional commits
- Pull request reviews
- Automated testing

## 📈 Performance

- Lazy loading components
- Optimized bundle size
- Efficient state updates
- Minimal re-renders

## 🚀 Deployment

Aplikasi siap untuk deployment ke:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - lihat file LICENSE untuk detail.

## 🙏 Acknowledgments

- shadcn/ui untuk design system
- Radix UI untuk accessible components
- Tailwind CSS untuk styling
- Zustand untuk state management
- Vite untuk build tooling