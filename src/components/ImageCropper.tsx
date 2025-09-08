import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Crop as CropIcon, RotateCcw, Check, X } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fungsi untuk membuat crop area di tengah gambar
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80, // 80% dari lebar gambar
        },
        16 / 9, // aspect ratio
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, []);

  // Fungsi untuk crop gambar dengan peningkatan kualitas
  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not found');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Increase canvas size for better quality (2x scaling)
      const qualityMultiplier = 2;
      canvas.width = crop.width * qualityMultiplier;
      canvas.height = crop.height * qualityMultiplier;

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Apply image enhancement filters
      ctx.filter = 'contrast(1.2) brightness(1.1) saturate(1.1)';

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * qualityMultiplier,
        crop.height * qualityMultiplier
      );

      // Apply additional image processing for OCR optimization
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const enhancedImageData = enhanceImageForOCR(imageData);
      ctx.putImageData(enhancedImageData, 0, 0);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          }
        }, 'image/jpeg', 0.95); // Higher quality JPEG
      });
    },
    []
  );

  // Fungsi untuk meningkatkan kualitas gambar untuk OCR
  const enhanceImageForOCR = (imageData: ImageData): ImageData => {
    const data = imageData.data;

    // Apply contrast enhancement
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale for better OCR
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      
      // Apply contrast enhancement
      const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
      
      data[i] = enhanced;     // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
      // Alpha channel remains unchanged
    }

    return imageData;
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      onCropComplete(croppedImageBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (imgRef.current) {
      onImageLoad({ currentTarget: imgRef.current } as React.SyntheticEvent<HTMLImageElement>);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-md border">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl sm:text-2xl text-gray-800 flex items-center gap-2">
          <CropIcon className="w-6 h-6" />
          Crop Gambar Invoice
        </CardTitle>
        <CardDescription className="text-gray-600">
          Pilih area yang berisi item dan harga untuk hasil OCR yang lebih akurat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Crop Area */}
        <div className="relative">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={16 / 9}
            minWidth={200}
            minHeight={100}
            className="max-h-96"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Invoice to crop"
              onLoad={onImageLoad}
              className="max-h-96 w-auto mx-auto"
            />
          </ReactCrop>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Petunjuk Crop:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Drag untuk memilih area yang berisi daftar item dan harga</li>
            <li>• Pastikan area mencakup nama produk, quantity, dan harga</li>
            <li>• Hindari header, footer, atau teks yang tidak relevan</li>
            <li>• Crop area akan membantu OCR fokus pada data yang penting</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Batal
          </Button>
          <Button
            onClick={handleCropComplete}
            disabled={!completedCrop || isProcessing}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Crop & Lanjutkan
              </>
            )}
          </Button>
        </div>

        {/* Hidden Canvas for cropping */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </CardContent>
    </Card>
  );
};
