import { useState, useEffect, useRef } from 'react'

export default function LazyImage({ 
  src, 
  alt, 
  fallback = null, 
  className = '',
  containerClassName = '',
  onError = null
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef(null)
  const containerRef = useRef(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.01
      }
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
    if (onError) onError()
  }

  // Generate fallback element
  const renderFallback = () => {
    if (fallback) return fallback

    // Default fallback: gradient circle with first letter
    const firstLetter = alt ? alt.charAt(0).toUpperCase() : '?'
    return (
      <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center">
        <span className="text-white font-bold text-lg">
          {firstLetter}
        </span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={containerClassName || 'w-16 h-16 mx-auto mb-3'}>
      {!src || hasError ? (
        renderFallback()
      ) : isInView ? (
        <div className="relative w-full h-full">
          {/* Loading skeleton */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse"></div>
          )}
          
          {/* Actual image */}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        </div>
      ) : (
        // Placeholder before image enters viewport
        <div className="w-full h-full bg-gray-200 rounded-full"></div>
      )}
    </div>
  )
}
