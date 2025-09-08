import { createWorker } from 'tesseract.js';

export interface ReceiptPattern {
  name: string;
  description: string;
  patterns: RegExp[];
  confidence: number;
}

export interface CharacterTraining {
  character: string;
  variations: string[];
  context: string[];
}

export class OCRTrainingService {
  private static instance: OCRTrainingService;
  private worker: any = null;
  private receiptPatterns: ReceiptPattern[] = [];
  private characterTraining: CharacterTraining[] = [];

  private constructor() {
    this.initializeReceiptPatterns();
    this.initializeCharacterTraining();
  }

  static getInstance(): OCRTrainingService {
    if (!OCRTrainingService.instance) {
      OCRTrainingService.instance = new OCRTrainingService();
    }
    return OCRTrainingService.instance;
  }

  // Initialize common receipt patterns for better recognition
  private initializeReceiptPatterns(): void {
    this.receiptPatterns = [
      {
        name: 'Product Line with Quantity and Price',
        description: 'Format: PRODUCT NAME: qty x @ price = total',
        patterns: [
          /^(.+?):\s*(\d+)\s*x\s*@?\s*([\d.,]+)\s*=\s*([\d.,]+)$/,
          /^(.+?)\s+(\d+)\s*x\s*@?\s*([\d.,]+)\s*=\s*([\d.,]+)$/,
          /^(.+?)\s+(\d+)\s+x\s+@?\s+([\d.,]+)\s+=\s+([\d.,]+)$/,
        ],
        confidence: 0.9
      },
      {
        name: 'Product with Total Only',
        description: 'Format: PRODUCT NAME total',
        patterns: [
          /^(.+?)\s+([\d.,]+)$/,
          /^(.+?)\s+([\d.,]+)\s*$/,
        ],
        confidence: 0.7
      },
      {
        name: 'Quantity and Price',
        description: 'Format: qty x @ price',
        patterns: [
          /^(\d+)\s*x\s*@?\s*([\d.,]+)$/,
          /^(\d+)\s+x\s+@?\s+([\d.,]+)$/,
        ],
        confidence: 0.8
      },
      {
        name: 'Total Amount',
        description: 'Format: Total: amount or Total amount',
        patterns: [
          /^Total:?\s*([\d.,]+)$/i,
          /^Grand\s+Total:?\s*([\d.,]+)$/i,
          /^Sub\s+Total:?\s*([\d.,]+)$/i,
        ],
        confidence: 0.9
      },
      {
        name: 'Tax Information',
        description: 'Format: Tax/Pajak: amount',
        patterns: [
          /^(?:Tax|Pajak):?\s*([\d.,]+)$/i,
          /^(?:VAT|PPN):?\s*([\d.,]+)$/i,
        ],
        confidence: 0.8
      }
    ];
  }

  // Initialize character training for common receipt characters
  private initializeCharacterTraining(): void {
    this.characterTraining = [
      // Numbers with common OCR mistakes
      { character: '0', variations: ['O', 'o', 'Q'], context: ['price', 'quantity'] },
      { character: '1', variations: ['l', 'I', '|'], context: ['quantity', 'price'] },
      { character: '2', variations: ['Z', 'z'], context: ['quantity', 'price'] },
      { character: '5', variations: ['S', 's'], context: ['price'] },
      { character: '6', variations: ['G', 'g'], context: ['price'] },
      { character: '8', variations: ['B', 'b'], context: ['price'] },
      { character: '9', variations: ['g', 'q'], context: ['price'] },
      
      // Letters with common OCR mistakes
      { character: 'A', variations: ['4', '@'], context: ['product_name'] },
      { character: 'B', variations: ['8', '6'], context: ['product_name'] },
      { character: 'C', variations: ['G', 'O'], context: ['product_name'] },
      { character: 'D', variations: ['0', 'O'], context: ['product_name'] },
      { character: 'E', variations: ['F', '3'], context: ['product_name'] },
      { character: 'F', variations: ['E', 'P'], context: ['product_name'] },
      { character: 'G', variations: ['6', 'C'], context: ['product_name'] },
      { character: 'H', variations: ['N', 'M'], context: ['product_name'] },
      { character: 'I', variations: ['1', 'l'], context: ['product_name'] },
      { character: 'J', variations: ['T', '7'], context: ['product_name'] },
      { character: 'K', variations: ['X', 'R'], context: ['product_name'] },
      { character: 'L', variations: ['1', 'I'], context: ['product_name'] },
      { character: 'M', variations: ['N', 'W'], context: ['product_name'] },
      { character: 'N', variations: ['M', 'H'], context: ['product_name'] },
      { character: 'O', variations: ['0', 'Q'], context: ['product_name'] },
      { character: 'P', variations: ['F', 'R'], context: ['product_name'] },
      { character: 'Q', variations: ['O', '0'], context: ['product_name'] },
      { character: 'R', variations: ['P', 'K'], context: ['product_name'] },
      { character: 'S', variations: ['5', '8'], context: ['product_name'] },
      { character: 'T', variations: ['7', 'J'], context: ['product_name'] },
      { character: 'U', variations: ['V', 'Y'], context: ['product_name'] },
      { character: 'V', variations: ['U', 'Y'], context: ['product_name'] },
      { character: 'W', variations: ['M', 'VV'], context: ['product_name'] },
      { character: 'X', variations: ['K', 'Y'], context: ['product_name'] },
      { character: 'Y', variations: ['V', 'X'], context: ['product_name'] },
      { character: 'Z', variations: ['2', '7'], context: ['product_name'] },
      
      // Special characters
      { character: '@', variations: ['A', '4'], context: ['price'] },
      { character: 'x', variations: ['X', '*'], context: ['quantity'] },
      { character: '=', variations: ['-', '—'], context: ['price'] },
      { character: ':', variations: [';', '.'], context: ['separator'] },
      { character: '.', variations: [',', '·'], context: ['decimal'] },
      { character: ',', variations: ['.', '·'], context: ['thousands'] },
    ];
  }

