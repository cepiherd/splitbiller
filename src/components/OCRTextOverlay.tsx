import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { OCRTextBlock, OCRProduct } from '../types/bill';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface OCRTextOverlayProps {
  imageSrc: string;
  textBlocks: OCRTextBlock[];
  products: OCRProduct[];
  imageDimensions: { width: number; height: number };
  onTextBlockClick?: (textBlock: OCRTextBlock, productIndex?: number) => void;
  showAllText?: boolean;
  showProductsOnly?: boolean;
}

export const OCRTextOverlay: React.FC<OCRTextOverlayProps> = ({
  imageSrc,
  textBlocks,
  products,
  imageDimensions,
  onTextBlockClick,
  showAllText = true,
  showProductsOnly = false
}) => {
  const [, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Calculate scale factors and container dimensions with zoom support
  const calculateScale = useCallback(() => {
    if (containerRef.current && imageRef.current && imageDimensions.width > 0 && imageDimensions.height > 0) {
      const container = containerRef.current;
      const image = imageRef.current;
      const containerRect = container.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      
      // Calculate base scale factors (how the image fits in container)
      const baseScaleX = imageRect.width / imageDimensions.width;
      const baseScaleY = imageRect.height / imageDimensions.height;
      
      // Apply zoom level
      const finalScaleX = baseScaleX * zoomLevel;
      const finalScaleY = baseScaleY * zoomLevel;
      
      setContainerDimensions({
        width: containerRect.width,
        height: containerRect.height
      });
      
      setScale({ x: finalScaleX, y: finalScaleY });
    }
  }, [imageDimensions, zoomLevel]);

  // Recalculate scale when dependencies change
  useEffect(() => {
    calculateScale();
  }, [calculateScale]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      calculateScale();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateScale]);

  // Handle image load
  const handleImageLoad = () => {
    calculateScale();
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 5)); // Max 5x zoom
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5)); // Min 0.5x zoom
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleFitToScreen = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Filter text blocks based on display options
  const filteredTextBlocks = textBlocks.filter(block => {
    if (showProductsOnly) {
      return block.isProduct;
    }
    return showAllText;
  });

  // Get product status for text blocks
  const getTextBlockStatus = (block: OCRTextBlock) => {
    if (block.isProduct && block.productIndex !== undefined) {
      const product = products[block.productIndex];
      if (product?.isValidated) return 'validated';
      if (product?.isMarked) return 'marked';
      return 'pending';
    }
    return 'other';
  };

  // Get status color (currently unused but kept for future use)
  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'validated':
  //       return 'border-green-500 bg-green-100/20';
  //     case 'marked':
  //       return 'border-yellow-500 bg-yellow-100/20';
  //     case 'pending':
  //       return 'border-orange-500 bg-orange-100/20';
  //     default:
  //       return 'border-blue-500 bg-blue-100/20';
  //   }
  // };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return '✓';
      case 'marked':
        return '⚠';
      case 'pending':
        return '⏳';
      default:
        return '📄';
    }
  };

  return (
    <div className="ocr-text-overlay relative w-full h-full" ref={containerRef}>
      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white/90 hover:bg-white border border-gray-300 rounded-lg shadow-sm transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white/90 hover:bg-white border border-gray-300 rounded-lg shadow-sm transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 bg-white/90 hover:bg-white border border-gray-300 rounded-lg shadow-sm transition-colors"
          title="Reset Zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitToScreen}
          className="p-2 bg-white/90 hover:bg-white border border-gray-300 rounded-lg shadow-sm transition-colors"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute top-4 right-4 z-20 bg-white/90 px-3 py-1 rounded-lg border border-gray-300 shadow-sm">
        <span className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
      </div>

      {/* Image Container with Zoom and Pan */}
      <div 
        className="relative w-full h-full overflow-hidden rounded-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Invoice with OCR markings"
          className="w-full h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: 'top left'
          }}
          onLoad={handleImageLoad}
        />
        
        {/* Text Block Overlays */}
        {filteredTextBlocks.map((block, index) => {
          const status = getTextBlockStatus(block);
          const scaledX = block.boundingBox.x * scale.x;
          const scaledY = block.boundingBox.y * scale.y;
          const scaledWidth = block.boundingBox.width * scale.x;
          const scaledHeight = block.boundingBox.height * scale.y;
          
          return (
            <div
              key={index}
              className={`ocr-text-block ${status} rounded cursor-pointer transition-all duration-200 hover:shadow-lg`}
              style={{
                left: scaledX,
                top: scaledY,
                width: scaledWidth,
                height: scaledHeight,
                minWidth: '20px',
                minHeight: '15px'
              }}
              onClick={() => onTextBlockClick?.(block, block.productIndex)}
              title={`${block.text} (${Math.round(block.confidence * 100)}% confidence)`}
            >
              {/* Status Icon */}
              <div className="ocr-status-icon">
                {getStatusIcon(status)}
              </div>
              
              {/* Text Preview (if space allows) */}
              {scaledWidth > 50 && scaledHeight > 20 && (
                <div className="ocr-text-preview">
                  {block.text.length > 20 ? block.text.substring(0, 20) + '...' : block.text}
                </div>
              )}
              
              {/* Confidence Badge */}
              <div className="ocr-confidence-badge">
                {Math.round(block.confidence * 100)}%
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="ocr-legend">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">OCR Text Markings</h4>
        <div className="space-y-1 text-xs">
          <div className="ocr-legend-item">
            <div className="ocr-legend-color border-green-500 bg-green-100/20"></div>
            <span>Validated Products</span>
          </div>
          <div className="ocr-legend-item">
            <div className="ocr-legend-color border-yellow-500 bg-yellow-100/20"></div>
            <span>Marked for Review</span>
          </div>
          <div className="ocr-legend-item">
            <div className="ocr-legend-color border-orange-500 bg-orange-100/20"></div>
            <span>Pending Review</span>
          </div>
          <div className="ocr-legend-item">
            <div className="ocr-legend-color border-blue-500 bg-blue-100/20"></div>
            <span>Other Text</span>
          </div>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="ocr-stats">
        <div className="text-xs text-gray-600">
          <div className="ocr-stats-item">Total Text Blocks: {textBlocks.length}</div>
          <div className="ocr-stats-item">Product Blocks: {textBlocks.filter(b => b.isProduct).length}</div>
          <div className="ocr-stats-item">Validated: {products.filter(p => p.isValidated).length}</div>
          <div className="ocr-stats-item">Marked: {products.filter(p => p.isMarked).length}</div>
        </div>
      </div>
    </div>
  );
};
