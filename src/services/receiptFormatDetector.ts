export interface ReceiptFormat {
  name: string;
  description: string;
  confidence: number;
  patterns: {
    header: RegExp[];
    product: RegExp[];
    total: RegExp[];
    footer: RegExp[];
  };
  optimizations: {
    pageSegMode: number;
    charWhitelist: string;
    additionalParams: Record<string, any>;
  };
}

export class ReceiptFormatDetector {
  private static instance: ReceiptFormatDetector;
  private formats: ReceiptFormat[] = [];

  private constructor() {
    this.initializeFormats();
  }

  static getInstance(): ReceiptFormatDetector {
    if (!ReceiptFormatDetector.instance) {
      ReceiptFormatDetector.instance = new ReceiptFormatDetector();
    }
    return ReceiptFormatDetector.instance;
  }

  private initializeFormats(): void {
    this.formats = [
      {
        name: 'Indonesian Receipt',
        description: 'Common Indonesian receipt format with colon separators',
        confidence: 0.9,
        patterns: {
          header: [
            /^Tanggal:?\s*\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/i,
            /^Jam:?\s*\d{2}:\d{2}:\d{2}/i,
            /^Nama\s+Tamu:?\s*.+/i,
            /^Kasir:?\s*.+/i
          ],
          product: [
            /^(.+?):\s*(\d+)\s*x\s*@?\s*([\d.,]+)\s*=\s*([\d.,]+)$/,
            /^(.+?)\s+(\d+)\s*x\s*@?\s*([\d.,]+)\s*=\s*([\d.,]+)$/
          ],
          total: [
            /^Sub\s+Total:?\s*([\d.,]+)/i,
            /^Pajak\s+\d+%:?\s*([\d.,]+)/i,
            /^Total\s+Bill:?\s*([\d.,]+)/i,
            /^Grand\s+Total:?\s*([\d.,]+)/i
          ],
          footer: [
            /^Terima\s+Kasih/i,
            /^Kritik\s+dan\s+Keluhan/i,
            /^Survey\s+Kepuasan/i
          ]
        },
        optimizations: {
          pageSegMode: 6,
          charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;@x=-+()[]{}',
          additionalParams: {
            tessedit_char_blacklist: '|',
            textord_min_linesize: '2.0',
            textord_min_xheight: '6'
          }
        }
      },
      {
        name: 'Restaurant Receipt',
        description: 'Standard restaurant receipt format',
        confidence: 0.8,
        patterns: {
          header: [
            /^Date:?\s*\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/i,
            /^Time:?\s*\d{2}:\d{2}/i,
            /^Table:?\s*\d+/i,
            /^Server:?\s*.+/i
          ],
          product: [
            /^(.+?)\s+(\d+)\s+x\s+@\s+([\d.,]+)\s+=\s+([\d.,]+)$/,
            /^(.+?)\s+(\d+)\s+x\s+([\d.,]+)\s+=\s+([\d.,]+)$/
          ],
          total: [
            /^Subtotal:?\s*([\d.,]+)/i,
            /^Tax:?\s*([\d.,]+)/i,
            /^Total:?\s*([\d.,]+)/i,
            /^Tip:?\s*([\d.,]+)/i
          ],
          footer: [
            /^Thank\s+you/i,
            /^Please\s+come\s+again/i,
            /^Gratuity/i
          ]
        },
        optimizations: {
          pageSegMode: 6,
          charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;@x=-+()[]{}',
          additionalParams: {
            textord_min_linesize: '2.5',
            textord_min_xheight: '8'
          }
        }
      },
      {
        name: 'Retail Receipt',
        description: 'Standard retail store receipt format',
        confidence: 0.7,
        patterns: {
          header: [
            /^Store:?\s*.+/i,
            /^Address:?\s*.+/i,
            /^Phone:?\s*.+/i,
            /^Receipt\s+#:?\s*.+/i
          ],
          product: [
            /^(.+?)\s+(\d+)\s+x\s+([\d.,]+)\s+=\s+([\d.,]+)$/,
            /^(.+?)\s+([\d.,]+)$/
          ],
          total: [
            /^Subtotal:?\s*([\d.,]+)/i,
            /^Tax:?\s*([\d.,]+)/i,
            /^Total:?\s*([\d.,]+)/i,
            /^Amount\s+Paid:?\s*([\d.,]+)/i
          ],
          footer: [
            /^Thank\s+you\s+for\s+shopping/i,
            /^Return\s+policy/i,
            /^Customer\s+service/i
          ]
        },
        optimizations: {
          pageSegMode: 6,
          charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;@x=-+()[]{}',
          additionalParams: {
            textord_min_linesize: '2.0',
            textord_min_xheight: '6'
          }
        }
      },
      {
        name: 'Generic Receipt',
        description: 'Generic receipt format with basic patterns',
        confidence: 0.5,
        patterns: {
          header: [
            /^.{1,50}$/ // Any line as potential header
          ],
          product: [
            /^(.+?)\s+(\d+)\s+x\s+([\d.,]+)\s+=\s+([\d.,]+)$/,
            /^(.+?)\s+([\d.,]+)$/
          ],
          total: [
            /total:?\s*([\d.,]+)/i,
            /amount:?\s*([\d.,]+)/i,
            /sum:?\s*([\d.,]+)/i
          ],
          footer: [
            /^.{1,50}$/ // Any line as potential footer
          ]
        },
        optimizations: {
          pageSegMode: 6,
          charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;@x=-+()[]{}',
          additionalParams: {}
        }
      }
    ];
  }

  // Detect receipt format based on text content
  detectFormat(text: string): ReceiptFormat {
    const lines = text.split('\n');
    let bestFormat: ReceiptFormat = this.formats[this.formats.length - 1]; // Default to generic
    let bestScore = 0;

    for (const format of this.formats) {
      let score = 0;
      let totalChecks = 0;

      // Check header patterns
      for (const pattern of format.patterns.header) {
        totalChecks++;
        if (lines.some(line => pattern.test(line.trim()))) {
          score += 1;
        }
      }

      // Check product patterns
      for (const pattern of format.patterns.product) {
        totalChecks++;
        if (lines.some(line => pattern.test(line.trim()))) {
          score += 2; // Products are more important
        }
      }

      // Check total patterns
      for (const pattern of format.patterns.total) {
        totalChecks++;
        if (lines.some(line => pattern.test(line.trim()))) {
          score += 1.5; // Totals are important
        }
      }

      // Check footer patterns
      for (const pattern of format.patterns.footer) {
        totalChecks++;
        if (lines.some(line => pattern.test(line.trim()))) {
          score += 0.5; // Footer is less important
        }
      }

      // Calculate final score
      const finalScore = totalChecks > 0 ? (score / totalChecks) * format.confidence : 0;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestFormat = format;
      }
    }

    console.log('Receipt format detected:', {
      format: bestFormat.name,
      confidence: bestScore,
      description: bestFormat.description
    });

    return bestFormat;
  }

  // Get optimized OCR parameters for detected format
  getOptimizedParameters(format: ReceiptFormat): Record<string, any> {
    return {
      tessedit_pageseg_mode: format.optimizations.pageSegMode,
      tessedit_ocr_engine_mode: 1,
      tessedit_char_whitelist: format.optimizations.charWhitelist,
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0',
      ...format.optimizations.additionalParams
    };
  }

  // Get all available formats
  getAvailableFormats(): ReceiptFormat[] {
    return this.formats;
  }
}
