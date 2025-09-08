import { createWorker } from 'tesseract.js';
import type { OCRResult, OCRProduct } from '../types/bill';

export interface InvoiceTrainingData {
  language: string;
  characterWhitelist: string;
  commonPatterns: string[];
  productPatterns: RegExp[];
  pricePatterns: RegExp[];
  contextKeywords: string[];
}

export class InvoiceOCRTrainingService {
  private static instance: InvoiceOCRTrainingService;
  private worker: any = null;
  private trainingData: InvoiceTrainingData;

  private constructor() {
    this.trainingData = this.initializeTrainingData();
  }

  static getInstance(): InvoiceOCRTrainingService {
    if (!InvoiceOCRTrainingService.instance) {
      InvoiceOCRTrainingService.instance = new InvoiceOCRTrainingService();
    }
    return InvoiceOCRTrainingService.instance;
  }

  // Initialize training data specifically for invoices/receipts
  private initializeTrainingData(): InvoiceTrainingData {
    return {
      language: 'eng',
      characterWhitelist: this.getInvoiceCharacterWhitelist(),
      commonPatterns: this.getCommonInvoicePatterns(),
      productPatterns: this.getProductPatterns(),
      pricePatterns: this.getPricePatterns(),
      contextKeywords: this.getContextKeywords()
    };
  }

  // Character whitelist optimized for invoice text
  private getInvoiceCharacterWhitelist(): string {
    return [
      // Letters (uppercase and lowercase)
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      // Numbers
      '0123456789',
      // Currency and math symbols
      '.,:;@x=-+()[]{}',
      // Common invoice symbols
      'Rp$€£¥',
      // Space and punctuation
      ' \t\n\r',
      // Special invoice characters
      '|/\\_~`'
    ].join('');
  }

  // Common patterns found in invoices
  private getCommonInvoicePatterns(): string[] {
    return [
      // Date patterns
      'Tanggal:', 'Date:', 'Tgl:',
      'Jam:', 'Time:', 'Waktu:',
      // Customer patterns
      'Nama Tamu:', 'Customer:', 'Pelanggan:',
      'Kasir:', 'Cashier:', 'Staff:',
      // Product patterns
      'Produk:', 'Item:', 'Barang:',
      'Qty:', 'Quantity:', 'Jumlah:',
      'Harga:', 'Price:', 'Biaya:',
      // Total patterns
      'Sub Total:', 'Subtotal:', 'Sub-total:',
      'Pajak:', 'Tax:', 'VAT:',
      'Total Bill:', 'Total:', 'Grand Total:',
      'Pembulatan:', 'Rounding:', 'Bulat:',
      // Payment patterns
      'Cash:', 'Tunai:', 'Bayar:',
      'Kembali:', 'Change:', 'Kembalian:',
      // Footer patterns
      'Terima Kasih', 'Thank You', 'Thanks',
      'Kritik dan Keluhan', 'Complaints', 'Feedback',
      'Survey Kepuasan', 'Satisfaction Survey'
    ];
  }

  // Product-specific patterns
  private getProductPatterns(): RegExp[] {
    return [
      // Indonesian product patterns
      /^[A-Z\s]+:\s*\d+\s*x\s*@?\s*[\d.,]+\s*=\s*[\d.,]+$/i, // "PRODUCT: qty x @ price = total"
      /^[A-Z\s]+\s+\d+\s+[\d.,]+$/i, // "PRODUCT qty price"
      /^[A-Z\s]+\s+\d+\s*x\s*@?\s*[\d.,]+\s*=\s*[\d.,]+$/i, // "PRODUCT qty x @ price = total"
      
      // English product patterns
      /^[A-Za-z\s]+:\s*\d+\s*x\s*@?\s*[\d.,]+\s*=\s*[\d.,]+$/i,
      /^[A-Za-z\s]+\s+\d+\s+[\d.,]+$/i,
      /^[A-Za-z\s]+\s+\d+\s*x\s*@?\s*[\d.,]+\s*=\s*[\d.,]+$/i,
      
      // Common food items (Indonesian)
      /^(ES\s+[A-Z\s]+|MIE\s+[A-Z\s]+|SIOMAY\s+[A-Z\s]+|TEA|KOPI|JUICE|SODA)/i,
      /^(UDANG\s+[A-Z\s]+|AYAM\s+[A-Z\s]+|DAGING\s+[A-Z\s]+|IKAN\s+[A-Z\s]+)/i,
      /^(NASI\s+[A-Z\s]+|MARTABAK|PIZZA|BURGER|SANDWICH)/i,
      
      // Common food items (English)
      /^(ICE\s+[A-Z\s]+|NOODLE\s+[A-Z\s]+|DIM\s+[A-Z\s]+|TEA|COFFEE|JUICE|SODA)/i,
      /^(SHRIMP\s+[A-Z\s]+|CHICKEN\s+[A-Z\s]+|BEEF\s+[A-Z\s]+|FISH\s+[A-Z\s]+)/i,
      /^(RICE\s+[A-Z\s]+|PIZZA|BURGER|SANDWICH|SALAD)/i
    ];
  }

