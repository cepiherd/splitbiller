// Explicit exports to fix import issues
export interface PreprocessingOptions {
  enableAdaptiveThresholding: boolean;
  enableNoiseReduction: boolean;
  enableContrastEnhancement: boolean;
  enableSkewCorrection: boolean;
  enableCharacterSegmentation: boolean;
  enableEdgeDetection: boolean;
  enableMorphologicalOperations: boolean;
  customThreshold?: number;
  kernelSize?: number;
  iterations?: number;
}

export interface PreprocessingResult {
  processedImage: ImageData;
  originalImage: ImageData;
  preprocessingSteps: string[];
  qualityScore: number;
  characterRegions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    character: string;
  }>;
  textLines: Array<{
    y: number;
    height: number;
    characters: number;
    confidence: number;
  }>;
  skewAngle: number;
  noiseLevel: number;
  contrastLevel: number;
}

export class AdvancedImagePreprocessing {
  private static instance: AdvancedImagePreprocessing;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  public static getInstance(): AdvancedImagePreprocessing {
    if (!AdvancedImagePreprocessing.instance) {
      AdvancedImagePreprocessing.instance = new AdvancedImagePreprocessing();
    }
    return AdvancedImagePreprocessing.instance;
  }

  /**
   * Advanced preprocessing dengan multiple techniques
   */
  public async preprocessImage(
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
  ): Promise<PreprocessingResult> {
    console.log('Starting advanced image preprocessing...', options);
    
    const preprocessingSteps: string[] = [];
    let qualityScore = 0;
    let skewAngle = 0;
    let noiseLevel = 0;
    let contrastLevel = 0;

    try {
      // Load image
      const image = await this.loadImage(imageFile);
      const originalImage = this.imageToImageData(image);
      
      // Set canvas size
      this.canvas.width = image.width;
      this.canvas.height = image.height;
      
      // Draw original image
      this.ctx.drawImage(image, 0, 0);
      let processedImage = this.ctx.getImageData(0, 0, image.width, image.height);
      
      // Step 1: Noise Reduction
      if (options.enableNoiseReduction) {
        processedImage = this.applyNoiseReduction(processedImage, options.kernelSize || 3);
        preprocessingSteps.push('Noise Reduction');
        qualityScore += 10;
      }

      // Step 2: Contrast Enhancement
      if (options.enableContrastEnhancement) {
        processedImage = this.applyContrastEnhancement(processedImage);
        preprocessingSteps.push('Contrast Enhancement');
        qualityScore += 15;
        contrastLevel = this.calculateContrastLevel(processedImage);
      }

      // Step 3: Skew Correction
      if (options.enableSkewCorrection) {
        const skewResult = this.detectAndCorrectSkew(processedImage);
        processedImage = skewResult.correctedImage;
        skewAngle = skewResult.angle;
        preprocessingSteps.push(`Skew Correction (${skewAngle.toFixed(2)}°)`);
        qualityScore += 20;
      }

      // Step 4: Edge Detection
      if (options.enableEdgeDetection) {
        processedImage = this.applyEdgeDetection(processedImage);
        preprocessingSteps.push('Edge Detection');
        qualityScore += 10;
      }

      // Step 5: Adaptive Thresholding
      if (options.enableAdaptiveThresholding) {
        processedImage = this.applyAdaptiveThresholding(processedImage, options.customThreshold);
        preprocessingSteps.push('Adaptive Thresholding');
        qualityScore += 25;
      }

      // Step 6: Morphological Operations
      if (options.enableMorphologicalOperations) {
        processedImage = this.applyMorphologicalOperations(processedImage, options.iterations || 2);
        preprocessingSteps.push('Morphological Operations');
        qualityScore += 15;
      }

      // Step 7: Character Segmentation
      let characterRegions: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        confidence: number;
        character: string;
      }> = [];
      
      let textLines: Array<{
        y: number;
        height: number;
        characters: number;
        confidence: number;
      }> = [];

      if (options.enableCharacterSegmentation) {
        const segmentationResult = this.performCharacterSegmentation(processedImage);
        characterRegions = segmentationResult.characterRegions;
        textLines = segmentationResult.textLines;
        preprocessingSteps.push('Character Segmentation');
        qualityScore += 20;
      }

      // Calculate noise level
      noiseLevel = this.calculateNoiseLevel(processedImage);

      // Final quality score
      qualityScore = Math.min(100, qualityScore);

      console.log('Advanced preprocessing completed', {
        steps: preprocessingSteps.length,
        qualityScore,
        characterRegions: characterRegions.length,
        textLines: textLines.length,
        skewAngle,
        noiseLevel,
        contrastLevel
      });

      return {
        processedImage,
        originalImage,
        preprocessingSteps,
        qualityScore,
        characterRegions,
        textLines,
        skewAngle,
        noiseLevel,
        contrastLevel
      };

    } catch (error) {
      console.error('Advanced preprocessing error:', error);
      throw new Error(`Advanced preprocessing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load image from file
   */
  private loadImage(file: File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convert image to ImageData
   */
  private imageToImageData(image: HTMLImageElement): ImageData {
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.ctx.drawImage(image, 0, 0);
    return this.ctx.getImageData(0, 0, image.width, image.height);
  }

  /**
   * Apply noise reduction using Gaussian blur
   */
  private applyNoiseReduction(imageData: ImageData, kernelSize: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    const result = new Uint8ClampedArray(data);

    const kernel = this.createGaussianKernel(kernelSize);
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = halfKernel; y < height - halfKernel; y++) {
      for (let x = halfKernel; x < width - halfKernel; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels
          let sum = 0;
          let weightSum = 0;

          for (let ky = 0; ky < kernelSize; ky++) {
            for (let kx = 0; kx < kernelSize; kx++) {
              const pixelY = y + ky - halfKernel;
              const pixelX = x + kx - halfKernel;
              const pixelIndex = (pixelY * width + pixelX) * 4 + c;
              const weight = kernel[ky][kx];
              
              sum += data[pixelIndex] * weight;
              weightSum += weight;
            }
          }

          const resultIndex = (y * width + x) * 4 + c;
          result[resultIndex] = Math.round(sum / weightSum);
        }
      }
    }

    return new ImageData(result, width, height);
  }

  /**
   * Create Gaussian kernel for blur
   */
  private createGaussianKernel(size: number): number[][] {
    const kernel: number[][] = [];
    const sigma = size / 6;
    const twoSigmaSquare = 2 * sigma * sigma;
    const sqrtTwoPiSigma = Math.sqrt(2 * Math.PI) * sigma;
    let sum = 0;

    for (let y = 0; y < size; y++) {
      kernel[y] = [];
      for (let x = 0; x < size; x++) {
        const distance = Math.pow(x - Math.floor(size / 2), 2) + Math.pow(y - Math.floor(size / 2), 2);
        kernel[y][x] = Math.exp(-distance / twoSigmaSquare) / sqrtTwoPiSigma;
        sum += kernel[y][x];
      }
    }

    // Normalize kernel
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        kernel[y][x] /= sum;
      }
    }

    return kernel;
  }

  /**
   * Apply contrast enhancement using histogram equalization
   */
  private applyContrastEnhancement(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const result = new Uint8ClampedArray(data);

    // Calculate histogram for each channel
    for (let c = 0; c < 3; c++) { // RGB channels
      const histogram = new Array(256).fill(0);
      
      for (let i = 0; i < data.length; i += 4) {
        histogram[data[i + c]]++;
      }

      // Calculate cumulative distribution function
      const cdf = new Array(256);
      cdf[0] = histogram[0];
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + histogram[i];
      }

      // Normalize CDF
      const totalPixels = width * height;
      for (let i = 0; i < 256; i++) {
        cdf[i] = Math.round((cdf[i] / totalPixels) * 255);
      }

      // Apply equalization
      for (let i = 0; i < data.length; i += 4) {
        result[i + c] = cdf[data[i + c]];
      }
    }

    return new ImageData(result, width, height);
  }

  /**
   * Detect and correct skew angle
   */
  private detectAndCorrectSkew(imageData: ImageData): { correctedImage: ImageData; angle: number } {
    // Simplified skew detection using Hough transform
    const angle = this.detectSkewAngle(imageData);
    
    if (Math.abs(angle) < 0.5) {
      return { correctedImage: imageData, angle: 0 };
    }

    const correctedImage = this.rotateImage(imageData, -angle);
    return { correctedImage, angle };
  }

  /**
   * Detect skew angle using Hough transform
   */
  private detectSkewAngle(imageData: ImageData): number {
    const width = imageData.width;
    const height = imageData.height;
    
    // Convert to grayscale and apply edge detection
    const edges = this.detectEdges(imageData);
    
    // Hough transform for line detection
    const maxRho = Math.sqrt(width * width + height * height);
    const rhoStep = 1;
    const thetaStep = Math.PI / 180; // 1 degree
    const accumulator: number[][] = [];
    
    for (let rho = 0; rho < maxRho; rho += rhoStep) {
      accumulator[rho] = new Array(Math.PI / thetaStep).fill(0);
    }

    // Vote for lines
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x] > 128) {
          for (let theta = 0; theta < Math.PI; theta += thetaStep) {
            const rho = x * Math.cos(theta) + y * Math.sin(theta);
            const rhoIndex = Math.round(rho / rhoStep);
            const thetaIndex = Math.round(theta / thetaStep);
            
            if (rhoIndex >= 0 && rhoIndex < accumulator.length && thetaIndex >= 0 && thetaIndex < accumulator[rhoIndex].length) {
              accumulator[rhoIndex][thetaIndex]++;
            }
          }
        }
      }
    }

    // Find dominant angle
    let maxVotes = 0;
    let dominantAngle = 0;
    
    for (let rho = 0; rho < accumulator.length; rho++) {
      for (let theta = 0; theta < accumulator[rho].length; theta++) {
        if (accumulator[rho][theta] > maxVotes) {
          maxVotes = accumulator[rho][theta];
          dominantAngle = theta * thetaStep;
        }
      }
    }

    // Convert to degrees and adjust
    let angle = (dominantAngle * 180 / Math.PI) - 90;
    if (angle > 45) angle -= 90;
    if (angle < -45) angle += 90;
    
    return angle;
  }

  /**
   * Detect edges using Sobel operator
   */
  private detectEdges(imageData: ImageData): Uint8Array {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const edges = new Uint8Array(width * height);

    // Sobel kernels
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;

        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const pixelY = y + ky - 1;
            const pixelX = x + kx - 1;
            const pixelIndex = (pixelY * width + pixelX) * 4;
            const gray = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
            
            gx += gray * sobelX[ky][kx];
            gy += gray * sobelY[ky][kx];
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = Math.min(255, magnitude);
      }
    }

    return edges;
  }

  /**
   * Rotate image by given angle
   */
  private rotateImage(imageData: ImageData, angle: number): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new Uint8ClampedArray(data.length);
    
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const centerX = width / 2;
    const centerY = height / 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate rotated coordinates
        const rotatedX = (x - centerX) * cos - (y - centerY) * sin + centerX;
        const rotatedY = (x - centerX) * sin + (y - centerY) * cos + centerY;
        
        const sourceX = Math.round(rotatedX);
        const sourceY = Math.round(rotatedY);
        
        if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
          const sourceIndex = (sourceY * width + sourceX) * 4;
          const targetIndex = (y * width + x) * 4;
          
          result[targetIndex] = data[sourceIndex];
          result[targetIndex + 1] = data[sourceIndex + 1];
          result[targetIndex + 2] = data[sourceIndex + 2];
          result[targetIndex + 3] = data[sourceIndex + 3];
        }
      }
    }

    return new ImageData(result, width, height);
  }

  /**
   * Apply edge detection
   */
  private applyEdgeDetection(imageData: ImageData): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new Uint8ClampedArray(data);

    const edges = this.detectEdges(imageData);

    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const edgeValue = edges[pixelIndex];
      
      result[i] = edgeValue;     // R
      result[i + 1] = edgeValue; // G
      result[i + 2] = edgeValue; // B
      result[i + 3] = data[i + 3]; // A
    }

    return new ImageData(result, width, height);
  }

  /**
   * Apply adaptive thresholding
   */
  private applyAdaptiveThresholding(imageData: ImageData, customThreshold?: number): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new Uint8ClampedArray(data);

    // Convert to grayscale first
    const grayscale = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      grayscale[i / 4] = gray;
    }

    // Calculate adaptive threshold
    const threshold = customThreshold || this.calculateAdaptiveThreshold(grayscale, width, height);

    // Apply threshold
    for (let i = 0; i < data.length; i += 4) {
      const gray = grayscale[i / 4];
      const binary = gray > threshold ? 255 : 0;
      
      result[i] = binary;     // R
      result[i + 1] = binary; // G
      result[i + 2] = binary; // B
      result[i + 3] = data[i + 3]; // A
    }

    return new ImageData(result, width, height);
  }

  /**
   * Calculate adaptive threshold using Otsu's method
   */
  private calculateAdaptiveThreshold(grayscale: Uint8Array, width: number, height: number): number {
    const histogram = new Array(256).fill(0);
    
    for (let i = 0; i < grayscale.length; i++) {
      histogram[grayscale[i]]++;
    }

    const totalPixels = width * height;
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 0;

    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      
      wF = totalPixels - wB;
      if (wF === 0) break;
      
      sumB += t * histogram[t];
      
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      
      const varBetween = wB * wF * (mB - mF) * (mB - mF);
      
      if (varBetween > varMax) {
        varMax = varBetween;
        threshold = t;
      }
    }

    return threshold;
  }

  /**
   * Apply morphological operations
   */
  private applyMorphologicalOperations(imageData: ImageData, iterations: number): ImageData {
    let result = imageData;
    
    for (let i = 0; i < iterations; i++) {
      result = this.erode(result);
      result = this.dilate(result);
    }
    
    return result;
  }

  /**
   * Erosion operation
   */
  private erode(imageData: ImageData): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new Uint8ClampedArray(data);

    const kernel = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let minValue = 255;
        
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            if (kernel[ky][kx]) {
              const pixelY = y + ky - 1;
              const pixelX = x + kx - 1;
              const pixelIndex = (pixelY * width + pixelX) * 4;
              const gray = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
              minValue = Math.min(minValue, gray);
            }
          }
        }
        
        const resultIndex = (y * width + x) * 4;
        result[resultIndex] = minValue;
        result[resultIndex + 1] = minValue;
        result[resultIndex + 2] = minValue;
        result[resultIndex + 3] = data[resultIndex + 3];
      }
    }

    return new ImageData(result, width, height);
  }

  /**
   * Dilation operation
   */
  private dilate(imageData: ImageData): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new Uint8ClampedArray(data);

    const kernel = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let maxValue = 0;
        
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            if (kernel[ky][kx]) {
              const pixelY = y + ky - 1;
              const pixelX = x + kx - 1;
              const pixelIndex = (pixelY * width + pixelX) * 4;
              const gray = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
              maxValue = Math.max(maxValue, gray);
            }
          }
        }
        
        const resultIndex = (y * width + x) * 4;
        result[resultIndex] = maxValue;
        result[resultIndex + 1] = maxValue;
        result[resultIndex + 2] = maxValue;
        result[resultIndex + 3] = data[resultIndex + 3];
      }
    }

    return new ImageData(result, width, height);
  }

  /**
   * Perform character segmentation
   */
  private performCharacterSegmentation(imageData: ImageData): {
    characterRegions: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
      character: string;
    }>;
    textLines: Array<{
      y: number;
      height: number;
      characters: number;
      confidence: number;
    }>;
  } {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Convert to binary
    const binary = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      binary[i / 4] = gray > 128 ? 1 : 0;
    }

    // Find connected components (characters)
    const visited = new Array(width * height).fill(false);
    const characterRegions: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
      character: string;
    }> = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        if (binary[index] === 1 && !visited[index]) {
          const region = this.floodFill(binary, visited, x, y, width, height);
          if (region.width > 2 && region.height > 2 && region.width < 50 && region.height < 50) {
            characterRegions.push({
              x: region.x,
              y: region.y,
              width: region.width,
              height: region.height,
              confidence: this.calculateCharacterConfidence(region, binary, width, height),
              character: '?' // Will be filled by OCR
            });
          }
        }
      }
    }

    // Group characters into text lines
    const textLines = this.groupCharactersIntoLines(characterRegions);

    return { characterRegions, textLines };
  }

  /**
   * Flood fill algorithm for connected components
   */
  private floodFill(
    binary: Uint8Array,
    visited: boolean[],
    startX: number,
    startY: number,
    width: number,
    height: number
  ): { x: number; y: number; width: number; height: number } {
    const stack = [{ x: startX, y: startY }];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const index = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[index] || binary[index] === 0) {
        continue;
      }

      visited[index] = true;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      // Add neighbors
      stack.push(
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 }
      );
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  /**
   * Calculate character confidence based on shape and size
   */
  private calculateCharacterConfidence(
    region: { x: number; y: number; width: number; height: number },
    _binary: Uint8Array,
    _width: number,
    _height: number
  ): number {
    const aspectRatio = region.width / region.height;
    const area = region.width * region.height;
    
    // Ideal character properties
    const idealAspectRatio = 0.6; // Typical for characters
    const idealArea = 100; // Typical character area
    
    const aspectRatioScore = 1 - Math.abs(aspectRatio - idealAspectRatio) / idealAspectRatio;
    const areaScore = 1 - Math.abs(area - idealArea) / idealArea;
    
    return Math.max(0, Math.min(1, (aspectRatioScore + areaScore) / 2));
  }

  /**
   * Group characters into text lines
   */
  private groupCharactersIntoLines(
    characterRegions: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
      character: string;
    }>
  ): Array<{
    y: number;
    height: number;
    characters: number;
    confidence: number;
  }> {
    // Sort characters by Y position
    const sortedCharacters = [...characterRegions].sort((a, b) => a.y - b.y);
    
    const lines: Array<{
      y: number;
      height: number;
      characters: number;
      confidence: number;
    }> = [];
    
    let currentLine: typeof sortedCharacters = [];
    let currentLineY = sortedCharacters[0]?.y || 0;
    const lineHeight = 20; // Typical line height
    
    for (const char of sortedCharacters) {
      if (Math.abs(char.y - currentLineY) <= lineHeight) {
        currentLine.push(char);
      } else {
        if (currentLine.length > 0) {
          lines.push({
            y: currentLineY,
            height: Math.max(...currentLine.map(c => c.height)),
            characters: currentLine.length,
            confidence: currentLine.reduce((sum, c) => sum + c.confidence, 0) / currentLine.length
          });
        }
        currentLine = [char];
        currentLineY = char.y;
      }
    }
    
    if (currentLine.length > 0) {
      lines.push({
        y: currentLineY,
        height: Math.max(...currentLine.map(c => c.height)),
        characters: currentLine.length,
        confidence: currentLine.reduce((sum, c) => sum + c.confidence, 0) / currentLine.length
      });
    }
    
    return lines;
  }

  /**
   * Calculate noise level
   */
  private calculateNoiseLevel(imageData: ImageData): number {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let noiseSum = 0;
    let pixelCount = 0;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const centerIndex = (y * width + x) * 4;
        const centerGray = (data[centerIndex] + data[centerIndex + 1] + data[centerIndex + 2]) / 3;
        
        let neighborSum = 0;
        let neighborCount = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const neighborIndex = ((y + dy) * width + (x + dx)) * 4;
            const neighborGray = (data[neighborIndex] + data[neighborIndex + 1] + data[neighborIndex + 2]) / 3;
            neighborSum += neighborGray;
            neighborCount++;
          }
        }
        
        const averageNeighbor = neighborSum / neighborCount;
        noiseSum += Math.abs(centerGray - averageNeighbor);
        pixelCount++;
      }
    }
    
    return noiseSum / pixelCount / 255; // Normalize to 0-1
  }

  /**
   * Calculate contrast level
   */
  private calculateContrastLevel(imageData: ImageData): number {
    const data = imageData.data;
    let minGray = 255;
    let maxGray = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      minGray = Math.min(minGray, gray);
      maxGray = Math.max(maxGray, gray);
    }
    
    return (maxGray - minGray) / 255;
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.canvas) {
      this.canvas.remove();
    }
  }
}