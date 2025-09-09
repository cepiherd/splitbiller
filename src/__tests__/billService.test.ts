import { describe, it, expect } from 'vitest';
import { BillService } from '../services/billService';
import type { Bill, Expense, User } from '../types/bill';

describe('BillService', () => {
  const mockUsers: User[] = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' },
  ];

  const mockExpenses: Expense[] = [
    {
      id: '1',
      description: 'Dinner',
      amount: 150000,
      paidBy: '1',
      participants: ['1', '2', '3'],
      date: new Date(),
      billId: 'bill1',
    },
    {
      id: '2',
      description: 'Transport',
      amount: 30000,
      paidBy: '2',
      participants: ['1', '2'],
      date: new Date(),
      billId: 'bill1',
    },
  ];

  const mockBill: Bill = {
    id: 'bill1',
    title: 'Test Bill',
    totalAmount: 180000,
    participants: mockUsers,
    expenses: mockExpenses,
    subsidies: [],
    createdBy: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  describe('calculateTotalAmount', () => {
    it('should calculate total amount correctly', () => {
      const total = BillService.calculateTotalAmount(mockExpenses);
      expect(total).toBe(180000);
    });

    it('should return 0 for empty expenses', () => {
      const total = BillService.calculateTotalAmount([]);
      expect(total).toBe(0);
    });
  });

  describe('calculateTotalPaidByUser', () => {
    it('should calculate total paid by user correctly', () => {
      const totalPaid = BillService.calculateTotalPaidByUser(mockExpenses, '1');
      expect(totalPaid).toBe(150000);
    });

    it('should return 0 if user never paid', () => {
      const totalPaid = BillService.calculateTotalPaidByUser(mockExpenses, '3');
      expect(totalPaid).toBe(0);
    });
  });

  describe('calculateTotalOwedByUser', () => {
    it('should calculate total owed by user correctly', () => {
      const totalOwed = BillService.calculateTotalOwedByUser(mockExpenses, '1');
      // Alice owes: 150000/3 (dinner) + 30000/2 (transport) = 50000 + 15000 = 65000
      expect(totalOwed).toBe(65000);
    });

    it('should return 0 if user not in any expense', () => {
      const totalOwed = BillService.calculateTotalOwedByUser(mockExpenses, '4');
      expect(totalOwed).toBe(0);
    });
  });

  describe('calculateParticipantBalances', () => {
    it('should calculate participant balances correctly', () => {
      const balances = BillService.calculateParticipantBalances(mockBill);
      
      expect(balances).toHaveLength(3);
      
      // Alice: paid 150000, owes 65000, balance = 85000
      const aliceBalance = balances.find(b => b.userId === '1');
      expect(aliceBalance?.totalPaid).toBe(150000);
      expect(aliceBalance?.totalOwed).toBe(65000);
      expect(aliceBalance?.balance).toBe(85000);
    });
  });

  describe('generateBillSummary', () => {
    it('should generate bill summary correctly', () => {
      const summary = BillService.generateBillSummary(mockBill);
      
      expect(summary.billId).toBe('bill1');
      expect(summary.totalAmount).toBe(180000);
      expect(summary.participantBalances).toHaveLength(3);
      expect(summary.expenses).toHaveLength(2);
    });
  });

  describe('calculateSettlements', () => {
    it('should calculate settlements correctly', () => {
      const balances = BillService.calculateParticipantBalances(mockBill);
      const settlements = BillService.calculateSettlements(balances);
      
      expect(settlements).toBeDefined();
      expect(Array.isArray(settlements)).toBe(true);
    });
  });

  describe('validateBill', () => {
    it('should validate bill correctly', () => {
      const errors = BillService.validateBill(mockBill);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid bill', () => {
      const invalidBill = {
        title: '',
        participants: [],
        expenses: [
          {
            description: '',
            amount: -100,
            paidBy: '',
            participants: [],
          } as any,
        ],
      };
      
      const errors = BillService.validateBill(invalidBill);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Title is required');
      expect(errors).toContain('At least one participant is required');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const formatted = BillService.formatCurrency(150000);
      expect(formatted).toContain('150.000');
      expect(formatted).toContain('Rp');
    });

    it('should format currency with custom currency', () => {
      const formatted = BillService.formatCurrency(150000, 'USD');
      expect(formatted).toContain('150.000');
      expect(formatted).toContain('US$');
    });
  });
});
