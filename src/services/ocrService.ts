import { createWorker } from 'tesseract.js';
import type { OCRResult, OCRProduct, OCRValidationResult, OCRValidationStatus, OCRTextBlock } from '../types/bill';
import { OCRTrainingService } from './ocrTrainingService';
import { ReceiptFormatDetector } from './receiptFormatDetector';
import { InvoiceOCRTrainingService } from './invoiceOCRTrainingService';
import { BillFontTrainingService } from './billFontTrainingService';
import { AdvancedOCRTrainingService } from './advancedOCRTrainingService';

// OCR service menggunakan Tesseract.js (100% gratis, client-side)
export class OCRService {
  private static instance: OCRService;
  private worker: Tesseract.Worker | null = null;
  private trainingService: OCRTrainingService;
  private formatDetector: ReceiptFormatDetector;
  private invoiceTrainingService: InvoiceOCRTrainingService;
  private billFontTrainingService: BillFontTrainingService;
  private advancedOCRTrainingService: AdvancedOCRTrainingService;
  
  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  private constructor() {
    this.trainingService = OCRTrainingService.getInstance();
    this.formatDetector = ReceiptFormatDetector.getInstance();
    this.invoiceTrainingService = InvoiceOCRTrainingService.getInstance();
    this.billFontTrainingService = BillFontTrainingService.getInstance();
    this.advancedOCRTrainingService = AdvancedOCRTrainingService.getInstance();
  }

