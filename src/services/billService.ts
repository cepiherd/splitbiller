import type { Bill, Expense, BillSummary, ParticipantBalance, SplitCalculation, MenuItem, UserItemCalculation } from '../types/bill';

export class BillService {
  /**
   * Menghitung total amount dari semua expenses dalam bill
   */
  static calculateTotalAmount(expenses: Expense[]): number {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  /**
   * Menghitung berapa banyak setiap participant sudah membayar
   */
  static calculateTotalPaidByUser(expenses: Expense[], userId: string): number {
    return expenses
      .filter(expense => expense.paidBy === userId)
      .reduce((total, expense) => total + expense.amount, 0);
  }

  /**
   * Menghitung berapa banyak setiap participant berhutang
   */
  static calculateTotalOwedByUser(expenses: Expense[], userId: string): number {
    return expenses
      .filter(expense => expense.participants.includes(userId))
      .reduce((total, expense) => {
        if (expense.menuItems && expense.menuItems.length > 0) {
          // Calculate based on assigned menu items
          const userItemTotal = this.calculateUserItemTotal(expense.menuItems, userId, expense.participants.length);
          const taxShare = expense.taxAmount ? (userItemTotal / (expense.subtotal || expense.amount)) * expense.taxAmount : 0;
          return total + userItemTotal + taxShare;
        } else {
          // Traditional equal split
          const sharePerPerson = expense.amount / expense.participants.length;
          return total + sharePerPerson;
        }
      }, 0);
  }

  /**
   * Menghitung total item untuk user tertentu
   */
  static calculateUserItemTotal(menuItems: MenuItem[], userId: string, totalParticipants: number): number {
    return menuItems.reduce((total, item) => {
      if (item.assignedTo && item.assignedTo.length > 0) {
        // Item assigned to specific users
        if (item.assignedTo.includes(userId)) {
          return total + (item.price * item.quantity) / item.assignedTo.length;
        }
        return total;
      } else {
        // Item shared among all participants
        return total + (item.price * item.quantity) / totalParticipants;
      }
    }, 0);
  }

  /**
   * Menghitung detail per item per user
   */
  static calculateUserItemDetails(expense: Expense, userId: string): UserItemCalculation {
    const user = expense.participants.find(p => p === userId);
    if (!user) {
      throw new Error('User not found in participants');
    }

    const items = expense.menuItems?.map(item => {
      let sharePercentage = 0;
      let totalPrice = 0;

      if (item.assignedTo && item.assignedTo.length > 0) {
        if (item.assignedTo.includes(userId)) {
          sharePercentage = 100 / item.assignedTo.length;
          totalPrice = (item.price * item.quantity) / item.assignedTo.length;
        }
      } else {
        sharePercentage = 100 / expense.participants.length;
        totalPrice = (item.price * item.quantity) / expense.participants.length;
      }

      return {
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice,
        sharePercentage
      };
    }) || [];

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = expense.taxAmount ? (subtotal / (expense.subtotal || expense.amount)) * expense.taxAmount : 0;
    const totalWithTax = subtotal + taxAmount;

    return {
      userId,
      userName: user, // This should be the actual user name, but we only have ID here
      items,
      subtotal,
      taxAmount,
      totalWithTax
    };
  }

  /**
   * Menghitung balance untuk setiap participant dengan detail pajak
   */
  static calculateParticipantBalances(bill: Bill): ParticipantBalance[] {
    return bill.participants.map(participant => {
      const totalPaid = this.calculateTotalPaidByUser(bill.expenses, participant.id);
      const totalOwed = this.calculateTotalOwedByUser(bill.expenses, participant.id);
      const balance = totalPaid - totalOwed;

      // Calculate subtotal and tax for this participant
      let subtotal = 0;
      let taxAmount = 0;

      bill.expenses
        .filter(expense => expense.participants.includes(participant.id))
        .forEach(expense => {
          if (expense.menuItems && expense.menuItems.length > 0) {
            const userItemTotal = this.calculateUserItemTotal(expense.menuItems, participant.id, expense.participants.length);
            subtotal += userItemTotal;
            if (expense.taxAmount) {
              taxAmount += (userItemTotal / (expense.subtotal || expense.amount)) * expense.taxAmount;
            }
          } else {
            const sharePerPerson = expense.amount / expense.participants.length;
            subtotal += sharePerPerson;
            if (expense.taxAmount) {
              taxAmount += (sharePerPerson / expense.amount) * expense.taxAmount;
            }
          }
        });

      const totalWithTax = subtotal + taxAmount;

      return {
        userId: participant.id,
        userName: participant.name,
        totalPaid,
        totalOwed,
        balance,
        subtotal,
        taxAmount,
        totalWithTax
      };
    });
  }

  /**
   * Menghasilkan summary bill dengan balance calculations
   */
  static generateBillSummary(bill: Bill): BillSummary {
    const participantBalances = this.calculateParticipantBalances(bill);
    const totalAmount = this.calculateTotalAmount(bill.expenses);

    return {
      billId: bill.id,
      totalAmount,
      participantBalances,
      expenses: bill.expenses
    };
  }

  /**
   * Menghitung transaksi yang diperlukan untuk menyelesaikan hutang
   */
  static calculateSettlements(participantBalances: ParticipantBalance[]): SplitCalculation[] {
    const settlements: SplitCalculation[] = [];
    const balances = [...participantBalances];

    // Sort berdasarkan balance (yang berhutang paling banyak dulu)
    balances.sort((a, b) => b.balance - a.balance);

    let i = 0; // pointer untuk yang berhutang
    let j = balances.length - 1; // pointer untuk yang harus menerima

    while (i < j) {
      const debtor = balances[i];
      const creditor = balances[j];

      if (debtor.balance <= 0 || creditor.balance >= 0) {
        break;
      }

      const settlementAmount = Math.min(debtor.balance, Math.abs(creditor.balance));

      if (settlementAmount > 0.01) { // Hanya buat settlement jika amount > 1 cent
        settlements.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: Math.round(settlementAmount * 100) / 100 // Round to 2 decimal places
        });

        debtor.balance -= settlementAmount;
        creditor.balance += settlementAmount;
      }

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j--;
    }

