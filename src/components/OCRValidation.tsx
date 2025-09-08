import React, { useState } from 'react';
import type { OCRProduct, OCRValidationStatus } from '../types/bill';
import { OCRService } from '../services/ocrService';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

interface OCRValidationProps {
  products: OCRProduct[];
  onProductsChange: (products: OCRProduct[]) => void;
  onValidationComplete?: (isFullyValidated: boolean) => void;
}

export const OCRValidation: React.FC<OCRValidationProps> = ({
  products,
  onProductsChange,
  onValidationComplete
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<OCRProduct>>({});
  const [notes, setNotes] = useState<string>('');

  const ocrService = OCRService.getInstance();

  const handleValidate = (index: number, isValid: boolean) => {
    const validation: OCRValidationStatus = {
      isValid,
      isMarked: products[index].isMarked || false,
      notes: notes || undefined,
      validatedAt: new Date()
    };

    ocrService.validateProduct([...products], index, validation);
    onProductsChange([...products]);
    
    // Check if all products are validated
    const updatedProducts = [...products];
    updatedProducts[index] = { ...products[index], ...validation };
    const summary = ocrService.getValidationSummary(updatedProducts);
    
    if (onValidationComplete) {
      onValidationComplete(summary.isFullyValidated);
    }
  };

  const handleMark = (index: number, isMarked: boolean) => {
    ocrService.markProduct([...products], index, isMarked, notes || undefined);
    onProductsChange([...products]);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValues({
      name: products[index].name,
      quantity: products[index].quantity,
      price: products[index].price
    });
  };

  const handleSaveEdit = (index: number) => {
    if (editingIndex === index && editValues) {
      const updatedProducts = [...products];
      updatedProducts[index] = {
        ...products[index],
        ...editValues
      };
      onProductsChange(updatedProducts);
      setEditingIndex(null);
      setEditValues({});
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValues({});
  };

  const handleValidateAll = (isValid: boolean) => {
    ocrService.validateAllProducts([...products], isValid, notes || undefined);
    const updatedProducts = [...products];
    updatedProducts.forEach((_, index) => {
      updatedProducts[index] = {
        ...updatedProducts[index],
        isValidated: isValid,
        isMarked: updatedProducts[index].isMarked || false,
        validationNotes: notes || undefined
      };
    });
    onProductsChange(updatedProducts);
    
    if (onValidationComplete) {
      onValidationComplete(isValid);
    }
  };

  const handleMarkAll = (isMarked: boolean) => {
    const updatedProducts = [...products];
    updatedProducts.forEach((_, index) => {
      ocrService.markProduct(updatedProducts, index, isMarked, notes || undefined);
    });
    onProductsChange(updatedProducts);
  };

  const getStatusColor = (product: OCRProduct) => {
    if (product.isValidated) return 'bg-green-100 border-green-300 text-green-800';
    if (product.isMarked) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getStatusText = (product: OCRProduct) => {
    if (product.isValidated) return '✓ Tervalidasi';
    if (product.isMarked) return '⚠ Ditandai';
    return '⏳ Perlu Review';
  };

  const summary = ocrService.getValidationSummary(products);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="p-4 validation-summary-card">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Status Validasi OCR</h3>
          <div className="text-sm text-gray-600">
            {summary.validatedProducts}/{summary.totalProducts} Tervalidasi
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="status-icon validated">✓</span>
              <div className="text-2xl font-bold text-green-600">{summary.validatedProducts}</div>
            </div>
            <div className="text-gray-600">Tervalidasi</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="status-icon marked">⚠</span>
              <div className="text-2xl font-bold text-yellow-600">{summary.markedProducts}</div>
            </div>
            <div className="text-gray-600">Ditandai</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="status-icon pending">⏳</span>
              <div className="text-2xl font-bold text-orange-600">{summary.needsReview}</div>
            </div>
            <div className="text-gray-600">Perlu Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalProducts}</div>
            <div className="text-gray-600">Total Produk</div>
          </div>
        </div>

        {/* Batch Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => handleValidateAll(true)}
            variant="outline"
            size="sm"
            className="batch-action-button text-green-600 border-green-300 hover:bg-green-50"
          >
            ✓ Validasi Semua
          </Button>
          <Button
            onClick={() => handleValidateAll(false)}
            variant="outline"
            size="sm"
            className="batch-action-button text-red-600 border-red-300 hover:bg-red-50"
          >
            ✗ Tolak Semua
          </Button>
          <Button
            onClick={() => handleMarkAll(true)}
            variant="outline"
            size="sm"
            className="batch-action-button text-yellow-600 border-yellow-300 hover:bg-yellow-50"
          >
            ⚠ Tandai Semua
          </Button>
          <Button
            onClick={() => handleMarkAll(false)}
            variant="outline"
            size="sm"
            className="batch-action-button text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            🔄 Reset Tanda
          </Button>
        </div>
      </Card>

      {/* Notes Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Catatan Validasi (Opsional)
        </label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Masukkan catatan untuk validasi..."
          className="w-full validation-notes-input"
        />
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {products.map((product, index) => (
          <Card key={index} className={`p-4 border-2 ocr-validation-card ${getStatusColor(product)}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`status-icon ${
                    product.isValidated ? 'validated' : 
                    product.isMarked ? 'marked' : 'pending'
                  }`}>
                    {product.isValidated ? '✓' : product.isMarked ? '⚠' : '⏳'}
                  </span>
                  <span className="text-sm font-medium">
                    {getStatusText(product)}
                  </span>
                  {product.confidence && (
                    <span className="confidence-badge">
                      {Math.round(product.confidence * 100)}% confidence
                    </span>
                  )}
                </div>

                {editingIndex === index ? (
                  <div className="space-y-2">
                    <Input
                      value={editValues.name || ''}
                      onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                      placeholder="Nama Produk"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={editValues.quantity || ''}
                        onChange={(e) => setEditValues({...editValues, quantity: parseInt(e.target.value) || 0})}
                        placeholder="Qty"
                        className="w-20"
                      />
                      <Input
                        type="number"
                        value={editValues.price || ''}
                        onChange={(e) => setEditValues({...editValues, price: parseFloat(e.target.value) || 0})}
                        placeholder="Harga"
                        className="w-32"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveEdit(index)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Simpan
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        size="sm"
                        variant="outline"
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium text-lg">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      Qty: {product.quantity} × Rp {product.price.toLocaleString('id-ID')} = 
                      <span className="font-semibold"> Rp {(product.quantity * product.price).toLocaleString('id-ID')}</span>
                    </div>
                    {product.validationNotes && (
                      <div className="text-xs text-gray-500 mt-1">
                        Catatan: {product.validationNotes}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editingIndex !== index && (
                <div className="flex flex-col gap-2 ml-4">
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleValidate(index, true)}
                      size="sm"
                      className="ocr-validation-button bg-green-600 hover:bg-green-700 text-white"
                      disabled={product.isValidated}
                    >
                      ✓
                    </Button>
                    <Button
                      onClick={() => handleValidate(index, false)}
                      size="sm"
                      className="ocr-validation-button bg-red-600 hover:bg-red-700 text-white"
                    >
                      ✗
                    </Button>
                    <Button
                      onClick={() => handleMark(index, !product.isMarked)}
                      size="sm"
                      className={`ocr-validation-button ${product.isMarked ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'} text-white`}
                    >
                      ⚠
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleEdit(index)}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">📄</div>
          <div>Tidak ada produk untuk divalidasi</div>
        </Card>
      )}
    </div>
  );
};
