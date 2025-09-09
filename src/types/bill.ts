export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  assignedTo?: string[]; // Array of User IDs who will share this item
  isShared?: boolean; // Whether this item is shared among all participants
}

export interface OCRProduct {
  name: string;
  quantity: number;
  price: number;
  confidence?: number; // OCR confidence score
  isValidated?: boolean; // Mark untuk validasi manual
  isMarked?: boolean; // Mark untuk data yang sudah dicek
  validationNotes?: string; // Catatan validasi
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }; // Text bounding box coordinates
}

export interface OCRTextBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isProduct?: boolean;
  productIndex?: number;
}

export interface OCRResult {
  rawText: string;
  products: OCRProduct[];
  totalAmount?: number;
  confidence: number;
  isFullyValidated?: boolean; // Status validasi keseluruhan
  validationSummary?: {
    totalProducts: number;
    validatedProducts: number;
    markedProducts: number;
    needsReview: number;
  };
  textBlocks?: OCRTextBlock[]; // All detected text blocks with coordinates
  imageDimensions?: {
    width: number;
    height: number;
  }; // Original image dimensions for scaling
}

export interface OCRValidationStatus {
  isValid: boolean;
  isMarked: boolean;
  notes?: string;
  validatedAt?: Date;
  validatedBy?: string; // User ID
}

export interface OCRValidationResult {
  productId: string; // Index atau ID produk
  status: OCRValidationStatus;
  originalData: OCRProduct;
  correctedData?: Partial<OCRProduct>;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // User ID
  participants: string[]; // Array of User IDs
  category?: string;
  date: Date;
  billId: string;
  menuItems?: MenuItem[]; // Array of menu items for this expense
  location?: string; // Restaurant or place name
  taxRate?: number; // Tax rate as percentage (e.g., 10 for 10%)
  taxAmount?: number; // Calculated tax amount
  subtotal?: number; // Amount before tax
}

export interface Subsidy {
  id: string;
  description: string;
  amount: number;
  distributedBy: string; // User ID who distributed the subsidy
  participants: string[]; // Array of User IDs who receive the subsidy
  date: Date;
  billId: string;
}

export interface Bill {
  id: string;
  title: string;
  description?: string;
  totalAmount: number;
  participants: User[];
  expenses: Expense[];
  subsidies: Subsidy[]; // Array of subsidies
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface BillSummary {
  billId: string;
  totalAmount: number;
  participantBalances: ParticipantBalance[];
  expenses: Expense[];
  subsidies: Subsidy[];
  totalSubsidyAmount: number;
}

export interface ParticipantBalance {
  userId: string;
  userName: string;
  totalPaid: number;
  totalOwed: number;
  balance: number; // positive = owed money, negative = should receive money
  subtotal: number; // Amount before tax
  taxAmount: number; // Tax amount for this participant
  totalWithTax: number; // Total amount including tax
  totalSubsidyReceived: number; // Total subsidy received by this participant
  finalBalance: number; // Balance after subsidy (balance - totalSubsidyReceived)
}

export interface SplitCalculation {
  from: string; // User ID who should pay
  to: string; // User ID who should receive
  amount: number;
}

export interface UserItemCalculation {
  userId: string;
  userName: string;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    sharePercentage: number; // Percentage of this item assigned to this user
  }[];
  subtotal: number;
  taxAmount: number;
  totalWithTax: number;
}

// Re-export all types as a single object for easier importing
export const BillTypes = {
  // Type references for runtime checking
  User: 'User' as const,
  Expense: 'Expense' as const,
  Bill: 'Bill' as const,
  BillSummary: 'BillSummary' as const,
  ParticipantBalance: 'ParticipantBalance' as const,
  SplitCalculation: 'SplitCalculation' as const,
  OCRProduct: 'OCRProduct' as const,
  OCRResult: 'OCRResult' as const,
  Subsidy: 'Subsidy' as const,
} as const;

// Default export with all types
export default BillTypes;

// Alternative export patterns for different use cases
export type BillTypeKeys = keyof typeof BillTypes;

// Utility type for creating new instances
export type CreateBill = Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateUser = Omit<User, 'id'>;
export type CreateExpense = Omit<Expense, 'id' | 'date'>;
export type CreateSubsidy = Omit<Subsidy, 'id' | 'date'>;

// Type guards for runtime type checking
export const isUser = (obj: any): obj is User => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
};

export const isExpense = (obj: any): obj is Expense => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.description === 'string' && 
    typeof obj.amount === 'number' &&
    typeof obj.paidBy === 'string' &&
    Array.isArray(obj.participants);
};

export const isBill = (obj: any): obj is Bill => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.title === 'string' && 
    typeof obj.totalAmount === 'number' &&
    Array.isArray(obj.participants) &&
    Array.isArray(obj.expenses) &&
    Array.isArray(obj.subsidies);
};

export const isSubsidy = (obj: any): obj is Subsidy => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.description === 'string' && 
    typeof obj.amount === 'number' &&
    typeof obj.distributedBy === 'string' &&
    Array.isArray(obj.participants) &&
    typeof obj.billId === 'string';
};

// Namespace export for better organization
export namespace BillTypes {
  export type User = import('./bill').User;
  export type Expense = import('./bill').Expense;
  export type Bill = import('./bill').Bill;
  export type BillSummary = import('./bill').BillSummary;
  export type ParticipantBalance = import('./bill').ParticipantBalance;
  export type SplitCalculation = import('./bill').SplitCalculation;
  export type OCRProduct = import('./bill').OCRProduct;
  export type OCRResult = import('./bill').OCRResult;
  export type Subsidy = import('./bill').Subsidy;
  export type CreateBill = import('./bill').CreateBill;
  export type CreateUser = import('./bill').CreateUser;
  export type CreateExpense = import('./bill').CreateExpense;
  export type CreateSubsidy = import('./bill').CreateSubsidy;
  export type BillTypeKeys = import('./bill').BillTypeKeys;
}

// Barrel export - export everything from this module
export * from './bill';
