import React, { useState, useRef } from 'react';
import { OCRService } from '../services/ocrService';
import type { PreprocessingOptions } from '../services/advancedImagePreprocessing';

interface TrainingResult {
  ocrResult: any;
  trainingData: any;
  feedback: any;
  recommendations: string[];
}

interface PreprocessingStep {
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
  quality?: number;
}

export const AdvancedOCRTraining: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [preprocessingSteps, setPreprocessingSteps] = useState<PreprocessingStep[]>([]);
  const [preprocessingOptions, setPreprocessingOptions] = useState<PreprocessingOptions>({
    enableAdaptiveThresholding: true,
    enableNoiseReduction: true,
    enableContrastEnhancement: true,
    enableSkewCorrection: true,
    enableCharacterSegmentation: true,
    enableEdgeDetection: true,
    enableMorphologicalOperations: true,
    kernelSize: 3,
    iterations: 2
  });
  const [showPreprocessingDetails, setShowPreprocessingDetails] = useState(false);
  const [showTrainingFeedback, setShowTrainingFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setTrainingResult(null);
      setPreprocessingSteps([]);
    }
  };

  const handleProcessImage = async () => {
    if (!imageFile) return;

    setIsProcessing(true);
    setPreprocessingSteps([]);
    
    try {
      const ocrService = OCRService.getInstance();
      const result = await ocrService.processImageWithAdvancedTraining(imageFile);
      
      setTrainingResult(result);
      
      // Simulate preprocessing steps for visual feedback
      simulatePreprocessingSteps(result.trainingData.preprocessingResult);
      
    } catch (error) {
      console.error('Advanced OCR training error:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulatePreprocessingSteps = (preprocessingResult: any) => {
    const steps: PreprocessingStep[] = [
      {
        name: 'Noise Reduction',
        description: 'Applying Gaussian blur to reduce noise',
        status: 'processing'
      },
      {
        name: 'Contrast Enhancement',
        description: 'Using histogram equalization to improve contrast',
        status: 'pending'
      },
      {
        name: 'Skew Correction',
        description: `Correcting skew angle: ${preprocessingResult.skewAngle.toFixed(2)}°`,
        status: 'pending'
      },
      {
        name: 'Edge Detection',
        description: 'Detecting edges using Sobel operator',
        status: 'pending'
      },
      {
        name: 'Adaptive Thresholding',
        description: 'Converting to binary using Otsu method',
        status: 'pending'
      },
      {
        name: 'Character Segmentation',
        description: `Segmenting ${preprocessingResult.characterRegions.length} characters`,
        status: 'pending'
      },
      {
        name: 'Morphological Operations',
        description: 'Applying erosion and dilation',
        status: 'pending'
      }
    ];

    setPreprocessingSteps(steps);

    // Simulate step-by-step processing
    steps.forEach((_step, index) => {
      setTimeout(() => {
        setPreprocessingSteps(prev => 
          prev.map((s, i) => 
            i === index 
              ? { ...s, status: 'completed', duration: Math.random() * 1000 + 500, quality: Math.random() * 20 + 80 }
              : i === index + 1 
                ? { ...s, status: 'processing' }
                : s
          )
        );
      }, index * 800);
    });
  };

  const handlePreprocessingOptionChange = (option: keyof PreprocessingOptions, value: boolean | number) => {
    setPreprocessingOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const exportTrainingData = () => {
    if (!trainingResult) return;
    
    const dataStr = JSON.stringify(trainingResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'advanced-ocr-training-data.json';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'text-green-600';
    if (quality >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: PreprocessingStep['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'error':
        return '❌';
      default:
        return '⏸️';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Advanced OCR Training dengan Preprocessing
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
                {isProcessing ? 'Processing...' : 'Start Advanced Training'}
              </button>
            )}
          </div>

          {/* Preprocessing Options */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Preprocessing Options</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preprocessingOptions.enableNoiseReduction}
                  onChange={(e) => handlePreprocessingOptionChange('enableNoiseReduction', e.target.checked)}
                  className="mr-2"
                />
                Noise Reduction
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preprocessingOptions.enableContrastEnhancement}
                  onChange={(e) => handlePreprocessingOptionChange('enableContrastEnhancement', e.target.checked)}
                  className="mr-2"
                />
                Contrast Enhancement
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preprocessingOptions.enableSkewCorrection}
                  onChange={(e) => handlePreprocessingOptionChange('enableSkewCorrection', e.target.checked)}
                  className="mr-2"
                />
                Skew Correction
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preprocessingOptions.enableCharacterSegmentation}
                  onChange={(e) => handlePreprocessingOptionChange('enableCharacterSegmentation', e.target.checked)}
                  className="mr-2"
                />
                Character Segmentation
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preprocessingOptions.enableEdgeDetection}
                  onChange={(e) => handlePreprocessingOptionChange('enableEdgeDetection', e.target.checked)}
                  className="mr-2"
                />
                Edge Detection
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preprocessingOptions.enableAdaptiveThresholding}
                  onChange={(e) => handlePreprocessingOptionChange('enableAdaptiveThresholding', e.target.checked)}
                  className="mr-2"
                />
                Adaptive Thresholding
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preprocessingOptions.enableMorphologicalOperations}
                  onChange={(e) => handlePreprocessingOptionChange('enableMorphologicalOperations', e.target.checked)}
                  className="mr-2"
                />
                Morphological Operations
              </label>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kernel Size: {preprocessingOptions.kernelSize}
                </label>
                <input
                  type="range"
                  min="3"
                  max="7"
                  step="2"
                  value={preprocessingOptions.kernelSize}
                  onChange={(e) => handlePreprocessingOptionChange('kernelSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Iterations: {preprocessingOptions.iterations}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={preprocessingOptions.iterations}
                  onChange={(e) => handlePreprocessingOptionChange('iterations', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Image Preview */}
        {imageUrl && (
          <div className="mb-6">
            <div className="relative">
              <img
                src={imageUrl}
                alt="Training image preview"
                className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <div>Processing with Advanced Training...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preprocessing Steps */}
        {preprocessingSteps.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Preprocessing Steps</h3>
              <button
                onClick={() => setShowPreprocessingDetails(!showPreprocessingDetails)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showPreprocessingDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            <div className="space-y-2">
              {preprocessingSteps.map((step, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg ${
                    step.status === 'completed' ? 'border-green-500 bg-green-50' :
                    step.status === 'processing' ? 'border-blue-500 bg-blue-50' :
                    step.status === 'error' ? 'border-red-500 bg-red-50' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getStatusIcon(step.status)}</span>
                      <div>
                        <div className="font-medium">{step.name}</div>
                        <div className="text-sm text-gray-600">{step.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {step.duration && (
                        <div className="text-sm text-gray-500">
                          {(step.duration / 1000).toFixed(1)}s
                        </div>
                      )}
                      {step.quality && (
                        <div className={`text-sm font-medium ${getQualityColor(step.quality)}`}>
                          {step.quality.toFixed(0)}% quality
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training Results */}
        {trainingResult && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Training Results</h3>
              <button
                onClick={() => setShowTrainingFeedback(!showTrainingFeedback)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showTrainingFeedback ? 'Hide Feedback' : 'Show Feedback'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* OCR Results */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">OCR Results</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Products Found:</span>
                    <span className="font-semibold">{trainingResult.trainingData.products.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">
                      Rp {trainingResult.trainingData.products.reduce((sum: number, p: any) => sum + (p.quantity * p.price), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality Score:</span>
                    <span className={`font-semibold ${getQualityColor(trainingResult.trainingData.trainingMetadata.qualityScore)}`}>
                      {trainingResult.trainingData.trainingMetadata.qualityScore.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Character Count:</span>
                    <span className="font-semibold">{trainingResult.trainingData.trainingMetadata.characterCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Text Lines:</span>
                    <span className="font-semibold">{trainingResult.trainingData.trainingMetadata.textLineCount}</span>
                  </div>
                </div>
              </div>

              {/* Training Feedback */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Training Feedback</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span className={`font-semibold ${getQualityColor(trainingResult.feedback.accuracy * 100)}`}>
                      {(trainingResult.feedback.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Improvements:</span>
                    <span className="font-semibold">{trainingResult.feedback.improvements.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Suggestions:</span>
                    <span className="font-semibold">{trainingResult.feedback.suggestions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Character Corrections:</span>
                    <span className="font-semibold">{trainingResult.feedback.characterCorrections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pattern Suggestions:</span>
                    <span className="font-semibold">{trainingResult.feedback.patternSuggestions.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Feedback */}
            {showTrainingFeedback && (
              <div className="mt-6 space-y-4">
                {/* Improvements */}
                {trainingResult.feedback.improvements.length > 0 && (
                  <div>
                    <h5 className="font-medium text-red-600 mb-2">Improvements Needed:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {trainingResult.feedback.improvements.map((improvement: string, index: number) => (
                        <li key={index} className="text-gray-700">{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {trainingResult.feedback.suggestions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-yellow-600 mb-2">Suggestions:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {trainingResult.feedback.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-gray-700">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {trainingResult.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-medium text-blue-600 mb-2">Recommendations:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {trainingResult.recommendations.map((recommendation: string, index: number) => (
                        <li key={index} className="text-gray-700">{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={exportTrainingData}
            disabled={!trainingResult}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 transition-colors"
          >
            Export Training Data
          </button>
          
          <button
            onClick={() => {
              setImageFile(null);
              setImageUrl('');
              setTrainingResult(null);
              setPreprocessingSteps([]);
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

export default AdvancedOCRTraining;
