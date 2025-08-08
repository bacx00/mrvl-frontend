import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

// QR Code Display Component
function QRCodeDisplay({ value, size = 200, className = '', errorCorrectionLevel = 'M' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    const generateQR = async () => {
      try {
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          height: size,
          errorCorrectionLevel,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          margin: 1
        });
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [value, size, errorCorrectionLevel]);

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-sm"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}

export default QRCodeDisplay;