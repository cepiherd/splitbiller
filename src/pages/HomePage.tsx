import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BillForm } from '../components/BillForm';
import { ExpenseForm } from '../components/ExpenseForm';
import { BillSummary } from '../components/BillSummary';
import { useBillStore } from '../stores/billStore';
import { Plus, Receipt, Users } from 'lucide-react';

type ViewMode = 'create' | 'expense' | 'summary';

export const HomePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  
  const { bills, activeBillId, setActiveBill } = useBillStore();
  
  // Use activeBillId as the selected bill, fallback to first bill if available
  const selectedBillId = activeBillId || (bills.length > 0 ? bills[0].id : null);

  // Set active bill on mount if not set but bills exist
  useEffect(() => {
    if (!activeBillId && bills.length > 0) {
      setActiveBill(bills[0].id);
    }
  }, [activeBillId, bills, setActiveBill]);

  const handleBillCreated = (billId: string) => {
    setActiveBill(billId);
    setViewMode('expense');
  };

  const handleExpenseAdded = () => {
    setViewMode('summary');
  };

  const selectedBill = selectedBillId ? bills.find(b => b.id === selectedBillId) : null;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-2">
            SplitBiller
          </h1>
          <p className="text-gray-600 text-base sm:text-lg lg:text-xl mb-4">
            Mudah membagi tagihan dengan teman-teman
          </p>
          {bills.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-800 text-sm font-medium">
                💡 Mulai dengan membuat bill pertama Anda!
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 bg-white p-2 rounded-xl shadow-lg border">
            <Button
              variant={viewMode === 'create' ? 'default' : 'outline'}
              onClick={() => setViewMode('create')}
              className={`flex items-center justify-center space-x-2 px-6 py-3 text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 ${
                viewMode === 'create' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                  : 'bg-white hover:bg-blue-50 text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Buat Bill Baru</span>
              <span className="xs:hidden">Buat Bill</span>
            </Button>
            <Button
              variant={viewMode === 'expense' ? 'default' : 'outline'}
              onClick={() => setViewMode('expense')}
              disabled={!selectedBill}
              className={`flex items-center justify-center space-x-2 px-6 py-3 text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 ${
                viewMode === 'expense' 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                  : 'bg-white hover:bg-green-50 text-gray-700 border-gray-300 hover:border-green-300'
              } ${!selectedBill ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Tambah Pengeluaran</span>
              <span className="xs:hidden">Tambah</span>
            </Button>
            <Button
              variant={viewMode === 'summary' ? 'default' : 'outline'}
              onClick={() => setViewMode('summary')}
              disabled={!selectedBill}
              className={`flex items-center justify-center space-x-2 px-6 py-3 text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 ${
                viewMode === 'summary' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md' 
                  : 'bg-white hover:bg-purple-50 text-gray-700 border-gray-300 hover:border-purple-300'
              } ${!selectedBill ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Lihat Summary</span>
              <span className="xs:hidden">Summary</span>
            </Button>
          </div>
        </div>

        {/* Bill Selection - Compact Dropdown */}
        {bills.length > 0 && viewMode !== 'create' && (
          <div className="mb-4">
            <div className="bg-white shadow-sm border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex-1 min-w-0">
                  <label htmlFor="bill-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Bill Aktif
                  </label>
                  <select
                    id="bill-select"
                    value={selectedBillId || ''}
                    onChange={(e) => {
                      const billId = e.target.value;
                      setActiveBill(billId);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">-- Pilih Bill --</option>
                    {bills.map((bill) => (
                      <option key={bill.id} value={bill.id}>
                        {bill.title} ({bill.participants.length} peserta, {bill.expenses.length} pengeluaran)
                      </option>
                    ))}
                  </select>
                </div>
                {selectedBill && (
                  <div className="flex-shrink-0">
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Total: Rp {selectedBill.totalAmount.toLocaleString('id-ID')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {viewMode === 'create' && (
            <BillForm onBillCreated={handleBillCreated} />
          )}

          {viewMode === 'expense' && selectedBill && (
            <ExpenseForm
              billId={selectedBill.id}
              participants={selectedBill.participants}
              onExpenseAdded={handleExpenseAdded}
            />
          )}

          {viewMode === 'summary' && selectedBillId && (
            <BillSummary 
              billId={selectedBillId} 
              onBack={() => setViewMode('expense')}
            />
          )}
        </div>

        {/* Quick Stats */}
        {bills.length > 0 && (
          <div className="mt-8 sm:mt-12">
            <Card className="bg-white shadow-md border">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl sm:text-2xl text-gray-800">Statistik</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                      {bills.length}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600 font-medium">
                      Total Bills
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                      {bills.reduce((total, bill) => total + bill.expenses.length, 0)}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600 font-medium">
                      Total Pengeluaran
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-gray-800">
                      {bills.reduce((total, bill) => total + bill.totalAmount, 0).toLocaleString('id-ID')}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600 font-medium">
                      Total Nilai (IDR)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
