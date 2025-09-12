import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BillForm } from '../components/BillForm';
import { ExpenseForm } from '../components/ExpenseForm';
import { BillSummary } from '../components/BillSummary';
import { useBillStore } from '../stores/billStore';
import { Plus, Receipt, Users } from 'lucide-react';
import { useError } from '../contexts/ErrorContext';
import { useLoading } from '../contexts/LoadingContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

type ViewMode = 'create' | 'expense' | 'summary';

export const HomePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  
  const { bills, activeBillId, setActiveBill } = useBillStore();
  const { addError } = useError();
  const { isLoading, setLoading } = useLoading();
  
  // Use activeBillId as the selected bill, fallback to first bill if available
  const selectedBillId = activeBillId || (bills.length > 0 ? bills[0].id : null);

  // Set active bill on mount if not set but bills exist
  useEffect(() => {
    const initializeApp = async () => {
      setLoading('stats', true);
      try {
        if (!activeBillId && bills.length > 0) {
          setActiveBill(bills[0].id);
        }
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        addError('Gagal memuat data aplikasi', 'error', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading('stats', false);
      }
    };

    initializeApp();
  }, [activeBillId, bills, setActiveBill, setLoading, addError]);

  // Show loading state on initial load
  if (isLoading('stats') && bills.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat aplikasi..." />
      </div>
    );
  }

  const handleBillCreated = (billId: string) => {
    try {
      setActiveBill(billId);
      setViewMode('expense');
      addError('Bill berhasil dibuat!', 'info');
    } catch (error) {
      addError('Gagal membuat bill', 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleExpenseAdded = () => {
    try {
      setViewMode('summary');
      addError('Pengeluaran berhasil ditambahkan!', 'info');
    } catch (error) {
      addError('Gagal menambahkan pengeluaran', 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const selectedBill = selectedBillId ? bills.find(b => b.id === selectedBillId) : null;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center items-center mb-4">
            <img 
              src="/BagiRata_logo.svg" 
              alt="Bagi Rata Logo" 
              className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-2">
            Bagi Rata
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
              onClick={() => {
                try {
                  setViewMode('create');
                } catch (error) {
                  addError('Gagal mengubah mode tampilan', 'error', error instanceof Error ? error.message : 'Unknown error');
                }
              }}
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

        {/* Bill Selection - Simplified & Responsive */}
        {bills.length > 0 && viewMode !== 'create' && (
          <div className="mb-8">
            <div className="bg-white shadow-sm border rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bill Aktif</span>
                  </div>
                  <select
                    value={selectedBillId || ''}
                    onChange={async (e) => {
                      const billId = e.target.value;
                      try {
                        setActiveBill(billId);
                        addError('Bill berhasil dipilih!', 'info');
                      } catch (error) {
                        addError('Gagal memilih bill', 'error', error instanceof Error ? error.message : 'Unknown error');
                      }
                    }}
                    className="w-full px-0 py-1 text-base font-semibold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="">-- Pilih Bill --</option>
                    {bills.map((bill) => (
                      <option key={bill.id} value={bill.id}>
                        {bill.title}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedBill && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium text-xs whitespace-nowrap border border-blue-200">
                      👥 {selectedBill.participants.length} peserta
                    </span>
                    <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium text-xs whitespace-nowrap border border-green-200">
                      💰 {selectedBill.expenses.length} pengeluaran
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full font-bold text-xs whitespace-nowrap border border-gray-300">
                      💵 Rp {selectedBill.totalAmount.toLocaleString('id-ID')}
                    </span>
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

          {viewMode === 'expense' && !selectedBill && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <LoadingSpinner size="lg" text="Memuat data bill..." />
                <p className="mt-4 text-gray-600">Mohon tunggu sebentar...</p>
              </div>
            </div>
          )}

          {viewMode === 'summary' && selectedBillId && (
            <BillSummary 
              billId={selectedBillId} 
              onBack={() => {
                try {
                  setViewMode('expense');
                } catch (error) {
                  addError('Gagal kembali ke mode pengeluaran', 'error', error instanceof Error ? error.message : 'Unknown error');
                }
              }}
            />
          )}

          {viewMode === 'summary' && !selectedBillId && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <LoadingSpinner size="lg" text="Memuat ringkasan..." />
                <p className="mt-4 text-gray-600">Mohon tunggu sebentar...</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 sm:mt-12">
          <Card className="bg-white shadow-md border">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl sm:text-2xl text-gray-800">Statistik</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading('stats') ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" text="Memuat statistik..." />
                </div>
              ) : bills.length > 0 ? (
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
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Belum ada data untuk ditampilkan</p>
                  <p className="text-xs mt-2">Buat bill pertama Anda untuk melihat statistik</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
