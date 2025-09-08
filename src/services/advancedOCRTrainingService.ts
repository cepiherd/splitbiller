import { AdvancedImagePreprocessing } from './advancedImagePreprocessing';
import type { PreprocessingOptions, PreprocessingResult } from './advancedImagePreprocessing';
import { BillFontTrainingService } from './billFontTrainingService';

export interface TrainingData {
  imageUrl: string;
  originalText: string;
  processedText: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    characterRegions: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      character: string;
      confidence: number;
    }>;
  }>;
  preprocessingResult: PreprocessingResult;
  trainingMetadata: {
    timestamp: string;
    preprocessingOptions: PreprocessingOptions;
    qualityScore: number;
    characterCount: number;
    textLineCount: number;
    skewAngle: number;
    noiseLevel: number;
    contrastLevel: number;
  };
}

export interface TrainingFeedback {
  accuracy: number;
  improvements: string[];
  suggestions: string[];
  characterCorrections: Array<{
    original: string;
    corrected: string;
    confidence: number;
    context: string;
  }>;
  patternSuggestions: Array<{
    pattern: string;
    confidence: number;
    description: string;
  }>;
}

export class AdvancedOCRTrainingService {
  private static instance: AdvancedOCRTrainingService;
  private preprocessingService: AdvancedImagePreprocessing;
  private billFontService: BillFontTrainingService;
  private trainingData: TrainingData[] = [];
  private feedbackHistory: TrainingFeedback[] = [];

  private constructor() {
    this.preprocessingService = AdvancedImagePreprocessing.getInstance();
    this.billFontService = BillFontTrainingService.getInstance();
  }

  public static getInstance(): AdvancedOCRTrainingService {
    if (!AdvancedOCRTrainingService.instance) {
      AdvancedOCRTrainingService.instance = new AdvancedOCRTrainingService();
    }
    return AdvancedOCRTrainingService.instance;
  }

