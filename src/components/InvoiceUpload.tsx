import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { OCRService } from '../services/ocrService';
import type { OCRResult, OCRProduct } from '../types/bill';
import { Upload, X, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Crop, Shield } from 'lucide-react';
import { ImageCropper } from './ImageCropper';
import { OCRValidation } from './OCRValidation';
import { OCRTextOverlay } from './OCRTextOverlay';
import BillFontTrainingWithBorders from './BillFontTrainingWithBorders';
import AdvancedOCRTraining from './AdvancedOCRTraining';

interface InvoiceUploadProps {
  onProductsExtracted: (products: OCRProduct[]) => void;
  onTotalAmountExtracted?: (totalAmount: number) => void;
}

export const InvoiceUpload: React.FC<InvoiceUploadProps> = ({
  onProductsExtracted,
  onTotalAmountExtracted
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showTextMarking, setShowTextMarking] = useState(false);
  const [products, setProducts] = useState<OCRProduct[]>([]);
  const [imageQuality, setImageQuality] = useState<'good' | 'warning' | 'poor'>('good');
  const [useInvoiceTraining, setUseInvoiceTraining] = useState(true);
  const [useBillFontTraining, setUseBillFontTraining] = useState(false);
  const [activeTab, setActiveTab] = useState<'standard' | 'bill-font' | 'bill-font-borders' | 'advanced-training'>('standard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup URLs saat komponen unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl);
      }
    };
  }, [previewUrl, croppedPreviewUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validasi tipe file
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar');
        return;
      }
      
      // Validasi ukuran file (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal 10MB');
        return;
      }

      setError(null);
      setSelectedFile(file);
      
      // Buat preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Reset states
      setOcrResult(null);
      setCroppedImageBlob(null);
      setShowCropper(false);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (croppedPreviewUrl) {
      URL.revokeObjectURL(croppedPreviewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    setCroppedImageBlob(null);
    setCroppedPreviewUrl(null);
    setShowCropper(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcessImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const ocrService = OCRService.getInstance();
      
      // Gunakan cropped image jika ada, jika tidak gunakan original
      const imageToProcess = croppedImageBlob || selectedFile;
      
      console.log('Processing image with OCR...', {
        hasCroppedImage: !!croppedImageBlob,
        fileType: imageToProcess instanceof File ? imageToProcess.type : 'blob'
      });
      
      // Choose training method based on user selection
      let result: OCRResult;
      
      if (useBillFontTraining) {
        result = await ocrService.processImageWithBillFontTraining(imageToProcess, (progress) => {
          console.log('Bill Font Training OCR Progress Update:', progress);
          setProcessingProgress(progress);
        });
      } else if (useInvoiceTraining) {
        result = await ocrService.processImageWithInvoiceTraining(imageToProcess, (progress) => {
          console.log('Invoice Training OCR Progress Update:', progress);
          setProcessingProgress(progress);
        });
      } else {
        result = await ocrService.processImage(imageToProcess, (progress) => {
          console.log('Standard OCR Progress Update:', progress);
          setProcessingProgress(progress);
        });
      }
      
      console.log('OCR processing completed successfully', {
        productsFound: result.products.length,
        totalAmount: result.totalAmount,
        confidence: result.confidence
      });
      
      // Assess image quality based on OCR confidence
      if (result.confidence < 0.6) {
        setImageQuality('poor');
      } else if (result.confidence < 0.8) {
        setImageQuality('warning');
      } else {
        setImageQuality('good');
      }
      
      // Show warning if no products found
      if (result.products.length === 0) {
        console.warn('No products found in OCR result');
        setError('Tidak ada produk yang ditemukan dalam gambar. Silakan coba crop area yang berisi item dan harga, atau input manual.');
      }
      
      setOcrResult(result);
      setProducts(result.products);
      setShowValidation(true);
      setShowTextMarking(true);
      
      if (result.totalAmount && onTotalAmountExtracted) {
        onTotalAmountExtracted(result.totalAmount);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memproses gambar. Silakan coba lagi.';
      setError(errorMessage);
      console.error('OCR Error:', err);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setCroppedImageBlob(croppedBlob);
    
    // Buat preview URL dari cropped image
    const croppedUrl = URL.createObjectURL(croppedBlob);
    setCroppedPreviewUrl(croppedUrl);
    
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
  };

  const handleUseProducts = () => {
    onProductsExtracted(products);
    setShowValidation(false);
  };

  const handleProductsChange = (updatedProducts: OCRProduct[]) => {
    setProducts(updatedProducts);
  };

  const handleValidationComplete = (isFullyValidated: boolean) => {
    console.log('Validation completed:', { isFullyValidated });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-md border">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl sm:text-2xl text-gray-800 flex items-center gap-2">
          <Upload className="w-6 h-6" />
          Upload Invoice
        </CardTitle>
        <CardDescription className="text-gray-600">
          Upload gambar invoice untuk mengekstrak informasi produk secara otomatis
        </CardDescription>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mt-4">
          <button
            onClick={() => setActiveTab('standard')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'standard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Standard OCR
          </button>
          <button
            onClick={() => setActiveTab('bill-font')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'bill-font'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bill Font Training
          </button>
          <button
            onClick={() => setActiveTab('bill-font-borders')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'bill-font-borders'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bill Font with Borders
          </button>
          <button
            onClick={() => setActiveTab('advanced-training')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'advanced-training'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Advanced Training
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Conditional Content Based on Active Tab */}
        {activeTab === 'bill-font-borders' ? (
          <BillFontTrainingWithBorders />
        ) : activeTab === 'advanced-training' ? (
          <AdvancedOCRTraining />
        ) : (
          <>
            {/* File Upload Area */}
            {!selectedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Pilih gambar invoice
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Format yang didukung: JPG, PNG, GIF (maksimal 10MB)
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Pilih File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Preview */}
            <div className="relative">
              <img
                src={croppedPreviewUrl || previewUrl!}
                alt="Invoice preview"
                className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
              />
              <Button
                onClick={handleRemoveFile}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
              >
                <X className="w-4 h-4" />
              </Button>
              
              {/* Crop Status Indicator */}
              {croppedPreviewUrl && (
                <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                  <Crop className="w-3 h-3" />
                  Cropped Area
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    {croppedImageBlob && (
                      <span className="ml-2 text-green-600 font-medium">
                        ✓ Sudah di-crop
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {croppedImageBlob 
                      ? "OCR akan memproses area yang di-crop (lebih akurat)" 
                      : "OCR akan memproses seluruh gambar"
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowCropper(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Crop className="w-4 h-4" />
                    {croppedPreviewUrl ? 'Re-crop' : 'Crop'}
                  </Button>
                  
                  {croppedPreviewUrl && (
                    <Button
                      onClick={() => {
                        if (croppedPreviewUrl) {
                          URL.revokeObjectURL(croppedPreviewUrl);
                        }
                        setCroppedPreviewUrl(null);
                        setCroppedImageBlob(null);
                      }}
                      variant="outline"
                      className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <X className="w-4 h-4" />
                      Reset Crop
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleProcessImage}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memproses... {Math.round(processingProgress)}%
                      </>
                    ) : (
                      'Proses Gambar'
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Progress Bar */}
              {isProcessing && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="ocr-progress-bar h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Training Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">OCR Training Options:</h4>
          
          {/* Bill Font Training */}
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <input
              type="radio"
              id="billFontTraining"
              name="trainingMethod"
              checked={useBillFontTraining}
              onChange={(e) => {
                setUseBillFontTraining(e.target.checked);
                if (e.target.checked) {
                  setUseInvoiceTraining(false);
                }
              }}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
            />
            <label htmlFor="billFontTraining" className="text-sm font-medium text-green-800">
              Bill Font Training (Best for Indonesian Receipts)
            </label>
            <span className="text-xs text-green-600">
              - Optimized for Indonesian bill fonts and common OCR mistakes
            </span>
          </div>

          {/* Invoice Training */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="radio"
              id="invoiceTraining"
              name="trainingMethod"
              checked={useInvoiceTraining}
              onChange={(e) => {
                setUseInvoiceTraining(e.target.checked);
                if (e.target.checked) {
                  setUseBillFontTraining(false);
                }
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="invoiceTraining" className="text-sm font-medium text-blue-800">
              Invoice Training (General Purpose)
            </label>
            <span className="text-xs text-blue-600">
              - Good for general receipts and invoices
            </span>
          </div>

          {/* Standard OCR */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <input
              type="radio"
              id="standardOCR"
              name="trainingMethod"
              checked={!useInvoiceTraining && !useBillFontTraining}
              onChange={(e) => {
                if (e.target.checked) {
                  setUseInvoiceTraining(false);
                  setUseBillFontTraining(false);
                }
              }}
              className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 focus:ring-gray-500"
            />
            <label htmlFor="standardOCR" className="text-sm font-medium text-gray-800">
              Standard OCR (No Training)
            </label>
            <span className="text-xs text-gray-600">
              - Basic OCR without specialized training
            </span>
          </div>
        </div>

        {/* Image Quality Warning */}
        {imageQuality === 'warning' && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Image Quality Warning</p>
              <p className="text-sm">The image may be blurry or low quality. OCR accuracy might be reduced. Consider re-cropping or using a higher quality image.</p>
            </div>
          </div>
        )}

        {imageQuality === 'poor' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Poor Image Quality</p>
              <p className="text-sm">The image is too blurry or low quality for accurate OCR. Please try re-cropping with a larger area or use a higher quality image.</p>
            </div>
          </div>
        )}

        {/* OCR Results */}
        {ocrResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Hasil Ekstraksi Produk
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRawText(!showRawText)}
                >
                  {showRawText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showRawText ? 'Sembunyikan' : 'Tampilkan'} Teks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowValidation(!showValidation)}
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  {showValidation ? 'Hide' : 'Show'} Validation
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTextMarking(!showTextMarking)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {showTextMarking ? 'Hide' : 'Show'} Text Marking
                </Button>
                <Button
                  onClick={handleUseProducts}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Gunakan Produk
                </Button>
              </div>
            </div>

            {/* Raw Text */}
            {showRawText && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Teks yang Dibaca:</h4>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono">
                  {ocrResult.rawText}
                </pre>
              </div>
            )}

            {/* OCR Text Marking Overlay */}
            {showTextMarking && ocrResult?.textBlocks && ocrResult?.imageDimensions && (
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  OCR Text Detection Results
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="h-96 w-full">
                    <OCRTextOverlay
                      imageSrc={croppedPreviewUrl || previewUrl!}
                      textBlocks={ocrResult.textBlocks}
                      products={products}
                      imageDimensions={ocrResult.imageDimensions}
                      onTextBlockClick={(textBlock, productIndex) => {
                        console.log('Text block clicked:', textBlock, productIndex);
                        if (productIndex !== undefined) {
                          // Focus on the product in validation panel
                          setShowValidation(true);
                        }
                      }}
                      showAllText={true}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OCR Validation */}
            {showValidation && (
              <div className="border-t pt-4">
                <OCRValidation
                  products={products}
                  onProductsChange={handleProductsChange}
                  onValidationComplete={handleValidationComplete}
                />
              </div>
            )}

            {/* Extracted Products */}
            {!showValidation && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Produk yang Ditemukan:</h4>
                <div className="space-y-2">
                  {products.map((product, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 border rounded-lg ocr-validation-card ${
                        product.isValidated 
                          ? 'ocr-status-validated' 
                          : product.isMarked 
                          ? 'ocr-status-marked'
                          : 'ocr-status-pending'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800">{product.name}</p>
                          {product.isValidated && (
                            <span className="status-icon validated">✓</span>
                          )}
                          {product.isMarked && !product.isValidated && (
                            <span className="status-icon marked">⚠</span>
                          )}
                          {!product.isValidated && !product.isMarked && (
                            <span className="status-icon pending">⏳</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Qty: {product.quantity} × {formatPrice(product.price)} = {formatPrice(product.quantity * product.price)}
                        </p>
                        {product.validationNotes && (
                          <p className="text-xs text-gray-500 mt-1">
                            Catatan: {product.validationNotes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">
                          {formatPrice(product.quantity * product.price)}
                        </p>
                        {product.confidence && (
                          <span className="confidence-badge">
                            {Math.round(product.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Amount */}
            {ocrResult.totalAmount && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-800">Total Invoice:</span>
                  <span className="text-xl font-bold text-blue-900">
                    {formatPrice(ocrResult.totalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* OCR Confidence and Validation Status */}
            <div className="text-sm text-gray-600 space-y-1">
              <p>Akurasi OCR: {Math.round(ocrResult.confidence * 100)}%</p>
              {ocrResult.validationSummary && (
                <div className="flex gap-4 text-xs">
                  <span className="text-green-600 flex items-center gap-1">
                    <span className="status-icon validated">✓</span>
                    {ocrResult.validationSummary.validatedProducts} Tervalidasi
                  </span>
                  <span className="text-yellow-600 flex items-center gap-1">
                    <span className="status-icon marked">⚠</span>
                    {ocrResult.validationSummary.markedProducts} Ditandai
                  </span>
                  <span className="text-orange-600 flex items-center gap-1">
                    <span className="status-icon pending">⏳</span>
                    {ocrResult.validationSummary.needsReview} Perlu Review
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Cropper Modal */}
        {showCropper && previewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Crop Gambar Invoice</h3>
                <Button
                  onClick={handleCropCancel}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <ImageCropper
                  imageSrc={previewUrl}
                  onCropComplete={handleCropComplete}
                  onCancel={handleCropCancel}
                />
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
