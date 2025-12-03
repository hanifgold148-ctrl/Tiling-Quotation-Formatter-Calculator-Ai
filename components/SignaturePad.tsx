
import React, { useRef, useEffect, useState } from 'react';
import { RemoveIcon } from './icons';

interface SignaturePadProps {
  onSave: (base64Signature: string) => void;
  onClear?: () => void;
  existingSignature?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear, existingSignature }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (hasDrawn) {
        saveSignature();
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    let clientX, clientY;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      clientX = e.touches[0].clientX - rect.left;
      clientY = e.touches[0].clientY - rect.top;
    } else {
      clientX = (e as React.MouseEvent).nativeEvent.offsetX;
      clientY = (e as React.MouseEvent).nativeEvent.offsetY;
    }
    return { offsetX: clientX, offsetY: clientY };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
      if (onClear) onClear();
    }
  };
  
  const saveSignature = () => {
      const canvas = canvasRef.current;
      if(canvas) {
          const base64 = canvas.toDataURL('image/png');
          onSave(base64);
      }
  }

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-border-color dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          className="w-full h-40 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
        />
      </div>
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Sign above using your mouse or finger.</span>
        <button 
            type="button" 
            onClick={clearCanvas} 
            className="text-danger hover:underline flex items-center gap-1"
        >
            <RemoveIcon className="w-4 h-4" /> Clear
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
