# Arsitektur SplitBiller

## 🏗️ Clean Architecture Overview

SplitBiller mengikuti prinsip Clean Architecture dengan pemisahan yang jelas antara domain, application, dan presentation layers.

## 📁 Struktur Layer

### 1. Domain Layer (`types/`)
**Tanggung Jawab**: Business entities dan domain rules

```typescript
// types/bill.ts
- User: Entity untuk peserta
- Bill: Entity untuk bill utama
- Expense: Entity untuk pengeluaran
- BillSummary: Value object untuk summary
- ParticipantBalance: Value object untuk balance
- SplitCalculation: Value object untuk settlement
```

### 2. Service Layer (`services/`)
**Tanggung Jawab**: Business logic dan calculations

```typescript
// services/billService.ts
- calculateTotalAmount(): Menghitung total pengeluaran
- calculateTotalPaidByUser(): Menghitung total yang dibayar user
- calculateTotalOwedByUser(): Menghitung total hutang user
- calculateParticipantBalances(): Menghitung balance semua peserta
- generateBillSummary(): Generate summary lengkap
- calculateSettlements(): Menghitung transaksi yang diperlukan
- validateBill(): Validasi data bill
- formatCurrency(): Format currency untuk display
```

### 3. Data Layer (`stores/`)
**Tanggung Jawab**: State management dan persistence

```typescript
// stores/billStore.ts
- State: bills[], currentBill, users[]
- Actions: CRUD operations untuk bills, users, expenses
- Computed: getBillSummary(), getSettlements()
- Persistence: localStorage dengan Zustand persist
```

### 4. Presentation Layer (`components/`, `pages/`)
**Tanggung Jawab**: UI components dan user interactions

```typescript
// components/
- BillForm: Form untuk membuat bill baru
- ExpenseForm: Form untuk menambah pengeluaran
- BillSummary: Tampilan summary dan balance
- ui/: shadcn/ui components (Button, Input, Card, dll)

// pages/
- HomePage: Halaman utama dengan navigation
```

## 🔄 Data Flow

```
User Input → Components → Store Actions → Service Layer → Domain Models
     ↑                                                           ↓
UI Update ← Store State ← Computed Values ← Business Logic ← Data Processing
```

## 🧪 Testing Strategy

### Unit Tests
- **Service Layer**: Test business logic dan calculations
- **Utility Functions**: Test helper functions
- **Store Actions**: Test state management logic

### Component Tests
- **User Interactions**: Test form submissions, button clicks
- **Rendering**: Test component rendering dengan props
- **State Updates**: Test UI updates berdasarkan state changes

### Integration Tests
- **Store + Service**: Test integration antara store dan service
- **Component + Store**: Test component dengan real store state

## 📊 State Management

### Zustand Store Structure
```typescript
interface BillState {
  // State
  bills: Bill[]
  currentBill: Bill | null
  users: User[]
  
  // Actions
  createBill()
  updateBill()
  deleteBill()
  addUser()
  addExpense()
  
  // Computed
  getBillSummary()
  getSettlements()
}
```

### Persistence
- Data tersimpan di localStorage
- Hanya bills dan users yang di-persist
- currentBill tidak di-persist (session only)

## 🎨 UI Architecture

### Design System
- **shadcn/ui**: Base components
- **Tailwind CSS**: Styling system
- **Radix UI**: Accessible primitives
- **Lucide React**: Icons

### Component Hierarchy
```
HomePage
├── Navigation (View Mode Toggle)
├── Bill Selection (if bills exist)
├── Main Content
│   ├── BillForm (Create Mode)
│   ├── ExpenseForm (Expense Mode)
│   └── BillSummary (Summary Mode)
└── Quick Stats
```

## 🔧 Development Patterns

### 1. Service Pattern
- Pure functions untuk business logic
- No side effects
- Easy to test
- Reusable across components

### 2. Store Pattern
- Centralized state management
- Actions untuk mutations
- Computed values untuk derived state
- Persistence middleware

### 3. Component Pattern
- Functional components dengan hooks
- Props interface yang jelas
- Separation of concerns
- Reusable dan composable

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Layout Strategy
- Mobile-first approach
- Flexible grid system
- Touch-friendly interactions
- Optimized for mobile usage

## 🚀 Performance Optimizations

### 1. Bundle Optimization
- Tree shaking
- Code splitting
- Lazy loading
- Minimal dependencies

### 2. Runtime Performance
- Efficient state updates
- Minimal re-renders
- Memoization where needed
- Optimized calculations

### 3. User Experience
- Fast initial load
- Smooth interactions
- Responsive feedback
- Error handling

## 🔒 Error Handling

### 1. Validation
- Form validation
- Data type checking
- Business rule validation
- User-friendly error messages

### 2. Error Boundaries
- Component error boundaries
- Fallback UI
- Error logging
- Graceful degradation

## 📈 Scalability Considerations

### 1. Code Organization
- Feature-based structure
- Clear separation of concerns
- Consistent patterns
- Easy to extend

### 2. Performance
- Efficient algorithms
- Optimized data structures
- Lazy loading
- Caching strategies

### 3. Maintainability
- Clear naming conventions
- Comprehensive documentation
- Unit tests
- Type safety

## 🛠️ Development Workflow

### 1. Feature Development
1. Define types di domain layer
2. Implement business logic di service layer
3. Add store actions di data layer
4. Create UI components di presentation layer
5. Write tests untuk semua layers

### 2. Testing Strategy
1. Unit tests untuk service layer
2. Component tests untuk UI
3. Integration tests untuk store
4. E2E tests untuk user flows

### 3. Code Quality
1. ESLint untuk linting
2. TypeScript untuk type safety
3. Prettier untuk formatting
4. Husky untuk pre-commit hooks

## 📚 Dependencies

### Core Dependencies
- React 19: UI library
- TypeScript: Type safety
- Vite: Build tool
- Zustand: State management

### UI Dependencies
- shadcn/ui: Component library
- Tailwind CSS: Styling
- Radix UI: Primitives
- Lucide React: Icons

### Development Dependencies
- Vitest: Testing framework
- Testing Library: Component testing
- ESLint: Linting
- PostCSS: CSS processing
