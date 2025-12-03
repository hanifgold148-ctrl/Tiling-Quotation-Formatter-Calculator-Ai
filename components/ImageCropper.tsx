import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import LoadingSpinner from './LoadingSpinner';

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

// Utility to get a cropped image file from canvas
async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string
): Promise<File> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context is not available');
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        resolve(file);
      },
      'image/jpeg',
      0.95 // quality
    );
  });
}

// Function to center the initial crop
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}


const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 16 / 9));
  }

  const handleConfirm = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
        setIsProcessing(true);
        try {
            const croppedFile = await getCroppedImg(imgRef.current, completedCrop, 'cropped-notes.jpeg');
            onConfirm(croppedFile);
        } catch(e) {
            console.error("Cropping failed", e);
            // Optionally, show an error to the user
            onCancel(); // Close the cropper on error
        } finally {
            setIsProcessing(false);
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Crop Image</h2>
        <p className="text-slate-600 mb-4">Drag to select the area of the image containing your notes, then click 'Confirm'.</p>
        <div className="max-h-[60vh] overflow-auto border rounded-md">
            <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={undefined} // Free crop
            >
                <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageSrc}
                    onLoad={onImageLoad}
                    style={{ maxHeight: '70vh' }}
                />
            </ReactCrop>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!completedCrop?.width || !completedCrop?.height || isProcessing}
            className="w-36 flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-slate-400"
          >
            {isProcessing ? <><LoadingSpinner /> Processing...</> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
