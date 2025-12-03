import React, { useEffect, useRef } from 'react';

interface QRCodeProps {
  text: string;
  size?: number;
}

const QRCodeComponent: React.FC<QRCodeProps> = ({ text, size = 100 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const QRCode = (window as any).QRCode;
    if (canvasRef.current && text && QRCode) {
      QRCode.toCanvas(canvasRef.current, text, { width: size, margin: 1, errorCorrectionLevel: 'H' }, (error: any) => {
        if (error) console.error("QR Code generation error:", error);
      });
    }
  }, [text, size]);

  if (!text) return null;

  return <canvas ref={canvasRef} />;
};

export default QRCodeComponent;