    return settlements;
  }

  /**
   * Validasi apakah bill data valid
   */
  static validateBill(bill: Partial<Bill>): string[] {
    const errors: string[] = [];

    if (!bill.title || bill.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!bill.participants || bill.participants.length === 0) {
      errors.push('At least one participant is required');
    }

    if (bill.participants && bill.participants.length > 0) {
      const hasEmptyNames = bill.participants.some(p => !p.name || p.name.trim().length === 0);
      if (hasEmptyNames) {
        errors.push('All participants must have names');
      }
    }

    if (bill.expenses && bill.expenses.length > 0) {
      const hasInvalidExpenses = bill.expenses.some(expense => 
        !expense.description || 
        expense.description.trim().length === 0 ||
        expense.amount <= 0 ||
        !expense.paidBy ||
        !expense.participants ||
        expense.participants.length === 0
      );
      
      if (hasInvalidExpenses) {
        errors.push('All expenses must have valid description, amount, payer, and participants');
      }
    }

    return errors;
  }

  /**
   * Mendapatkan detail perhitungan per user untuk expense tertentu
   */
  static getUserItemCalculations(expense: Expense, participants: { id: string; name: string }[]): UserItemCalculation[] {
    return participants
      .filter(participant => expense.participants.includes(participant.id))
      .map(participant => {
        const calculation = this.calculateUserItemDetails(expense, participant.id);
        return {
          ...calculation,
          userName: participant.name
        };
      });
  }

  /**
   * Mendapatkan total pajak untuk bill
   */
  static calculateTotalTax(bill: Bill): number {
    return bill.expenses.reduce((total, expense) => {
      return total + (expense.taxAmount || 0);
    }, 0);
  }

  /**
   * Mendapatkan subtotal untuk bill (sebelum pajak)
   */
  static calculateSubtotal(bill: Bill): number {
    return bill.expenses.reduce((total, expense) => {
      return total + (expense.subtotal || expense.amount);
    }, 0);
  }

  /**
   * Format currency untuk display
   */
  static formatCurrency(amount: number, currency: string = 'IDR'): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
