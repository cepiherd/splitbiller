import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bill, User, Expense } from '../types/bill';
import { BillService } from '../services/billService';

interface BillState {
  // State
  bills: Bill[];
  currentBill: Bill | null;
  users: User[];
  activeBillId: string | null; // Track active bill for single bill mode
  
  // Actions
  createBill: (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBill: (billId: string, updates: Partial<Bill>) => void;
  deleteBill: (billId: string) => void;
  setCurrentBill: (billId: string | null) => void;
  setActiveBill: (billId: string | null) => void; // New method for single bill mode
  
  addUser: (user: Omit<User, 'id'>) => string;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => string;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
  
  // Computed values
  getBillSummary: (billId: string) => any;
  getSettlements: (billId: string) => any;
}

export const useBillStore = create<BillState>()(
  persist(
    (set, get) => ({
      // Initial state
      bills: [],
      currentBill: null,
      users: [],
      activeBillId: null,

      // Bill actions
      createBill: (billData) => {
        const newBill: Bill = {
          ...billData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          bills: [...state.bills, newBill],
          currentBill: newBill,
          activeBillId: newBill.id, // Set as active bill in single bill mode
        }));
        
        return newBill.id;
      },

      updateBill: (billId, updates) => {
        set((state) => ({
          bills: state.bills.map((bill) =>
            bill.id === billId
              ? { ...bill, ...updates, updatedAt: new Date() }
              : bill
          ),
          currentBill: state.currentBill?.id === billId 
            ? { ...state.currentBill, ...updates, updatedAt: new Date() }
            : state.currentBill,
        }));
      },

      deleteBill: (billId) => {
        set((state) => ({
          bills: state.bills.filter((bill) => bill.id !== billId),
          currentBill: state.currentBill?.id === billId ? null : state.currentBill,
        }));
      },

      setCurrentBill: (billId) => {
        const bill = get().bills.find((b) => b.id === billId);
        set({ currentBill: bill || null });
      },

      setActiveBill: (billId) => {
        const bill = get().bills.find((b) => b.id === billId);
        set({ 
          activeBillId: billId,
          currentBill: bill || null 
        });
      },

      // User actions
      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: crypto.randomUUID(),
        };
        
        set((state) => ({
          users: [...state.users, newUser],
        }));
        
        return newUser.id;
      },

      updateUser: (userId, updates) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === userId ? { ...user, ...updates } : user
          ),
        }));
      },

      deleteUser: (userId) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== userId),
        }));
      },

      // Expense actions
      addExpense: (expenseData) => {
        const newExpense: Expense = {
          ...expenseData,
          id: crypto.randomUUID(),
          date: new Date(),
        };
        
        set((state) => {
          const updatedBills = state.bills.map((bill) =>
            bill.id === newExpense.billId
              ? {
                  ...bill,
                  expenses: [...bill.expenses, newExpense],
                  totalAmount: BillService.calculateTotalAmount([...bill.expenses, newExpense]),
                  updatedAt: new Date(),
                }
              : bill
          );
          
          return {
            bills: updatedBills,
            currentBill: state.currentBill?.id === newExpense.billId
              ? updatedBills.find((b) => b.id === newExpense.billId) || null
              : state.currentBill,
          };
        });
        
        return newExpense.id;
      },

      updateExpense: (expenseId, updates) => {
        set((state) => {
          const updatedBills = state.bills.map((bill) => {
            const updatedExpenses = bill.expenses.map((expense) =>
              expense.id === expenseId ? { ...expense, ...updates } : expense
            );
            
            return {
              ...bill,
              expenses: updatedExpenses,
              totalAmount: BillService.calculateTotalAmount(updatedExpenses),
              updatedAt: new Date(),
            };
          });
          
          return {
            bills: updatedBills,
            currentBill: state.currentBill
              ? updatedBills.find((b) => b.id === state.currentBill?.id) || null
              : null,
          };
        });
      },

      deleteExpense: (expenseId) => {
        set((state) => {
          const updatedBills = state.bills.map((bill) => {
            const updatedExpenses = bill.expenses.filter((expense) => expense.id !== expenseId);
            
            return {
              ...bill,
              expenses: updatedExpenses,
              totalAmount: BillService.calculateTotalAmount(updatedExpenses),
              updatedAt: new Date(),
            };
          });
          
          return {
            bills: updatedBills,
            currentBill: state.currentBill
              ? updatedBills.find((b) => b.id === state.currentBill?.id) || null
              : null,
          };
        });
      },

      // Computed values
      getBillSummary: (billId) => {
        const bill = get().bills.find((b) => b.id === billId);
        if (!bill) return null;
        return BillService.generateBillSummary(bill);
      },

      getSettlements: (billId) => {
        const bill = get().bills.find((b) => b.id === billId);
        if (!bill) return [];
        const summary = BillService.generateBillSummary(bill);
        return BillService.calculateSettlements(summary.participantBalances);
      },
    }),
    {
      name: 'splitbiller-storage',
      partialize: (state) => ({
        bills: state.bills,
        users: state.users,
        activeBillId: state.activeBillId,
        currentBill: state.currentBill,
      }),
    }
  )
);
