import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useBillStore } from '../stores/billStore';
import { BillService } from '../services/billService';
import type { ParticipantBalance, SplitCalculation, Expense, MenuItem, Subsidy } from '../types/bill';
import { ArrowLeft, Download, Share2 } from 'lucide-react';

interface BillSummaryProps {
  billId: string;
  onBack?: () => void;
}

export const BillSummary: React.FC<BillSummaryProps> = ({ billId, onBack }) => {
  const { getBillSummary, getSettlements, bills } = useBillStore();
  
  const summary = getBillSummary(billId);
  const settlements = getSettlements(billId);
  const currentBill = bills.find(b => b.id === billId);

  if (!summary) {
    return <div>Loading...</div>;
  }

  const handleDownload = () => {
    // TODO: Implement download functionality
    alert('Fitur download akan segera tersedia!');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    alert('Fitur share akan segera tersedia!');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex gap-3">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {/* Total Amount with Tax Breakdown */}
      <Card className="bg-white shadow-md border">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl text-gray-800">Total Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentBill && (
              <>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{BillService.formatCurrency(BillService.calculateSubtotal(currentBill))}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-600">Pajak:</span>
                  <span className="font-semibold text-red-600">{BillService.formatCurrency(BillService.calculateTotalTax(currentBill))}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
                    <span>Total:</span>
                    <span>{BillService.formatCurrency(summary.totalAmount)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subsidy Information */}
      {summary.subsidies && summary.subsidies.length > 0 ? (
        <Card className="bg-white shadow-md border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl text-gray-800">Subsidi Dana</CardTitle>
            <CardDescription className="text-gray-600">
              Informasi subsidi yang dibagikan kepada peserta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-lg">
                <span className="text-gray-600">Total Subsidi:</span>
                <span className="font-semibold text-green-600">{BillService.formatCurrency(summary.totalSubsidyAmount)}</span>
              </div>
              <div className="space-y-3">
                {summary.subsidies.map((subsidy: Subsidy) => {
                  const distributedByUser = summary.participantBalances.find((p: ParticipantBalance) => p.userId === subsidy.distributedBy);
                  const subsidyPerPerson = subsidy.amount / subsidy.participants.length;
                  
                  return (
                    <div key={subsidy.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 text-sm sm:text-base mb-2">{subsidy.description}</div>
                          <div className="text-xs sm:text-sm text-gray-600 mb-1">
                            Dibagikan oleh: {distributedByUser?.userName}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 mb-1">
                            Dibagi untuk: {subsidy.participants.length} orang
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            Tanggal: {new Date(subsidy.date).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                        <div className="text-right sm:text-left">
                          <div className="font-bold text-lg sm:text-xl text-green-600">
                            {BillService.formatCurrency(subsidy.amount)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {BillService.formatCurrency(subsidyPerPerson)}/orang
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white shadow-md border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl text-gray-800">Subsidi Dana</CardTitle>
            <CardDescription className="text-gray-600">
              Belum ada subsidi yang dibagikan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Tidak ada subsidi dana yang dicatat untuk bill ini.</p>
              <p className="text-xs mt-2">Gunakan form "Tambah Pengeluaran" untuk menambahkan subsidi.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participant Balances */}
      <Card className="bg-white shadow-md border">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl text-gray-800">Balance Peserta</CardTitle>
          <CardDescription className="text-gray-600">
            Lihat berapa yang sudah dibayar dan berhutang setiap peserta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {summary.participantBalances.map((balance: ParticipantBalance) => (
              <div key={balance.userId} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="mb-2 sm:mb-0">
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">{balance.userName}</div>
                  <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                    <div>Dibayar: {BillService.formatCurrency(balance.totalPaid)}</div>
                    <div>Berhutang: {BillService.formatCurrency(balance.totalOwed)}</div>
                    {balance.subtotal !== undefined && (
                      <div>Subtotal: {BillService.formatCurrency(balance.subtotal)}</div>
                    )}
                    {balance.taxAmount !== undefined && balance.taxAmount > 0 && (
                      <div>Pajak: {BillService.formatCurrency(balance.taxAmount)}</div>
                    )}
                    {balance.totalWithTax !== undefined && (
                      <div className="font-medium">Total: {BillService.formatCurrency(balance.totalWithTax)}</div>
                    )}
                    {balance.totalSubsidyReceived !== undefined && balance.totalSubsidyReceived > 0 && (
                      <div className="text-green-600 font-medium">Subsidi diterima: {BillService.formatCurrency(balance.totalSubsidyReceived)}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg sm:text-xl font-bold ${
                    balance.finalBalance > 0 
                      ? 'text-green-600' 
                      : balance.finalBalance < 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {balance.finalBalance > 0 
                      ? `+${BillService.formatCurrency(balance.finalBalance)}`
                      : balance.finalBalance < 0 
                      ? BillService.formatCurrency(balance.finalBalance)
                      : 'Lunas'
                    }
                  </div>
                  {balance.totalSubsidyReceived !== undefined && balance.totalSubsidyReceived > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Setelah subsidi
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settlements */}
      {settlements.length > 0 && (
        <Card className="bg-white shadow-md border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl text-gray-800">Pembayaran yang Diperlukan</CardTitle>
            <CardDescription className="text-gray-600">
              Transaksi yang perlu dilakukan untuk menyelesaikan semua hutang (setelah subsidi)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settlements.map((settlement: SplitCalculation, index: number) => {
                const fromUser = summary.participantBalances.find((p: ParticipantBalance) => p.userId === settlement.from);
                const toUser = summary.participantBalances.find((p: ParticipantBalance) => p.userId === settlement.to);
                
                return (
                  <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                      <span className="font-semibold text-red-600 text-sm sm:text-base">{fromUser?.userName}</span>
                      <span className="text-gray-500">→</span>
                      <span className="font-semibold text-green-600 text-sm sm:text-base">{toUser?.userName}</span>
                    </div>
                    <div className="font-bold text-lg sm:text-xl text-gray-800">
                      {BillService.formatCurrency(settlement.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Item Calculations */}
      {currentBill && currentBill.expenses.some(expense => expense.menuItems && expense.menuItems.length > 0) && (
        <Card className="bg-white shadow-md border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl text-gray-800">Perhitungan Per User</CardTitle>
            <CardDescription className="text-gray-600">
              Detail perhitungan item menu per user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {currentBill.expenses
                .filter(expense => expense.menuItems && expense.menuItems.length > 0)
                .map((expense) => {
                  const userCalculations = BillService.getUserItemCalculations(expense, currentBill.participants);
                  return (
                    <div key={expense.id} className="border rounded-lg p-4">
                      <div className="font-semibold text-gray-800 mb-3">{expense.description}</div>
                      <div className="space-y-3">
                        {userCalculations.map((calculation) => (
                          <div key={calculation.userId} className="bg-gray-50 p-3 rounded border">
                            <div className="font-medium text-gray-800 mb-2">{calculation.userName}</div>
                            <div className="space-y-1 text-sm">
                              {calculation.items.map((item) => (
                                <div key={item.itemId} className="flex justify-between">
                                  <span className="text-gray-600">
                                    {item.itemName} x{item.quantity} ({item.sharePercentage.toFixed(1)}%)
                                  </span>
                                  <span className="font-medium">{BillService.formatCurrency(item.totalPrice)}</span>
                                </div>
                              ))}
                              <div className="border-t pt-1 mt-2">
                                <div className="flex justify-between font-medium">
                                  <span>Subtotal:</span>
                                  <span>{BillService.formatCurrency(calculation.subtotal)}</span>
                                </div>
                                {calculation.taxAmount > 0 && (
                                  <div className="flex justify-between text-red-600">
                                    <span>Pajak:</span>
                                    <span>{BillService.formatCurrency(calculation.taxAmount)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold text-lg">
                                  <span>Total:</span>
                                  <span>{BillService.formatCurrency(calculation.totalWithTax)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      <Card className="bg-white shadow-md border">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl text-gray-800">Daftar Pengeluaran</CardTitle>
          <CardDescription className="text-gray-600">
            Semua pengeluaran yang telah dicatat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.expenses.map((expense: Expense) => {
              const paidByUser = summary.participantBalances.find((p: ParticipantBalance) => p.userId === expense.paidBy);
              const sharePerPerson = expense.amount / expense.participants.length;
              
              return (
                <div key={expense.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-sm sm:text-base mb-2">{expense.description}</div>
                      {expense.location && (
                        <div className="text-xs sm:text-sm text-blue-600 mb-1 font-medium">
                          📍 {expense.location}
                        </div>
                      )}
                      <div className="text-xs sm:text-sm text-gray-600 mb-1">
                        Dibayar oleh: {paidByUser?.userName}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mb-1">
                        Dibagi untuk: {expense.participants.length} orang
                      </div>
                      {expense.category && (
                        <div className="text-xs sm:text-sm text-gray-600 mb-2">
                          Kategori: {expense.category}
                        </div>
                      )}
                      
                      {/* Menu Items */}
                      {expense.menuItems && expense.menuItems.length > 0 && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <div className="text-xs font-medium text-gray-700 mb-2">📋 Detail Menu:</div>
                          <div className="space-y-1">
                            {expense.menuItems.map((item: MenuItem) => (
                              <div key={item.id} className="flex justify-between items-center text-xs">
                                <div className="flex-1">
                                  <span className="text-gray-800">{item.name}</span>
                                  {item.notes && (
                                    <span className="text-gray-500 ml-2">({item.notes})</span>
                                  )}
                                  {item.quantity > 1 && (
                                    <span className="text-gray-500 ml-1">x{item.quantity}</span>
                                  )}
                                </div>
                                <div className="text-gray-600 font-medium">
                                  {BillService.formatCurrency(item.price * item.quantity)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right sm:text-left">
                      <div className="font-bold text-lg sm:text-xl text-gray-800">
                        {BillService.formatCurrency(expense.amount)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        {expense.subtotal && (
                          <div>Subtotal: {BillService.formatCurrency(expense.subtotal)}</div>
                        )}
                        {expense.taxAmount && expense.taxAmount > 0 && (
                          <div className="text-red-600">Pajak: {BillService.formatCurrency(expense.taxAmount)}</div>
                        )}
                        <div>{BillService.formatCurrency(sharePerPerson)}/orang</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