  // Price-specific patterns
  private getPricePatterns(): RegExp[] {
    return [
      // Indonesian price patterns
      /Rp\s*[\d.,]+/g,
      /[\d.,]+\s*Rp/g,
      /[\d.,]+/g,
      
      // International price patterns
      /\$\s*[\d.,]+/g,
      /€\s*[\d.,]+/g,
      /£\s*[\d.,]+/g,
      /¥\s*[\d.,]+/g,
      
      // Quantity patterns
      /\d+\s*x\s*@?\s*[\d.,]+/g,
      /\d+\s*@\s*[\d.,]+/g,
      
      // Total patterns
      /Total\s*:?\s*[\d.,]+/gi,
      /Sub\s*Total\s*:?\s*[\d.,]+/gi,
      /Grand\s*Total\s*:?\s*[\d.,]+/gi
    ];
  }

  // Context keywords for better recognition
  private getContextKeywords(): string[] {
    return [
      // Invoice headers
      'INVOICE', 'RECEIPT', 'BILL', 'TAGIHAN', 'STRUK',
      'RESTAURANT', 'CAFE', 'SHOP', 'STORE', 'TOKO',
      
      // Product categories
      'FOOD', 'DRINK', 'BEVERAGE', 'MAKANAN', 'MINUMAN',
      'APPETIZER', 'MAIN', 'DESSERT', 'PEMBUKA', 'UTAMA', 'PENUTUP',
      
      // Payment terms
      'CASH', 'CARD', 'CREDIT', 'DEBIT', 'TUNAI', 'KARTU',
      'PAYMENT', 'PAY', 'BAYAR', 'PEMBAYARAN',
      
      // Common words that help OCR
      'ITEM', 'PRODUCT', 'BARANG', 'PRODUK',
      'QUANTITY', 'QTY', 'JUMLAH', 'BANYAK',
      'PRICE', 'HARGA', 'BIAYA', 'COST',
      'AMOUNT', 'TOTAL', 'JUMLAH', 'TOTAL'
    ];
  }

