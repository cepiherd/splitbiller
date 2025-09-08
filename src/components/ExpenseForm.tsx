import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useBillStore } from '../stores/billStore';
import type { User, MenuItem, OCRProduct } from '../types/bill';
import { Plus, Minus, Trash2, X } from 'lucide-react';
import { InvoiceUpload } from './InvoiceUpload';

interface ExpenseFormProps {
  billId: string;
  participants: User[];
  onExpenseAdded?: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  billId, 
  participants, 
  onExpenseAdded 
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [showInvoiceUpload, setShowInvoiceUpload] = useState(false);
  const [taxRate, setTaxRate] = useState('10'); // Default 10% tax
  const [includeTax, setIncludeTax] = useState(true);
  
  const { addExpense } = useBillStore();

  const handleParticipantToggle = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleAddMenuItem = () => {
    if (newItemName.trim() && newItemPrice && parseFloat(newItemPrice) > 0) {
      const newItem: MenuItem = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        price: parseFloat(newItemPrice),
        quantity: parseInt(newItemQuantity) || 1,
        notes: newItemNotes.trim() || undefined,
        assignedTo: [], // Will be set when user assigns it
        isShared: true, // Default to shared among all participants
      };
      
      setMenuItems([...menuItems, newItem]);
      
      // Update total amount
      const subtotal = [...menuItems, newItem].reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxAmount = includeTax ? (subtotal * parseFloat(taxRate) / 100) : 0;
      const totalAmount = subtotal + taxAmount;
      setAmount(totalAmount.toString());
      
      // Reset form
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQuantity('1');
      setNewItemNotes('');
    }
  };

  const handleRemoveMenuItem = (itemId: string) => {
    const updatedItems = menuItems.filter(item => item.id !== itemId);
    setMenuItems(updatedItems);
    
    // Update total amount
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = includeTax ? (subtotal * parseFloat(taxRate) / 100) : 0;
    const totalAmount = subtotal + taxAmount;
    setAmount(totalAmount.toString());
  };

  const handleUpdateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const updatedItems = menuItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setMenuItems(updatedItems);
    
    // Update total amount
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = includeTax ? (subtotal * parseFloat(taxRate) / 100) : 0;
    const totalAmount = subtotal + taxAmount;
    setAmount(totalAmount.toString());
  };

  const handleProductsExtracted = (products: OCRProduct[]) => {
    const newMenuItems: MenuItem[] = products.map((product, index) => ({
      id: `ocr-${Date.now()}-${index}`,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      notes: `OCR Confidence: ${Math.round((product.confidence || 0.85) * 100)}%`
    }));
    
    setMenuItems(newMenuItems);
    
    // Update total amount
    const totalAmount = newMenuItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setAmount(totalAmount.toString());
    
    // Close invoice upload modal
    setShowInvoiceUpload(false);
  };

  const handleTotalAmountExtracted = (totalAmount: number) => {
    setAmount(totalAmount.toString());
  };

  const handleAssignItemToUser = (itemId: string, userId: string, isAssigned: boolean) => {
    const updatedItems = menuItems.map(item => {
      if (item.id === itemId) {
        const currentAssigned = item.assignedTo || [];
        const newAssigned = isAssigned 
          ? [...currentAssigned, userId]
          : currentAssigned.filter(id => id !== userId);
        
        return {
          ...item,
          assignedTo: newAssigned,
          isShared: newAssigned.length === 0 // If no one assigned, it's shared
        };
      }
      return item;
    });
    setMenuItems(updatedItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !amount || !paidBy || selectedParticipants.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const subtotal = menuItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = includeTax ? (subtotal * parseFloat(taxRate) / 100) : 0;

    addExpense({
      description: description.trim(),
      amount: expenseAmount,
      paidBy,
      participants: selectedParticipants,
      category: category.trim() || undefined,
      billId,
      menuItems: menuItems.length > 0 ? menuItems : undefined,
      location: location.trim() || undefined,
      taxRate: includeTax ? parseFloat(taxRate) : undefined,
      taxAmount: includeTax ? taxAmount : undefined,
      subtotal: includeTax ? subtotal : undefined,
    });

    // Reset form
    setDescription('');
    setAmount('');
    setPaidBy('');
    setSelectedParticipants([]);
    setCategory('');
    setLocation('');
    setMenuItems([]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQuantity('1');
    setNewItemNotes('');

    onExpenseAdded?.();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white shadow-md border">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl sm:text-2xl text-gray-800">Tambah Pengeluaran</CardTitle>
        <CardDescription className="text-gray-600">
          Catat pengeluaran yang akan dibagi bersama
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm sm:text-base font-medium text-gray-700">
              Deskripsi *
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Makan malam di restoran, transport, dll"
              className="text-sm sm:text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm sm:text-base font-medium text-gray-700">
              Lokasi (Opsional)
            </label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Nama restoran, tempat, dll"
              className="text-sm sm:text-base"
            />
          </div>

          {/* Tax Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Pengaturan Pajak</h3>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center space-x-4 mb-3">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={includeTax}
                      onChange={(e) => setIncludeTax(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded-md transition-all duration-200 flex items-center justify-center ${
                      includeTax 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-gray-300 group-hover:border-blue-400 group-hover:bg-blue-50'
                    }`}>
                      {includeTax && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Sertakan Pajak</span>
                </label>
              </div>
              {includeTax && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Tarif Pajak:</label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-20 text-sm"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Item Menu (Opsional)</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Subtotal: {menuItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('id-ID')} IDR
                  {includeTax && (
                    <span className="ml-2 text-blue-600">
                      (Total: {parseFloat(amount || '0').toLocaleString('id-ID')} IDR)
                    </span>
                  )}
                </span>
              </div>
            </div>
            
            {/* Add Menu Item Form */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nama item (contoh: Nasi Goreng)"
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="Harga"
                    min="0"
                    step="1"
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    placeholder="Qty"
                    min="1"
                    className="text-sm w-20"
                  />
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  placeholder="Catatan (opsional)"
                  className="text-sm flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddMenuItem}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah
                </Button>
              </div>
            </div>

            {/* Menu Items List */}
            {menuItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Daftar Item:</h4>
                {menuItems.map((item) => (
                  <div key={item.id} className="p-3 bg-white border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{item.name}</div>
                        {item.notes && (
                          <div className="text-xs text-gray-500">{item.notes}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 p-0 bg-gray-200 hover:bg-gray-300 text-gray-700"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 p-0 bg-gray-200 hover:bg-gray-300 text-gray-700"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-sm font-semibold text-gray-800 min-w-[80px] text-right">
                          {(item.price * item.quantity).toLocaleString('id-ID')} IDR
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleRemoveMenuItem(item.id)}
                          className="w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* User Assignment */}
                    <div className="border-t pt-2">
                      <div className="text-xs font-medium text-gray-600 mb-2">
                        Assign ke user (kosongkan untuk dibagi rata):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {participants.map((participant) => {
                          const isAssigned = item.assignedTo?.includes(participant.id) || false;
                          return (
                            <label key={participant.id} className="flex items-center space-x-2 cursor-pointer group">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={(e) => handleAssignItemToUser(item.id, participant.id, e.target.checked)}
                                  className="sr-only"
                                />
                                <div className={`w-4 h-4 border-2 rounded-sm transition-all duration-200 flex items-center justify-center ${
                                  isAssigned 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : 'border-gray-300 group-hover:border-blue-400 group-hover:bg-blue-50'
                                }`}>
                                  {isAssigned && (
                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span className={`text-xs transition-colors ${
                                isAssigned ? 'text-blue-700 font-medium' : 'text-gray-700 group-hover:text-blue-600'
                              }`}>{participant.name}</span>
                            </label>
                          );
                        })}
                      </div>
                      {item.assignedTo && item.assignedTo.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          Dibagi untuk: {item.assignedTo.map(userId => 
                            participants.find(p => p.id === userId)?.name
                          ).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm sm:text-base font-medium text-gray-700">
                Total Jumlah (IDR) *
              </label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                min="0"
                step="1"
                className="text-sm sm:text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm sm:text-base font-medium text-gray-700">
                Kategori
              </label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Makanan, Transport, dll"
                className="text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium text-gray-700">Dibayar oleh *</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Pilih yang membayar</option>
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium text-gray-700">Dibagi untuk *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {participants.map((participant) => {
                const isSelected = selectedParticipants.includes(participant.id);
                return (
                  <label key={participant.id} className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 group ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-300 shadow-sm' 
                      : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                  }`}>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleParticipantToggle(participant.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded-md transition-all duration-200 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-gray-300 group-hover:border-blue-400 group-hover:bg-blue-50'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm sm:text-base font-medium transition-colors ${
                      isSelected ? 'text-blue-800' : 'text-gray-800 group-hover:text-blue-700'
                    }`}>{participant.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full py-4 text-base sm:text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={!description.trim() || !amount || !paidBy || selectedParticipants.length === 0}
          >
            💰 Tambah Pengeluaran
          </Button>
        </form>

        {/* Invoice Upload Modal */}
        {showInvoiceUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Upload Invoice</h3>
                <Button
                  onClick={() => setShowInvoiceUpload(false)}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <InvoiceUpload
                  onProductsExtracted={handleProductsExtracted}
                  onTotalAmountExtracted={handleTotalAmountExtracted}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