  // Train OCR with receipt-specific patterns
  async trainForReceipts(): Promise<void> {
    if (!this.worker) {
      this.worker = await createWorker('eng', 1);
    }

    // Set receipt-specific parameters
    await this.worker.setParameters({
      tessedit_pageseg_mode: '6', // Uniform block of text
      tessedit_ocr_engine_mode: '1', // LSTM OCR Engine
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;@x=-+()[]{}',
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0',
      // Receipt-specific optimizations
      classify_bln_numeric_mode: '1', // Better number recognition
      textord_min_linesize: '2.5', // Minimum line size for text
      textord_min_xheight: '8', // Minimum x-height for text
      textord_old_baselines: '1', // Use old baseline detection
      textord_old_xheight: '1', // Use old x-height detection
      textord_tabfind_show_vlines: '0', // Hide vertical lines
      textord_show_final_blobs: '0', // Hide final blobs
      textord_show_initial_blobs: '0', // Hide initial blobs
    });

    console.log('OCR trained for receipt recognition');
  }

  // Apply character correction based on training
  correctCharacters(text: string, context: string = 'general'): string {
    let correctedText = text;
    
    this.characterTraining.forEach(training => {
      training.variations.forEach(variation => {
        if (training.context.includes(context) || training.context.includes('general')) {
          // Create regex to match the variation in context
          const regex = new RegExp(`\\b${variation}\\b`, 'g');
          correctedText = correctedText.replace(regex, training.character);
        }
      });
    });

    return correctedText;
  }

  // Apply receipt pattern recognition
  recognizeReceiptPatterns(text: string): { pattern: ReceiptPattern | null; confidence: number } {
    for (const pattern of this.receiptPatterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(text)) {
          return { pattern, confidence: pattern.confidence };
        }
      }
    }
    return { pattern: null, confidence: 0 };
  }

  // Preprocess text for better receipt recognition
  preprocessReceiptText(text: string): string {
    let processedText = text;
    
    // Remove common OCR artifacts
    processedText = processedText.replace(/\|/g, 'I'); // Replace | with I
    processedText = processedText.replace(/[^\w\s.,:;@x=\-+()[\]{}]/g, ' '); // Remove special chars except receipt ones
    processedText = processedText.replace(/\s+/g, ' '); // Normalize spaces
    
    // Apply character corrections
    processedText = this.correctCharacters(processedText, 'product_name');
    
    return processedText;
  }

  // Get optimized OCR parameters for receipts
  getReceiptOCRParameters(): any {
    return {
      tessedit_pageseg_mode: '6', // Uniform block of text
      tessedit_ocr_engine_mode: '1', // LSTM OCR Engine
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;@x=-+()[]{}',
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0',
      classify_bln_numeric_mode: '1',
      textord_min_linesize: '2.5',
      textord_min_xheight: '8',
      textord_old_baselines: '1',
      textord_old_xheight: '1',
      textord_tabfind_show_vlines: '0',
      textord_show_final_blobs: '0',
      textord_show_initial_blobs: '0',
    };
  }

  // Clean up worker
  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
