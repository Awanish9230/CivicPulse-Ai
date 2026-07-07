import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ImageCarousel = ({ images, alt = "Image", className = "" }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Normalize images array (handle cases where it might be a single string or undefined)
    const normalizedImages = Array.isArray(images) ? images.filter(Boolean) : (images ? [images] : []);

    if (normalizedImages.length === 0) return null;

    const nextImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % normalizedImages.length);
    };

    const prevImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + normalizedImages.length) % normalizedImages.length);
    };

    return (
        <div className={`relative group w-full h-full ${className}`}>
            <img 
                src={normalizedImages[currentIndex]} 
                alt={`${alt} ${currentIndex + 1}`} 
                className="w-full h-full object-cover transition-opacity duration-300"
                loading="lazy"
            />
            
            {normalizedImages.length > 1 && (
                <>
                    {/* Navigation Arrows */}
                    <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={prevImage}
                            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 backdrop-blur-sm transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            onClick={nextImage}
                            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 backdrop-blur-sm transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Pagination Dots */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                        {normalizedImages.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${
                                    idx === currentIndex ? 'bg-white w-3' : 'bg-white/60'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Image Counter Badge */}
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md">
                        {currentIndex + 1} / {normalizedImages.length}
                    </div>
                </>
            )}
        </div>
    );
};

export default ImageCarousel;
