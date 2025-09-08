import React, { useState, useRef } from 'react';
import { OCRService } from '../services/ocrService';
import OCRBorderOverlay from './OCRBorderOverlay';

interface BorderArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  type: 'product' | 'price' | 'quantity' | 'total' | 'header' | 'footer';
  confidence?: number;
  isSelected: boolean;
}

interface OCRResult {
  products: Array<{
    name: string;
    quantity: number;
    price: number;
    confidence: number;
    isValidated: boolean;
    isMarked: boolean;
    validationNotes?: string;
  }>;
  totalAmount: number;
  confidence: number;
  processingTime?: number;
}

export const BillFontTrainingWithBorders: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [markedAreas, setMarkedAreas] = useState<BorderArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<BorderArea | null>(null);
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const [processingMode, setProcessingMode] = useState<'auto' | 'manual' | 'guided'>('guided');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setOcrResult(null);
      setMarkedAreas([]);
      setSelectedArea(null);
    }
  };

  const handleProcessImage = async () => {
    if (!imageFile) return;

    setIsProcessing(true);
    try {
      const ocrService = OCRService.getInstance();
      const result = await ocrService.processImageWithBillFontTraining(imageFile);
      
      setOcrResult(result);
      
      // Auto-generate border areas based on OCR result
      if (processingMode === 'auto' || processingMode === 'guided') {
        generateBorderAreasFromOCR(result);
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateBorderAreasFromOCR = (result: OCRResult) => {
    // This is a simplified version - in real implementation, you'd use
    // OCR bounding box data to create precise areas
    const areas: BorderArea[] = [];
    
    result.products.forEach((product, index) => {
      // Simulate bounding box positions (in real app, use actual OCR coordinates)
      const y = 100 + (index * 60);
      areas.push({
        id: `product_${index}`,
        x: 50,
        y: y,
        width: 200,
        height: 40,
        label: product.name,
        type: 'product',
        confidence: product.confidence,
        isSelected: false
      });
    });

    // Add total area
    areas.push({
      id: 'total',
      x: 50,
      y: 100 + (result.products.length * 60),
      width: 200,
      height: 30,
      label: `Total: Rp ${result.totalAmount.toLocaleString()}`,
      type: 'total',
      confidence: result.confidence,
      isSelected: false
    });

    setMarkedAreas(areas);
  };

  const handleAreaSelect = (area: BorderArea) => {
    setSelectedArea(area);
    console.log('Selected area:', area);
  };

  const handleAreasChange = (areas: BorderArea[]) => {
    setMarkedAreas(areas);
  };

  const handleValidateArea = (area: BorderArea) => {
    if (!ocrResult) return;

    // Find corresponding product
    const product = ocrResult.products.find(p => p.name === area.label);
    if (product) {
      // Mark as validated
      const updatedResult = {
        ...ocrResult,
        products: ocrResult.products.map(p => 
          p.name === product.name ? { ...p, isValidated: true, isMarked: true } : p
        )
      };
      setOcrResult(updatedResult);
    }
  };

  const handleRejectArea = (area: BorderArea) => {
    // Remove area from marked areas
    const updatedAreas = markedAreas.filter(a => a.id !== area.id);
    setMarkedAreas(updatedAreas);
  };

  const handleEditArea = (_area: BorderArea) => {
    // Enable editing mode for the area
    setIsTrainingMode(true);
    setSelectedArea(_area);
  };

  const exportTrainingData = () => {
    const trainingData = {
      imageUrl,
      markedAreas,
      ocrResult,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(trainingData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bill-font-training-data.json';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Bill Font Training with Border Marking
        </h2>

        {/* File Upload Section */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Select Image
            </button>
            
            {imageFile && (
              <button
                onClick={handleProcessImage}
                disabled={isProcessing}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Process with Bill Font Training'}
              </button>
            )}
          </div>

          {/* Processing Mode Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Processing Mode:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="auto"
                  checked={processingMode === 'auto'}
                  onChange={(e) => setProcessingMode(e.target.value as any)}
                  className="mr-2"
                />
                Auto (Generate borders automatically)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="guided"
                  checked={processingMode === 'guided'}
                  onChange={(e) => setProcessingMode(e.target.value as any)}
                  className="mr-2"
                />
                Guided (Auto + Manual editing)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={processingMode === 'manual'}
                  onChange={(e) => setProcessingMode(e.target.value as any)}
                  className="mr-2"
                />
                Manual (Draw borders yourself)
              </label>
            </div>
          </div>

          {/* Training Mode Toggle */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isTrainingMode}
                onChange={(e) => setIsTrainingMode(e.target.checked)}
                className="mr-2"
              />
              Enable Training Mode (Click and drag to create areas)
            </label>
          </div>
        </div>

        {/* Image and Border Overlay */}
        {imageUrl && (
          <div className="mb-6">
            <OCRBorderOverlay
              imageUrl={imageUrl}
              onAreaSelect={handleAreaSelect}
              onAreasChange={handleAreasChange}
              detectedAreas={markedAreas}
              isTrainingMode={isTrainingMode}
            />
          </div>
        )}

        {/* OCR Results */}
        {ocrResult && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">OCR Results</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Products Found ({ocrResult.products.length})</h4>
                  <div className="space-y-2">
                    {ocrResult.products.map((product, index) => (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg ${
                          product.isValidated ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-600">
                              Qty: {product.quantity} × Rp {product.price.toLocaleString()} = Rp {(product.quantity * product.price).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Confidence: {Math.round(product.confidence * 100)}%
                              {product.validationNotes && ` • ${product.validationNotes}`}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {!product.isValidated && (
                              <button
                                onClick={() => handleValidateArea({ ...product, id: `product_${index}` } as any)}
                                className="text-green-500 hover:text-green-700 text-sm"
                              >
                                ✓
                              </button>
                            )}
                            <button
                              onClick={() => handleRejectArea({ ...product, id: `product_${index}` } as any)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              ✗
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-semibold">Rp {ocrResult.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overall Confidence:</span>
                      <span>{Math.round(ocrResult.confidence * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Time:</span>
                      <span>{ocrResult.processingTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Marked Areas:</span>
                      <span>{markedAreas.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={exportTrainingData}
            disabled={!markedAreas.length}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 transition-colors"
          >
            Export Training Data
          </button>
          
          <button
            onClick={() => {
              setImageFile(null);
              setImageUrl('');
              setOcrResult(null);
              setMarkedAreas([]);
              setSelectedArea(null);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillFontTrainingWithBorders;
