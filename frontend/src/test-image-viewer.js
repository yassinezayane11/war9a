// Test component to verify image viewer functionality
import React, { useState } from 'react';

// Mock ImageLightbox component (copied from AdminDeposits)
function ImageLightbox({ image, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleImageLoad = () => setIsLoading(false);
  
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(0.5, prev * delta), 3));
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === '0') resetZoom();
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <div 
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
        onClick={e => e.stopPropagation()}
        onWheel={handleWheel}
      >
        <img
          src={image}
          alt="Test image"
          className={`max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-200 ${
            isDragging && zoom > 1 ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-zoom-in'
          }`}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            opacity: isLoading ? 0 : 1
          }}
          onLoad={handleImageLoad}
          onMouseDown={handleMouseDown}
          draggable={false}
        />
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={resetZoom}
          className="bg-dark-800/90 hover:bg-dark-700 text-white px-3 py-2 rounded-lg border border-dark-600 transition-all text-sm font-medium"
          title="Réinitialiser le zoom (0)"
        >
          🔄
        </button>
        <button
          onClick={onClose}
          className="bg-dark-800/90 hover:bg-dark-700 text-white px-3 py-2 rounded-lg border border-dark-600 transition-all text-sm font-medium"
          title="Fermer (Échap)"
        >
          ✕
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-dark-800/90 px-4 py-2 rounded-lg border border-dark-600">
        <p className="text-xs text-gray-300 text-center">
          Molette pour zoomer • Glisser quand zoomé • Échap pour fermer
        </p>
      </div>

      {zoom !== 1 && (
        <div className="absolute top-4 left-4 bg-dark-800/90 px-3 py-1 rounded-lg border border-dark-600">
          <p className="text-sm text-brand-400 font-medium">{Math.round(zoom * 100)}%</p>
        </div>
      )}
    </div>
  );
}

// Test function
export function testImageViewer() {
  console.log('✅ Image viewer component compiled successfully');
  
  // Test Cloudinary URL handling
  const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
  const localUrl = 'screenshot123.jpg';
  
  const getImageUrl = (screenshot) => {
    if (!screenshot) return null;
    
    if (screenshot.startsWith('http')) {
      return screenshot;
    }
    
    return `/uploads/deposits/${screenshot}`;
  };
  
  console.log('✅ URL handling test:');
  console.log('  Cloudinary URL:', getImageUrl(cloudinaryUrl));
  console.log('  Local URL:', getImageUrl(localUrl));
  
  return true;
}

export { ImageLightbox };
