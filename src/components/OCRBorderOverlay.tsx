import React, { useState, useRef, useEffect } from 'react';

interface BorderArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  type: 'product' | 'price' | 'quantity' | 'total' | 'header' | 'footer';
  confidence?: number;
  isSelected: boolean;
}

interface OCRBorderOverlayProps {
  imageUrl: string;
  onAreaSelect: (area: BorderArea) => void;
  onAreasChange: (areas: BorderArea[]) => void;
  detectedAreas?: BorderArea[];
  isTrainingMode?: boolean;
}

export const OCRBorderOverlay: React.FC<OCRBorderOverlayProps> = ({
  imageUrl,
  onAreaSelect,
  onAreasChange,
  detectedAreas = [],
  isTrainingMode = false
}) => {
  const [areas, setAreas] = useState<BorderArea[]>(detectedAreas);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentArea, setCurrentArea] = useState<Partial<BorderArea> | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image and setup canvas
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
        }
      }
    };
    img.src = imageUrl;
    imageRef.current = img;
  }, [imageUrl]);

  // Draw areas on canvas
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw image
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0);
    }

    // Draw areas
    areas.forEach((area) => {
      drawArea(ctx, area);
    });

    // Draw current drawing area
    if (currentArea && startPoint) {
      drawCurrentArea(ctx, currentArea, startPoint);
    }
  }, [areas, currentArea, startPoint, imageLoaded]);

  const drawArea = (ctx: CanvasRenderingContext2D, area: BorderArea) => {
    const { x, y, width, height, type, isSelected, confidence } = area;
    
    // Set border color based on type
    let borderColor = '#3B82F6'; // Default blue
    switch (type) {
      case 'product':
        borderColor = '#10B981'; // Green
        break;
      case 'price':
        borderColor = '#F59E0B'; // Orange
        break;
      case 'quantity':
        borderColor = '#8B5CF6'; // Purple
        break;
      case 'total':
        borderColor = '#EF4444'; // Red
        break;
      case 'header':
        borderColor = '#6B7280'; // Gray
        break;
      case 'footer':
        borderColor = '#6B7280'; // Gray
        break;
    }

    // Set border style
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.setLineDash(isSelected ? [5, 5] : []);
    
    // Draw border
    ctx.strokeRect(x, y, width, height);
    
    // Draw label background
    const labelText = `${area.label}${confidence ? ` (${Math.round(confidence * 100)}%)` : ''}`;
    const labelWidth = ctx.measureText(labelText).width + 8;
    const labelHeight = 20;
    
    ctx.fillStyle = borderColor;
    ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight);
    
    // Draw label text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText(labelText, x + 4, y - 5);
  };

  const drawCurrentArea = (ctx: CanvasRenderingContext2D, area: Partial<BorderArea>, _start: { x: number; y: number }) => {
    if (!area.width || !area.height) return;
    
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(area.x || 0, area.y || 0, area.width, area.height);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTrainingMode) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentArea({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = x - startPoint.x;
    const height = y - startPoint.y;
    
    setCurrentArea({
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentArea || !startPoint) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = Math.abs(x - startPoint.x);
    const height = Math.abs(y - startPoint.y);
    
    if (width > 10 && height > 10) {
      const newArea: BorderArea = {
        id: `area_${Date.now()}`,
        x: Math.min(startPoint.x, x),
        y: Math.min(startPoint.y, y),
        width,
        height,
        label: 'New Area',
        type: 'product',
        isSelected: false
      };
      
      const updatedAreas = [...areas, newArea];
      setAreas(updatedAreas);
      onAreasChange(updatedAreas);
    }
    
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentArea(null);
  };

  const handleAreaClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find clicked area
    const clickedArea = areas.find(area => 
      x >= area.x && x <= area.x + area.width &&
      y >= area.y && y <= area.y + area.height
    );
    
    if (clickedArea) {
      setSelectedAreaId(clickedArea.id);
      onAreaSelect(clickedArea);
    }
  };

  const updateAreaType = (areaId: string, type: BorderArea['type']) => {
    const updatedAreas = areas.map(area => 
      area.id === areaId ? { ...area, type } : area
    );
    setAreas(updatedAreas);
    onAreasChange(updatedAreas);
  };

  const updateAreaLabel = (areaId: string, label: string) => {
    const updatedAreas = areas.map(area => 
      area.id === areaId ? { ...area, label } : area
    );
    setAreas(updatedAreas);
    onAreasChange(updatedAreas);
  };

  const deleteArea = (areaId: string) => {
    const updatedAreas = areas.filter(area => area.id !== areaId);
    setAreas(updatedAreas);
    onAreasChange(updatedAreas);
  };

  return (
    <div className="relative">
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">OCR Border Marking</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 border border-green-600"></div>
            <span className="text-sm">Product</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 border border-orange-600"></div>
            <span className="text-sm">Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 border border-purple-600"></div>
            <span className="text-sm">Quantity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 border border-red-600"></div>
            <span className="text-sm">Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 border border-gray-600"></div>
            <span className="text-sm">Header/Footer</span>
          </div>
        </div>
        
        {isTrainingMode && (
          <div className="text-sm text-blue-600 mb-2">
            💡 Click and drag to create new areas. Click on existing areas to select them.
          </div>
        )}
      </div>

      <div className="relative inline-block">
        <canvas
          ref={canvasRef}
          className="border border-gray-300 rounded-lg cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleAreaClick}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-gray-500">Loading image...</div>
          </div>
        )}
      </div>

      {areas.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium">Marked Areas ({areas.length})</h4>
          {areas.map((area) => (
            <div
              key={area.id}
              className={`p-3 border rounded-lg ${
                selectedAreaId === area.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 border-2 ${
                      area.type === 'product' ? 'bg-green-500 border-green-600' :
                      area.type === 'price' ? 'bg-orange-500 border-orange-600' :
                      area.type === 'quantity' ? 'bg-purple-500 border-purple-600' :
                      area.type === 'total' ? 'bg-red-500 border-red-600' :
                      'bg-gray-500 border-gray-600'
                    }`}
                  ></div>
                  <div>
                    <div className="font-medium">{area.label}</div>
                    <div className="text-sm text-gray-500">
                      {area.type} • {area.width}×{area.height}px
                      {area.confidence && ` • ${Math.round(area.confidence * 100)}% confidence`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={area.type}
                    onChange={(e) => updateAreaType(area.id, e.target.value as BorderArea['type'])}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="product">Product</option>
                    <option value="price">Price</option>
                    <option value="quantity">Quantity</option>
                    <option value="total">Total</option>
                    <option value="header">Header</option>
                    <option value="footer">Footer</option>
                  </select>
                  
                  <input
                    type="text"
                    value={area.label}
                    onChange={(e) => updateAreaLabel(area.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 w-24"
                    placeholder="Label"
                  />
                  
                  <button
                    onClick={() => deleteArea(area.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OCRBorderOverlay;