  /**
   * Advanced OCR training dengan preprocessing yang canggih
   */
  public async processImageWithAdvancedTraining(
    imageFile: File | Blob,
    options: PreprocessingOptions = {
      enableAdaptiveThresholding: true,
      enableNoiseReduction: true,
      enableContrastEnhancement: true,
      enableSkewCorrection: true,
      enableCharacterSegmentation: true,
      enableEdgeDetection: true,
      enableMorphologicalOperations: true,
      kernelSize: 3,
      iterations: 2
    }
  ): Promise<{
    trainingData: TrainingData;
    feedback: TrainingFeedback;
    recommendations: string[];
  }> {
    console.log('Starting advanced OCR training...', options);

    try {
      // Step 1: Advanced preprocessing
      const preprocessingResult = await this.preprocessingService.preprocessImage(imageFile, options);
      console.log('Preprocessing completed:', {
        qualityScore: preprocessingResult.qualityScore,
        characterRegions: preprocessingResult.characterRegions.length,
        textLines: preprocessingResult.textLines.length,
        skewAngle: preprocessingResult.skewAngle,
        noiseLevel: preprocessingResult.noiseLevel,
        contrastLevel: preprocessingResult.contrastLevel
      });

      // Step 2: Convert processed image back to file for OCR
      const processedImageFile = await this.imageDataToFile(preprocessingResult.processedImage);
      
      // Step 3: Run Bill Font Training OCR
      const ocrResult = await this.billFontService.processImageWithBillFontTraining(processedImageFile);
      console.log('OCR completed:', {
        productsFound: ocrResult.products.length,
        totalAmount: ocrResult.totalAmount,
        confidence: ocrResult.confidence
      });

      // Step 4: Map OCR results to character regions
      const mappedProducts = this.mapProductsToCharacterRegions(
        ocrResult.products.map(p => ({
          name: p.name,
          quantity: p.quantity,
          price: p.price,
          confidence: p.confidence || 0.8 // Default confidence if not provided
        })),
        preprocessingResult.characterRegions,
        preprocessingResult.textLines
      );

      // Step 5: Create training data
      const trainingData: TrainingData = {
        imageUrl: URL.createObjectURL(imageFile),
        originalText: this.extractTextFromImageData(preprocessingResult.originalImage),
        processedText: this.extractTextFromImageData(preprocessingResult.processedImage),
        products: mappedProducts,
        preprocessingResult,
        trainingMetadata: {
          timestamp: new Date().toISOString(),
          preprocessingOptions: options,
          qualityScore: preprocessingResult.qualityScore,
          characterCount: preprocessingResult.characterRegions.length,
          textLineCount: preprocessingResult.textLines.length,
          skewAngle: preprocessingResult.skewAngle,
          noiseLevel: preprocessingResult.noiseLevel,
          contrastLevel: preprocessingResult.contrastLevel
        }
      };

      // Step 6: Generate feedback and recommendations
      const feedback = this.generateTrainingFeedback(trainingData);
      const recommendations = this.generateRecommendations(trainingData, feedback);

      // Step 7: Store training data
      this.trainingData.push(trainingData);
      this.feedbackHistory.push(feedback);

      console.log('Advanced OCR training completed:', {
        trainingDataId: trainingData.trainingMetadata.timestamp,
        accuracy: feedback.accuracy,
        improvements: feedback.improvements.length,
        recommendations: recommendations.length
      });

      return {
        trainingData,
        feedback,
        recommendations
      };

    } catch (error) {
      console.error('Advanced OCR training error:', error);
      throw new Error(`Advanced OCR training failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert ImageData to File
   */
  private async imageDataToFile(imageData: ImageData): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx.putImageData(imageData, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], 'processed-image.png', { type: 'image/png' }));
        }
      }, 'image/png');
    });
  }

  /**
   * Extract text from ImageData (simplified)
   */
  private extractTextFromImageData(_imageData: ImageData): string {
    // This is a simplified text extraction
    // In a real implementation, you would use OCR here
    return 'Extracted text from image data';
  }

  /**
   * Map OCR products to character regions
   */
  private mapProductsToCharacterRegions(
    products: Array<{
      name: string;
      quantity: number;
      price: number;
      confidence: number;
    }>,
    characterRegions: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
      character: string;
    }>,
    textLines: Array<{
      y: number;
      height: number;
      characters: number;
      confidence: number;
    }>
  ): Array<{
    name: string;
    quantity: number;
    price: number;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    characterRegions: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      character: string;
      confidence: number;
    }>;
  }> {
    return products.map((product, index) => {
      // Find corresponding text line
      const textLine = textLines[index] || textLines[0];
      
      // Find character regions in this line
      const productCharacterRegions = characterRegions.filter(region => 
        region.y >= textLine.y && region.y <= textLine.y + textLine.height
      );

      // Calculate bounding box
      const boundingBox = this.calculateBoundingBox(productCharacterRegions);

      return {
        ...product,
        boundingBox,
        characterRegions: productCharacterRegions
      };
    });
  }

  /**
   * Calculate bounding box from character regions
   */
  private calculateBoundingBox(characterRegions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (characterRegions.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const minX = Math.min(...characterRegions.map(r => r.x));
    const maxX = Math.max(...characterRegions.map(r => r.x + r.width));
    const minY = Math.min(...characterRegions.map(r => r.y));
    const maxY = Math.max(...characterRegions.map(r => r.y + r.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Generate training feedback
   */
  private generateTrainingFeedback(trainingData: TrainingData): TrainingFeedback {
    const { preprocessingResult, products } = trainingData;
    
    // Calculate accuracy based on various factors
    const qualityScore = preprocessingResult.qualityScore;
    const characterConfidence = preprocessingResult.characterRegions.reduce(
      (sum, region) => sum + region.confidence, 0
    ) / preprocessingResult.characterRegions.length;
    
    const productConfidence = products.reduce(
      (sum, product) => sum + product.confidence, 0
    ) / products.length;

    const accuracy = (qualityScore + characterConfidence + productConfidence) / 3;

    // Generate improvements
    const improvements: string[] = [];
    if (preprocessingResult.skewAngle > 2) {
      improvements.push('Consider improving image alignment - skew detected');
    }
    if (preprocessingResult.noiseLevel > 0.3) {
      improvements.push('High noise level detected - consider better image quality');
    }
    if (preprocessingResult.contrastLevel < 0.5) {
      improvements.push('Low contrast detected - consider lighting improvements');
    }
    if (characterConfidence < 0.7) {
      improvements.push('Character recognition confidence is low - consider preprocessing adjustments');
    }

    // Generate suggestions
    const suggestions: string[] = [];
    if (preprocessingResult.characterRegions.length < 50) {
      suggestions.push('Consider increasing character segmentation sensitivity');
    }
    if (preprocessingResult.textLines.length < 3) {
      suggestions.push('Consider adjusting text line detection parameters');
    }
    if (products.length === 0) {
      suggestions.push('No products detected - consider adjusting product detection patterns');
    }

    // Generate character corrections
    const characterCorrections = this.generateCharacterCorrections(products, preprocessingResult.characterRegions);

    // Generate pattern suggestions
    const patternSuggestions = this.generatePatternSuggestions(products, preprocessingResult.characterRegions);

    return {
      accuracy,
      improvements,
      suggestions,
      characterCorrections,
      patternSuggestions
    };
  }

  /**
   * Generate character corrections
   */
  private generateCharacterCorrections(
    _products: Array<{ name: string; confidence: number }>,
    characterRegions: Array<{ character: string; confidence: number }>
  ): Array<{
    original: string;
    corrected: string;
    confidence: number;
    context: string;
  }> {
    const corrections: Array<{
      original: string;
      corrected: string;
      confidence: number;
      context: string;
    }> = [];

    // Analyze low-confidence characters
    const lowConfidenceCharacters = characterRegions.filter(region => region.confidence < 0.7);
    
    for (const region of lowConfidenceCharacters) {
      const possibleCorrections = this.getPossibleCharacterCorrections(region.character);
      
      for (const correction of possibleCorrections) {
        corrections.push({
          original: region.character,
          corrected: correction,
          confidence: region.confidence,
          context: 'Low confidence character recognition'
        });
      }
    }

    return corrections;
  }

  /**
   * Get possible character corrections
   */
  private getPossibleCharacterCorrections(character: string): string[] {
    const corrections: string[] = [];
    
    // Common OCR misreads
    const commonMistakes: { [key: string]: string[] } = {
      '0': ['O', 'o', 'Q'],
      '1': ['l', 'I', '|'],
      '2': ['Z', 'z'],
      '3': ['E', 'B'],
      '4': ['A'],
      '5': ['S', 's'],
      '6': ['G', 'b'],
      '7': ['T', 't'],
      '8': ['B', 'g'],
      '9': ['g', 'q'],
      'A': ['4', 'H'],
      'B': ['8', '3'],
      'C': ['G', 'O'],
      'D': ['O', '0'],
      'E': ['3', 'F'],
      'F': ['E', 'P'],
      'G': ['6', 'C'],
      'H': ['A', 'N'],
      'I': ['1', 'l'],
      'J': ['T', 'L'],
      'K': ['X', 'H'],
      'L': ['I', 'J'],
      'M': ['N', 'W'],
      'N': ['M', 'H'],
      'O': ['0', 'C'],
      'P': ['F', 'R'],
      'Q': ['O', '0'],
      'R': ['P', 'B'],
      'S': ['5', 's'],
      'T': ['7', 'J'],
      'U': ['V', 'Y'],
      'V': ['U', 'Y'],
      'W': ['M', 'N'],
      'X': ['K', 'Y'],
      'Y': ['V', 'U'],
      'Z': ['2', 'z']
    };

    if (commonMistakes[character]) {
      corrections.push(...commonMistakes[character]);
    }

    return corrections;
  }

  /**
   * Generate pattern suggestions
   */
  private generatePatternSuggestions(
    products: Array<{ name: string; confidence: number }>,
    characterRegions: Array<{ character: string; confidence: number }>
  ): Array<{
    pattern: string;
    confidence: number;
    description: string;
  }> {
    const suggestions: Array<{
      pattern: string;
      confidence: number;
      description: string;
    }> = [];

    // Analyze product name patterns
    for (const product of products) {
      if (product.confidence < 0.8) {
        const pattern = this.extractPattern(product.name);
        suggestions.push({
          pattern,
          confidence: product.confidence,
          description: `Consider adding pattern for product: ${product.name}`
        });
      }
    }

    // Analyze character patterns
    const characterPatterns = this.analyzeCharacterPatterns(characterRegions);
    for (const pattern of characterPatterns) {
      suggestions.push({
        pattern: pattern.pattern,
        confidence: pattern.confidence,
        description: `Character pattern detected: ${pattern.description}`
      });
    }

    return suggestions;
  }

  /**
   * Extract pattern from text
   */
  private extractPattern(text: string): string {
    // Simple pattern extraction - in real implementation, this would be more sophisticated
    return text.replace(/[a-zA-Z]/g, 'A').replace(/[0-9]/g, 'N');
  }

  /**
   * Analyze character patterns
   */
  private analyzeCharacterPatterns(
    characterRegions: Array<{ character: string; confidence: number }>
  ): Array<{
    pattern: string;
    confidence: number;
    description: string;
  }> {
    const patterns: Array<{
      pattern: string;
      confidence: number;
      description: string;
    }> = [];

    // Group characters by confidence
    const highConfidence = characterRegions.filter(r => r.confidence > 0.8);
    const lowConfidence = characterRegions.filter(r => r.confidence < 0.5);

    if (highConfidence.length > 0) {
      patterns.push({
        pattern: highConfidence.map(r => r.character).join(''),
        confidence: highConfidence.reduce((sum, r) => sum + r.confidence, 0) / highConfidence.length,
        description: 'High confidence character sequence'
      });
    }

    if (lowConfidence.length > 0) {
      patterns.push({
        pattern: lowConfidence.map(r => r.character).join(''),
        confidence: lowConfidence.reduce((sum, r) => sum + r.confidence, 0) / lowConfidence.length,
        description: 'Low confidence character sequence - needs attention'
      });
    }

    return patterns;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    trainingData: TrainingData,
    feedback: TrainingFeedback
  ): string[] {
    const recommendations: string[] = [];

    // Quality-based recommendations
    if (trainingData.trainingMetadata.qualityScore < 70) {
      recommendations.push('Consider improving image quality before processing');
    }

    if (trainingData.trainingMetadata.skewAngle > 2) {
      recommendations.push('Use image alignment tools to correct skew');
    }

    if (trainingData.trainingMetadata.noiseLevel > 0.3) {
      recommendations.push('Apply noise reduction filters');
    }

    if (trainingData.trainingMetadata.contrastLevel < 0.5) {
      recommendations.push('Enhance image contrast');
    }

    // Accuracy-based recommendations
    if (feedback.accuracy < 0.8) {
      recommendations.push('Consider adjusting preprocessing parameters');
    }

    if (feedback.characterCorrections.length > 0) {
      recommendations.push('Add character correction mappings for common misreads');
    }

    if (feedback.patternSuggestions.length > 0) {
      recommendations.push('Consider adding new pattern recognition rules');
    }

    // Product detection recommendations
    if (trainingData.products.length === 0) {
      recommendations.push('Adjust product detection patterns - no products found');
    }

    if (trainingData.products.some(p => p.confidence < 0.7)) {
      recommendations.push('Improve product name recognition patterns');
    }

    return recommendations;
  }

  /**
   * Get training statistics
   */
  public getTrainingStatistics(): {
    totalTrainingSessions: number;
    averageAccuracy: number;
    averageQualityScore: number;
    commonIssues: string[];
    improvementTrend: number;
  } {
    if (this.trainingData.length === 0) {
      return {
        totalTrainingSessions: 0,
        averageAccuracy: 0,
        averageQualityScore: 0,
        commonIssues: [],
        improvementTrend: 0
      };
    }

    const averageAccuracy = this.feedbackHistory.reduce(
      (sum, feedback) => sum + feedback.accuracy, 0
    ) / this.feedbackHistory.length;

    const averageQualityScore = this.trainingData.reduce(
      (sum, data) => sum + data.trainingMetadata.qualityScore, 0
    ) / this.trainingData.length;

    const commonIssues = this.feedbackHistory
      .flatMap(feedback => feedback.improvements)
      .reduce((acc, issue) => {
        acc[issue] = (acc[issue] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

    const sortedIssues = Object.entries(commonIssues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);

    // Calculate improvement trend (simplified)
    const recentAccuracy = this.feedbackHistory
      .slice(-5)
      .reduce((sum, feedback) => sum + feedback.accuracy, 0) / Math.min(5, this.feedbackHistory.length);
    
    const olderAccuracy = this.feedbackHistory
      .slice(0, -5)
      .reduce((sum, feedback) => sum + feedback.accuracy, 0) / Math.max(1, this.feedbackHistory.length - 5);

    const improvementTrend = recentAccuracy - olderAccuracy;

    return {
      totalTrainingSessions: this.trainingData.length,
      averageAccuracy,
      averageQualityScore,
      commonIssues: sortedIssues,
      improvementTrend
    };
  }

  /**
   * Export training data
   */
  public exportTrainingData(): string {
    const exportData = {
      trainingData: this.trainingData,
      feedbackHistory: this.feedbackHistory,
      statistics: this.getTrainingStatistics(),
      exportTimestamp: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear training data
   */
  public clearTrainingData(): void {
    this.trainingData = [];
    this.feedbackHistory = [];
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.preprocessingService.cleanup();
    this.billFontService.cleanup();
  }
}
