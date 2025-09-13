import React from 'react';
import Image from 'next/image';
import LoadingSpinner from './ui/LoadingSpinner';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  blurDataURL?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 500,
  height = 300,
  className = '',
  priority = false,
  quality = 75,
  blurDataURL
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
        onError={(e) => {
          // Fallback to placeholder if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const fallback = document.createElement('div');
            fallback.className = 'w-full h-full bg-muted flex items-center justify-center';
            fallback.innerHTML = '<div class="text-muted-foreground">Image not available</div>';
            parent.appendChild(fallback);
          }
        }}
      />
    </div>
  );
};

interface LazyImageProps extends OptimizedImageProps {
  threshold?: number;
  rootMargin?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority,
  quality,
  blurDataURL,
  threshold = 0.1,
  rootMargin = '0px'
}) => {
  const [isInView, setIsInView] = React.useState(false);
  const imgRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!imgRef.current || priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [threshold, rootMargin, priority]);

  if (!isInView && !priority) {
    return (
      <div 
        ref={imgRef}
        className={`bg-muted flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      quality={quality}
      blurDataURL={blurDataURL}
    />
  );
};

export { OptimizedImage, LazyImage };
export default OptimizedImage;