  // Initialize trained OCR worker
  async initializeTrainedWorker(): Promise<any> {
    if (this.worker) {
      return this.worker;
    }

    console.log('Initializing trained OCR worker for invoices...');
    
    this.worker = await createWorker(this.trainingData.language, 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`Trained OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Apply invoice-specific training parameters
    await this.applyInvoiceTraining();

    console.log('Trained OCR worker initialized successfully');
    return this.worker;
  }

  // Apply training parameters specific to invoices
  private async applyInvoiceTraining(): Promise<void> {
    if (!this.worker) return;

    try {
      // Set only valid Tesseract parameters
      await this.worker.setParameters({
        tessedit_pageseg_mode: '6', // Uniform block of text
        tessedit_ocr_engine_mode: '1', // LSTM OCR Engine
        tessedit_char_whitelist: this.trainingData.characterWhitelist,
        preserve_interword_spaces: '1', // Preserve spaces
        tessedit_do_invert: '0', // Don't invert image
        // Additional valid parameters for better invoice recognition
        classify_bln_numeric_mode: '1', // Better number recognition
        textord_min_linesize: '2.5', // Minimum line size for text
        textord_min_xheight: '8', // Minimum x-height for text
        textord_old_baselines: '1', // Use old baseline detection
        textord_old_xheight: '1', // Use old x-height detection
        textord_tabfind_show_vlines: '0', // Hide vertical lines
        textord_show_final_blobs: '0', // Hide final blobs
        textord_show_initial_blobs: '0', // Hide initial blobs
      });

      console.log('Invoice-specific training parameters applied successfully');
    } catch (error) {
      console.error('Error applying training parameters:', error);
      // Continue with default parameters if training fails
    }
  }

  // Process image with trained OCR
  async processImageWithTraining(imageFile: File | Blob, _onProgress?: (progress: number) => void): Promise<OCRResult> {
    try {
      // Initialize trained worker if not already done
      await this.initializeTrainedWorker();

      console.log('Processing image with trained OCR...', {
        fileType: imageFile instanceof File ? imageFile.type : 'blob',
        fileSize: imageFile instanceof File ? imageFile.size : 'unknown'
      });

      // Process image with trained worker
      const result = await this.worker.recognize(imageFile);
      const { text, confidence } = result.data;

      console.log('Trained OCR completed', {
        textLength: text.length,
        confidence: confidence,
        rawText: text.substring(0, 200) + '...'
      });

      // Apply post-processing with training data
      const processedText = this.postProcessText(text);
      const products = this.extractProductsWithTraining(processedText);
      const totalAmount = this.extractTotalAmountWithTraining(processedText);

      return {
        rawText: processedText,
        products: products,
        totalAmount: totalAmount || undefined,
        confidence: confidence,
        isFullyValidated: false,
        validationSummary: {
          totalProducts: products.length,
          validatedProducts: 0,
          markedProducts: 0,
          needsReview: products.length
        },
        textBlocks: [], // Will be populated by main OCR service
        imageDimensions: { width: 0, height: 0 } // Will be populated by main OCR service
      };

    } catch (error) {
      console.error('Trained OCR processing error:', error);
      throw new Error(`Trained OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Post-process text using training data
  private postProcessText(text: string): string {
    let processedText = text;

    // Apply character corrections based on context
    processedText = this.applyCharacterCorrections(processedText);
    
    // Apply pattern-based corrections
    processedText = this.applyPatternCorrections(processedText);
    
    // Clean up common OCR artifacts
    processedText = this.cleanupOCRArtifacts(processedText);

    return processedText;
  }

  // Apply character corrections based on training data
  private applyCharacterCorrections(text: string): string {
    let correctedText = text;

    // Common OCR mistakes for numbers
    correctedText = correctedText.replace(/\b0\b/g, 'O'); // 0 -> O in words
    correctedText = correctedText.replace(/\b1\b/g, 'I'); // 1 -> I in words
    correctedText = correctedText.replace(/\b5\b/g, 'S'); // 5 -> S in words
    correctedText = correctedText.replace(/\b6\b/g, 'G'); // 6 -> G in words
    correctedText = correctedText.replace(/\b8\b/g, 'B'); // 8 -> B in words

    // Common OCR mistakes for letters
    correctedText = correctedText.replace(/\b4\b/g, 'A'); // 4 -> A in words
    correctedText = correctedText.replace(/\b@\b/g, 'A'); // @ -> A in words
    correctedText = correctedText.replace(/\b\|\b/g, 'I'); // | -> I in words

    return correctedText;
  }

  // Apply pattern-based corrections
  private applyPatternCorrections(text: string): string {
    let correctedText = text;

    // Fix common pattern issues
    correctedText = correctedText.replace(/(\w+)\s*:\s*(\d+)\s*x\s*@?\s*([\d.,]+)\s*=\s*([\d.,]+)/g, '$1: $2 x @ $3 = $4');
    correctedText = correctedText.replace(/(\w+)\s+(\d+)\s+x\s+@?\s+([\d.,]+)\s+=\s+([\d.,]+)/g, '$1: $2 x @ $3 = $4');
    
    // Fix spacing issues
    correctedText = correctedText.replace(/\s+/g, ' '); // Normalize spaces
    correctedText = correctedText.replace(/\n\s+/g, '\n'); // Remove leading spaces from lines

    return correctedText;
  }

  // Clean up common OCR artifacts
  private cleanupOCRArtifacts(text: string): string {
    let cleanedText = text;

    // Remove common OCR artifacts
    cleanedText = cleanedText.replace(/[^\w\s.,:;@x=\-+()[\]{}]/g, ' '); // Remove special chars except receipt ones
    cleanedText = cleanedText.replace(/\s+/g, ' '); // Normalize spaces
    cleanedText = cleanedText.trim();

    return cleanedText;
  }

  // Extract products using training data
  private extractProductsWithTraining(text: string): OCRProduct[] {
    const products: OCRProduct[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Try each product pattern
      for (const pattern of this.trainingData.productPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const product = this.parseProductFromMatch(match, trimmedLine);
          if (product) {
            products.push(product);
            break; // Found a match, move to next line
          }
        }
      }
    }

    console.log('Extracted products with training:', {
      productsFound: products.length,
      products: products.map(p => ({ name: p.name, qty: p.quantity, price: p.price }))
    });

    return products;
  }

  // Parse product from regex match
  private parseProductFromMatch(match: RegExpMatchArray, _originalLine: string): OCRProduct | null {
    try {
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
        return null;
      }

      const cleanName = name.trim().replace(/^(.+?):\s*$/, '$1');
      const quantity = parseInt(qty);
      const cleanPrice = this.parsePrice(price);

      if (cleanName && !isNaN(quantity) && !isNaN(cleanPrice) && this.isValidProductName(cleanName)) {
        return {
          name: cleanName,
          quantity: quantity,
          price: cleanPrice,
          confidence: 0.9, // High confidence for training-based extraction
          isValidated: false,
          isMarked: false,
          validationNotes: undefined
        };
      }
    } catch (error) {
      console.error('Error parsing product from match:', error);
    }

    return null;
  }

  // Extract total amount using training data
  private extractTotalAmountWithTraining(text: string): number | null {
    for (const pattern of this.trainingData.pricePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const amount = this.parsePrice(match);
          if (amount > 0) {
            console.log('Found total amount with training:', { match, amount });
            return amount;
          }
        }
      }
    }

    console.log('No total amount found with training');
    return null;
  }

  // Parse price string to number
  private parsePrice(priceStr: string): number {
    if (!priceStr) return 0;
    
    // Remove currency symbols and spaces
    const cleaned = priceStr.replace(/[Rp$€£¥\s]/g, '');
    
    // Handle different decimal separators
    const normalized = cleaned.replace(/,/g, '.');
    
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Validate product name
  private isValidProductName(name: string): boolean {
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
      'receipt', 'struk', 'invoice', 'faktur', 'bill'
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

  // Get training data
  getTrainingData(): InvoiceTrainingData {
    return this.trainingData;
  }

  // Clean up worker
  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