  async processImage(imageFile: File | Blob, onProgress?: (progress: number) => void): Promise<OCRResult> {
    try {
      console.log('Starting OCR processing...', { 
        fileType: imageFile instanceof File ? imageFile.type : 'blob',
        fileSize: imageFile instanceof File ? imageFile.size : 'unknown'
      });

      // Preprocess image for better OCR accuracy
      const processedImage = await this.preprocessImageForOCR(imageFile);

      // Inisialisasi worker jika belum ada
      if (!this.worker) {
        console.log('Initializing Tesseract worker...');
        this.worker = await createWorker('eng', 1, {
          logger: m => {
            console.log('Tesseract Logger:', m);
            if (m.status === 'recognizing text' && onProgress) {
              const progress = Math.round(m.progress * 100);
              console.log(`OCR Progress: ${progress}%`);
              onProgress(progress);
            }
          }
        });
        
        // Configure Tesseract with receipt-specific training
        const receiptParams = this.trainingService.getReceiptOCRParameters();
        await this.worker.setParameters(receiptParams);
        
        // Train the worker for receipt recognition
        await this.trainingService.trainForReceipts();
        
        console.log('Tesseract worker initialized with enhanced settings');
      }

      // Use processed image for OCR
      let fileToProcess: File;
      if (processedImage instanceof Blob) {
        fileToProcess = new File([processedImage], 'processed-image.jpg', { type: 'image/jpeg' });
      } else {
        fileToProcess = processedImage;
      }

      console.log('Starting OCR recognition...');
      // Proses OCR dengan koordinat
      const result = await this.worker.recognize(fileToProcess);
      const { text, confidence } = result.data;
      
      // Try to get words and lines if available
      let words: any[] = [];
      let lines: any[] = [];
      
      try {
        // Access words and lines from the result
        words = (result as any).data.words || [];
        lines = (result as any).data.lines || [];
      } catch (e) {
        console.log('Words and lines not available, using text fallback');
      }
      
      console.log('OCR completed', { 
        textLength: text.length, 
        confidence: confidence,
        rawText: text.substring(0, 200) + '...',
        wordsCount: words?.length || 0,
        linesCount: lines?.length || 0
      });
      
      // Detect receipt format first
      const detectedFormat = this.formatDetector.detectFormat(text);
      console.log('Receipt format detected:', {
        format: detectedFormat.name,
        confidence: detectedFormat.confidence,
        description: detectedFormat.description
      });

      // Preprocess text with receipt training
      const preprocessedText = this.trainingService.preprocessReceiptText(text);
      console.log('Text preprocessed for receipt recognition', {
        originalLength: text.length,
        processedLength: preprocessedText.length,
        improvements: preprocessedText !== text
      });
      
      // Parse produk dari teks yang sudah di-preprocess dengan format-specific patterns
      const products = this.parseProductsFromTextWithFormat(preprocessedText, detectedFormat);
      const totalAmount = this.extractTotalAmount(preprocessedText);

      // Extract text blocks with real coordinates from Tesseract
      const textBlocks = this.extractTextBlocksFromTesseract(words, lines, text);
      
      // Get image dimensions
      const imageDimensions = await this.getImageDimensions(fileToProcess);
      
      // Link products with text blocks
      const linkedTextBlocks = this.linkProductsToTextBlocks(products, textBlocks);

      console.log('Parsed results', { 
        productsCount: products.length, 
        totalAmount,
        textBlocksCount: linkedTextBlocks.length,
        linkedBlocksCount: linkedTextBlocks.filter(b => b.isProduct).length,
        imageDimensions,
        products: products.map(p => ({ name: p.name, qty: p.quantity, price: p.price })),
        textBlocks: linkedTextBlocks.map(b => ({ 
          text: b.text.substring(0, 50), 
          isProduct: b.isProduct, 
          bbox: b.boundingBox 
        }))
      });

      // Hitung validation summary
      const validationSummary = {
        totalProducts: products.length,
        validatedProducts: products.filter(p => p.isValidated).length,
        markedProducts: products.filter(p => p.isMarked).length,
        needsReview: products.filter(p => !p.isValidated && !p.isMarked).length
      };

      return {
        rawText: text,
        products,
        totalAmount: totalAmount || undefined,
        confidence: confidence / 100, // Convert to 0-1 scale
        isFullyValidated: validationSummary.validatedProducts === validationSummary.totalProducts,
        validationSummary,
        textBlocks: linkedTextBlocks,
        imageDimensions
      };
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error(`Gagal memproses gambar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  // Method untuk memvalidasi produk OCR
  validateProduct(products: OCRProduct[], productIndex: number, validation: OCRValidationStatus): OCRValidationResult {
    if (productIndex < 0 || productIndex >= products.length) {
      throw new Error('Index produk tidak valid');
    }

    const product = products[productIndex];
    const productId = `product_${productIndex}`;

    // Update produk dengan status validasi
    products[productIndex] = {
      ...product,
      isValidated: validation.isValid,
      isMarked: validation.isMarked,
      validationNotes: validation.notes
    };

    return {
      productId,
      status: validation,
      originalData: product,
      correctedData: validation.isValid ? undefined : {
        name: product.name,
        quantity: product.quantity,
        price: product.price
      }
    };
  }

  // Method untuk mark/unmark produk
  markProduct(products: OCRProduct[], productIndex: number, isMarked: boolean, notes?: string): OCRValidationResult {
    const validation: OCRValidationStatus = {
      isValid: products[productIndex].isValidated || false,
      isMarked,
      notes,
      validatedAt: new Date()
    };

    return this.validateProduct(products, productIndex, validation);
  }

  // Method untuk validasi batch (semua produk sekaligus)
  validateAllProducts(products: OCRProduct[], isValid: boolean, notes?: string): OCRValidationResult[] {
    const results: OCRValidationResult[] = [];
    
    for (let i = 0; i < products.length; i++) {
      const validation: OCRValidationStatus = {
        isValid,
        isMarked: products[i].isMarked || false,
        notes,
        validatedAt: new Date()
      };
      
      results.push(this.validateProduct(products, i, validation));
    }
    
    return results;
  }

  // Method untuk mendapatkan summary validasi
  getValidationSummary(products: OCRProduct[]) {
    return {
      totalProducts: products.length,
      validatedProducts: products.filter(p => p.isValidated).length,
      markedProducts: products.filter(p => p.isMarked).length,
      needsReview: products.filter(p => !p.isValidated && !p.isMarked).length,
      isFullyValidated: products.every(p => p.isValidated)
    };
  }

  // Method untuk reset validasi
  resetValidation(products: OCRProduct[]): OCRProduct[] {
    return products.map(product => ({
      ...product,
      isValidated: false,
      isMarked: false,
      validationNotes: undefined
    }));
  }

  // Method untuk mengekstrak text blocks dengan koordinat asli dari Tesseract
  private extractTextBlocksFromTesseract(words: any[], lines: any[], text: string): OCRTextBlock[] {
    const textBlocks: OCRTextBlock[] = [];
    
    // Use lines if available, otherwise fall back to words
    if (lines && lines.length > 0) {
      lines.forEach((line) => {
        if (line.text && line.text.trim().length > 0) {
          textBlocks.push({
            text: line.text.trim(),
            confidence: line.confidence || 0,
            boundingBox: {
              x: line.bbox.x0,
              y: line.bbox.y0,
              width: line.bbox.x1 - line.bbox.x0,
              height: line.bbox.y1 - line.bbox.y0
            },
            isProduct: false
          });
        }
      });
    } else if (words && words.length > 0) {
      // Group words into lines based on y-coordinate proximity
      const wordGroups = this.groupWordsIntoLines(words);
      wordGroups.forEach((group) => {
        if (group.text.trim().length > 0) {
          textBlocks.push({
            text: group.text.trim(),
            confidence: group.confidence,
            boundingBox: group.boundingBox,
            isProduct: false
          });
        }
      });
    } else {
      // Fallback to text splitting if no coordinate data
      const textLines = text.split('\n');
      textLines.forEach((line, index) => {
        if (line.trim().length > 0) {
          textBlocks.push({
            text: line.trim(),
            confidence: 0.8,
            boundingBox: {
              x: 10,
              y: 20 + (index * 25),
              width: line.length * 8,
              height: 20
            },
            isProduct: false
          });
        }
      });
    }
    
    return textBlocks;
  }

  // Helper method to group words into lines
  private groupWordsIntoLines(words: any[]): OCRTextBlock[] {
    const lines: OCRTextBlock[] = [];
    const lineThreshold = 10; // pixels
    
    // Sort words by y-coordinate
    const sortedWords = words.sort((a, b) => a.bbox.y0 - b.bbox.y0);
    
    let currentLine: any[] = [];
    let currentY = -1;
    
    sortedWords.forEach((word) => {
      if (currentY === -1 || Math.abs(word.bbox.y0 - currentY) <= lineThreshold) {
        currentLine.push(word);
        currentY = word.bbox.y0;
      } else {
        // Process current line
        if (currentLine.length > 0) {
          lines.push(this.createTextBlockFromWords(currentLine));
        }
        // Start new line
        currentLine = [word];
        currentY = word.bbox.y0;
      }
    });
    
    // Process last line
    if (currentLine.length > 0) {
      lines.push(this.createTextBlockFromWords(currentLine));
    }
    
    return lines;
  }

  // Helper method to create text block from word group
  private createTextBlockFromWords(words: any[]): OCRTextBlock {
    const text = words.map(w => w.text).join(' ');
    const minX = Math.min(...words.map(w => w.bbox.x0));
    const maxX = Math.max(...words.map(w => w.bbox.x1));
    const minY = Math.min(...words.map(w => w.bbox.y0));
    const maxY = Math.max(...words.map(w => w.bbox.y1));
    const avgConfidence = words.reduce((sum, w) => sum + (w.confidence || 0), 0) / words.length;
    
    return {
      text,
      confidence: avgConfidence,
      boundingBox: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      },
      isProduct: false
    };
  }

  // Method untuk mendapatkan dimensi gambar
  private async getImageDimensions(imageFile: File | Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 0, height: 0 });
      };
      
      img.src = url;
    });
  }

  // Method untuk preprocessing gambar untuk OCR yang lebih baik
  private async preprocessImageForOCR(imageFile: File | Blob): Promise<File | Blob> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        // Create canvas for image processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(imageFile);
          return;
        }

        // Set canvas size (2x for better quality)
        const scaleFactor = 2;
        canvas.width = img.naturalWidth * scaleFactor;
        canvas.height = img.naturalHeight * scaleFactor;

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Apply image enhancement filters
        ctx.filter = 'contrast(1.3) brightness(1.1) saturate(1.2)';

        // Draw image with scaling
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Apply additional OCR-specific enhancements
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const enhancedImageData = this.enhanceImageForOCR(imageData);
        ctx.putImageData(enhancedImageData, 0, 0);

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(imageFile);
          }
        }, 'image/jpeg', 0.95);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(imageFile);
      };
      
      img.src = url;
    });
  }

  // Method untuk meningkatkan kualitas gambar untuk OCR
  private enhanceImageForOCR(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Create a copy of the image data
    const enhancedData = new Uint8ClampedArray(data);

    // Apply grayscale conversion with better contrast
    for (let i = 0; i < enhancedData.length; i += 4) {
      // Convert to grayscale using luminance formula
      const gray = enhancedData[i] * 0.299 + enhancedData[i + 1] * 0.587 + enhancedData[i + 2] * 0.114;
      
      // Apply contrast enhancement
      const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.4 + 128));
      
      // Apply sharpening filter
      const sharpened = Math.min(255, Math.max(0, enhanced * 1.1));
      
      enhancedData[i] = sharpened;     // Red
      enhancedData[i + 1] = sharpened; // Green
      enhancedData[i + 2] = sharpened; // Blue
      // Alpha channel remains unchanged
    }

    return new ImageData(enhancedData, width, height);
  }

  // Method untuk mengaitkan produk dengan text blocks
  linkProductsToTextBlocks(products: OCRProduct[], textBlocks: OCRTextBlock[]): OCRTextBlock[] {
    return textBlocks.map(block => {
      // Find matching product by text similarity
      const matchingProduct = products.find(product => {
        const productName = product.name.toLowerCase().trim();
        const blockText = block.text.toLowerCase().trim();
        
        // Check if the text block contains the product name
        const containsProductName = blockText.includes(productName);
        
        // Check if the text block contains quantity and price pattern
        const hasQuantityPrice = /\d+\s*x\s*@?\s*[\d.,]+\s*=\s*[\d.,]+/.test(blockText);
        
        // Check if the text block contains just the product name (for single items)
        const isProductNameOnly = blockText === productName;
        
        // More sophisticated matching
        return containsProductName || (isProductNameOnly && hasQuantityPrice) || 
               this.calculateTextSimilarity(blockText, productName) > 0.7;
      });
      
      if (matchingProduct) {
        const productIndex = products.indexOf(matchingProduct);
        return {
          ...block,
          isProduct: true,
          productIndex
        };
      }
      
      return block;
    });
  }

  // Helper method to calculate text similarity
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  // Method untuk parsing teks OCR menjadi produk dengan format-specific patterns
  parseProductsFromTextWithFormat(text: string, format: any): OCRProduct[] {
    console.log('Parsing text with format-specific patterns...', { 
      format: format.name,
      textLength: text.length 
    });
    
    const lines = text.split('\n');
    const products: OCRProduct[] = [];
    
    // Use format-specific patterns
    const patterns = format.patterns.product || [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      console.log(`Processing line ${i + 1} with format patterns:`, trimmedLine);
      
      for (let j = 0; j < patterns.length; j++) {
        const pattern = patterns[j];
        const match = trimmedLine.match(pattern);
        if (match) {
          console.log(`Format pattern ${j + 1} matched:`, match);
          
          let name, qty, price;
          
          if (match.length >= 4) {
            [, name, qty, price] = match;
            // Use the total price (4th group) if available
            if (match[4]) {
              price = match[4];
            }
          } else if (match.length === 3) {
            [, name, price] = match;
            qty = '1';
          } else {
            continue; // Skip if pattern doesn't match expected format
          }
          
          // Apply character correction to product name
          const correctedName = this.trainingService.correctCharacters(name.trim(), 'product_name');
          const cleanName = correctedName.replace(/^(.+?):\s*$/, '$1');
          const quantity = parseInt(qty);
          const cleanPrice = this.parsePrice(price);
          
          console.log('Parsed values:', { 
            name: cleanName, 
            quantity, 
            price: cleanPrice,
            originalLine: trimmedLine
          });
          
          if (cleanName && !isNaN(quantity) && !isNaN(cleanPrice) && this.isValidProductName(cleanName)) {
            products.push({
              name: cleanName,
              quantity: quantity,
              price: cleanPrice,
              confidence: 0.8, // Higher confidence for format-specific parsing
              isValidated: false,
              isMarked: false,
              validationNotes: undefined
            });
            console.log('Product added:', { name: cleanName, quantity, price: cleanPrice });
          }
        }
      }
    }
    
    console.log('Format-specific parsing completed', { 
      productsFound: products.length,
      format: format.name
    });
    
    return products;
  }

  // Method untuk parsing teks OCR menjadi produk dengan receipt training (fallback)
  parseProductsFromText(text: string): OCRProduct[] {
    console.log('Parsing text for products with receipt training...', { textLength: text.length });
    
    const lines = text.split('\n');
    const products: OCRProduct[] = [];
    
    console.log('Total lines to process:', lines.length);
    
    // Enhanced patterns with receipt training
    const patterns = [
      // Pattern 1: PRODUCT NAME: qty x @ price = total (receipt format)
      /^(.+?):\s*(\d+)\s*x\s*@?\s*([\d.,]+)\s*=\s*([\d.,]+)$/,
      // Pattern 2: PRODUCT NAME qty x @ price = total (no colon)
      /^(.+?)\s+(\d+)\s*x\s*@?\s*([\d.,]+)\s*=\s*([\d.,]+)$/,
      // Pattern 3: PRODUCT NAME qty x price = total (no @ symbol)
      /^(.+?)\s+(\d+)\s+x\s+([\d.,]+)\s+=\s+([\d.,]+)$/,
      // Pattern 4: PRODUCT NAME qty x price (no total)
      /^(.+?)\s+(\d+)\s+x\s+([\d.,]+)$/,
      // Pattern 5: Nama Produk Qty Harga (dengan spasi)
      /^(.+?)\s+(\d+)\s+([\d.,]+)$/,
      // Pattern 6: Nama Produk Qty Harga (dengan tab)
      /^(.+?)\t(\d+)\t([\d.,]+)$/,
      // Pattern 7: Nama Produk Qty Harga (dengan multiple spaces)
      /^(.+?)\s{2,}(\d+)\s{2,}([\d.,]+)$/,
      // Pattern 8: Nama Produk Qty Harga (dengan separator khusus)
      /^(.+?)[\s\t]+(\d+)[\s\t]+([\d.,]+)$/,
      // Pattern 9: Hanya nama dan harga (quantity = 1)
      /^(.+?)\s+([\d.,]+)$/,
      // Pattern 10: Nama Produk - Harga (dengan dash)
      /^(.+?)\s*-\s*([\d.,]+)$/,
      // Pattern 11: Receipt format with spaces: PRODUCT qty x @ price = total
      /^(.+?)\s+(\d+)\s+x\s+@\s+([\d.,]+)\s+=\s+([\d.,]+)$/,
      // Pattern 12: Receipt format with dots: PRODUCT qty x @ price = total
      /^(.+?)\s+(\d+)\s+x\s+@\s+([\d.,]+)\s+=\s+([\d.,]+)$/,
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      console.log(`Processing line ${i + 1}:`, trimmedLine);
      
      // Apply receipt pattern recognition first
      const patternRecognition = this.trainingService.recognizeReceiptPatterns(trimmedLine);
      if (patternRecognition.pattern) {
        console.log(`Receipt pattern recognized: ${patternRecognition.pattern.name}`, {
          confidence: patternRecognition.confidence,
          text: trimmedLine
        });
      }

      for (let j = 0; j < patterns.length; j++) {
        const pattern = patterns[j];
        const match = trimmedLine.match(pattern);
        if (match) {
          console.log(`Pattern ${j + 1} matched:`, match);
          
          let name, qty, price;
          
          if (j === 0 || j === 1 || j === 2 || j === 10 || j === 11) { // Patterns with total price
            [, name, qty, price] = match;
            // Use the total price (4th group) instead of unit price
            if (match[4]) {
              price = match[4];
            }
          } else if (j === 3) { // Pattern 4: PRODUCT NAME qty x price (no total)
            [, name, qty, price] = match;
          } else if (j === 8) { // Pattern 9: name and price only
            [, name, price] = match;
            qty = '1';
          } else if (j === 9) { // Pattern 10: name - price
            [, name, price] = match;
            qty = '1';
          } else {
            [, name, qty, price] = match;
          }
          
          // Apply character correction to product name
          const correctedName = this.trainingService.correctCharacters(name.trim(), 'product_name');
          const cleanName = correctedName.replace(/^(.+?):\s*$/, '$1'); // Remove trailing colon
          const quantity = parseInt(qty);
          const cleanPrice = this.parsePrice(price);
          
          console.log('Parsed values:', { 
            name: cleanName, 
            quantity, 
            price: cleanPrice,
            isValidItem: this.isValidItem(cleanName)
          });
          
          // Skip jika bukan item yang valid
          if (!this.isValidItem(cleanName) || quantity <= 0 || cleanPrice <= 0) {
            console.log('Skipping invalid item:', { cleanName, quantity, cleanPrice });
            continue;
          }
          
          const product = {
            name: cleanName,
            quantity,
            price: cleanPrice,
            confidence: 0.85 // Default confidence
          };
          
          products.push(product);
          console.log('Added product:', product);
          break; // Gunakan pattern pertama yang match
        }
      }
    }
    
    console.log('Final products found:', products.length, products);
    return products;
  }

  // Helper method untuk parsing harga
  private parsePrice(priceStr: string): number {
    // Remove currency symbols and clean the string
    const cleaned = priceStr.replace(/[^\d.,]/g, '');
    
    // Handle different decimal separators
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Format: 1,234.56 or 1.234,56
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      
      if (lastComma > lastDot) {
        // 1.234,56 format - replace dots with nothing, comma with dot
        return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
      } else {
        // 1,234.56 format - remove commas
        return parseFloat(cleaned.replace(/,/g, ''));
      }
    } else if (cleaned.includes(',')) {
      // Only commas - could be decimal separator
      const parts = cleaned.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Likely decimal separator
        return parseFloat(cleaned.replace(',', '.'));
      } else {
        // Likely thousands separator
        return parseFloat(cleaned.replace(/,/g, ''));
      }
    } else {
      // No separators or only dots
      return parseFloat(cleaned);
    }
  }

  private isValidItem(name: string): boolean {
    const invalidKeywords = [
      'subtotal', 'total', 'pajak', 'tax', 'service', 'charge', 'discount',
      'tip', 'gratuity', 'service charge', 'vat', 'ppn', 'pph',
      'amount', 'jumlah', 'rupiah', 'idr', 'rp', 'currency',
      'date', 'tanggal', 'time', 'waktu', 'invoice', 'receipt',
      'bill', 'tagihan', 'payment', 'pembayaran', 'cash', 'tunai',
      'card', 'kartu', 'debit', 'credit', 'bank', 'transfer'
    ];
    
    const lowerName = name.toLowerCase().trim();
    
    // Skip empty or very short names
    if (lowerName.length < 2) {
      return false;
    }
    
    // Skip if contains only numbers or special characters
    if (/^[\d\s.,\-_]+$/.test(lowerName)) {
      return false;
    }
    
    // Skip if contains invalid keywords
    const containsInvalidKeyword = invalidKeywords.some(keyword => 
      lowerName.includes(keyword.toLowerCase())
    );
    
    if (containsInvalidKeyword) {
      return false;
    }
    
    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(lowerName)) {
      return false;
    }
    
    return true;
  }

  // Method untuk mengekstrak total amount dari teks
  extractTotalAmount(text: string): number | null {
    console.log('Extracting total amount from text...');
    
    const totalPatterns = [
      /total[:\s]*([\d.,]+)/i,
      /jumlah[:\s]*([\d.,]+)/i,
      /amount[:\s]*([\d.,]+)/i,
      /grand\s+total[:\s]*([\d.,]+)/i,
      /final\s+total[:\s]*([\d.,]+)/i,
      /sum[:\s]*([\d.,]+)/i,
      /subtotal[:\s]*([\d.,]+)/i
    ];
    
    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amountStr = match[1];
        const amount = this.parsePrice(amountStr);
        console.log('Found total amount:', { pattern: pattern.source, amountStr, amount });
        if (amount > 0) {
          return amount;
        }
      }
    }
    
    console.log('No total amount found');
    return null;
  }

  // Method untuk validasi nama produk
  isValidProductName(name: string): boolean {
    if (!name || name.trim().length === 0) {
      return false;
    }
    
    const trimmedName = name.trim();
    const lowerName = trimmedName.toLowerCase();
    
    // Check for invalid keywords that are not product names
    const invalidKeywords = [
      'total', 'subtotal', 'tax', 'pajak', 'amount', 'jumlah',
      'date', 'tanggal', 'time', 'jam', 'cashier', 'kasir',
      'thank', 'terima', 'kasih', 'visit', 'kunjungan',
      'return', 'kembali', 'change', 'uang', 'kembalian',
      'receipt', 'struk', 'invoice', 'faktur', 'bill',
      'sub', 'total', 'grand', 'final', 'sum'
    ];
    
    const containsInvalidKeyword = invalidKeywords.some(keyword => 
      lowerName.includes(keyword) && lowerName.length < 20
    );
    
    if (containsInvalidKeyword) {
      return false;
    }
    
    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(lowerName)) {
      return false;
    }
    
    return true;
  }

  // Method untuk proses gambar dengan invoice training
  async processImageWithInvoiceTraining(imageFile: File | Blob, onProgress?: (progress: number) => void): Promise<OCRResult> {
    try {
      console.log('Starting OCR processing with invoice training...', { 
        fileType: imageFile instanceof File ? imageFile.type : 'blob',
        fileSize: imageFile instanceof File ? imageFile.size : 'unknown'
      });

      // Use invoice training service
      const result = await this.invoiceTrainingService.processImageWithTraining(imageFile, onProgress);
      
      console.log('Invoice training OCR completed', {
        productsFound: result.products.length,
        totalAmount: result.totalAmount,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      console.error('Invoice training OCR error:', error);
      throw new Error(`Invoice training OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Method untuk proses gambar dengan bill font training (untuk font bill Indonesia)
  async processImageWithBillFontTraining(imageFile: File | Blob, onProgress?: (progress: number) => void): Promise<OCRResult> {
    try {
      console.log('Starting OCR processing with bill font training...', { 
        fileType: imageFile instanceof File ? imageFile.type : 'blob',
        fileSize: imageFile instanceof File ? imageFile.size : 'unknown'
      });

      // Use bill font training service
      const result = await this.billFontTrainingService.processImageWithBillFontTraining(imageFile, onProgress);
      
      console.log('Bill font training OCR completed', {
        productsFound: result.products.length,
        totalAmount: result.totalAmount,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      console.error('Bill font training OCR error:', error);
      throw new Error(`Bill font training OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Method untuk proses gambar dengan advanced OCR training
  async processImageWithAdvancedTraining(imageFile: File | Blob, _onProgress?: (progress: number) => void): Promise<{
    ocrResult: OCRResult;
    trainingData: any;
    feedback: any;
    recommendations: string[];
  }> {
    try {
      console.log('Starting advanced OCR training...', {
        fileType: imageFile instanceof File ? imageFile.type : 'blob',
        fileSize: imageFile instanceof File ? imageFile.size : 'unknown'
      });
      
      const result = await this.advancedOCRTrainingService.processImageWithAdvancedTraining(imageFile);
      
      // Convert training data to OCRResult format
      const ocrResult: OCRResult = {
        rawText: 'OCR processed text',
        products: result.trainingData.products.map((p: any) => ({
          name: p.name,
          quantity: p.quantity,
          price: p.price,
          confidence: p.confidence,
          isValidated: false,
          isMarked: false
        })),
        totalAmount: result.trainingData.products.reduce((sum: number, p: any) => sum + (p.quantity * p.price), 0),
        confidence: result.feedback.accuracy,
        textBlocks: [],
        validationSummary: {
          totalProducts: result.trainingData.products.length,
          validatedProducts: 0,
          markedProducts: 0,
          needsReview: result.trainingData.products.length
        }
      };
      
      console.log('Advanced OCR training completed', {
        productsFound: result.trainingData.products.length,
        totalAmount: ocrResult.totalAmount,
        accuracy: result.feedback.accuracy,
        qualityScore: result.trainingData.trainingMetadata.qualityScore,
        recommendations: result.recommendations.length
      });
      
      return {
        ocrResult,
        trainingData: result.trainingData,
        feedback: result.feedback,
        recommendations: result.recommendations
      };
    } catch (error) {
      console.error('Advanced OCR training error:', error);
      throw new Error(`Advanced OCR training failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Method untuk cleanup worker
  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
    // Cleanup training services
    await this.trainingService.cleanup();
    await this.invoiceTrainingService.cleanup();
    await this.billFontTrainingService.cleanup();
    this.advancedOCRTrainingService.cleanup();
  }
}
