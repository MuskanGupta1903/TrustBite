import { useState, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

export default function SlideToLogin({ onLogin }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);

  const handlePointerDown = (e) => {
    if (isUnlocked) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || isUnlocked) return;
    
    const trackBounds = trackRef.current.getBoundingClientRect();
    const thumbBounds = thumbRef.current.getBoundingClientRect();
    
    // Calculate new offset based on pointer position relative to track
    let newOffset = e.clientX - trackBounds.left - (thumbBounds.width / 2);
    
    // Constrain to track bounds
    const maxOffset = trackBounds.width - thumbBounds.width;
    newOffset = Math.max(0, Math.min(newOffset, maxOffset));
    
    setDragOffset(newOffset);
  };

  const handlePointerUp = (e) => {
    if (!isDragging || isUnlocked) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    const trackBounds = trackRef.current.getBoundingClientRect();
    const thumbBounds = thumbRef.current.getBoundingClientRect();
    const maxOffset = trackBounds.width - thumbBounds.width;
    
    // If dragged past 85% of the track, unlock
    if (dragOffset > maxOffset * 0.85) {
      setDragOffset(maxOffset);
      setIsUnlocked(true);
      setTimeout(() => {
        onLogin();
      }, 400); // Wait a tiny bit for the visual snap before navigating
    } else {
      // Snap back to start
      setDragOffset(0);
    }
  };

  return (
    <div 
      ref={trackRef}
      className="relative w-full max-w-sm h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center overflow-hidden shadow-inner"
    >
      {/* Background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-white/90 font-medium text-base tracking-wide">
          {isUnlocked ? "Logged in" : "Slide to login"}
        </span>
      </div>
      
      {/* Draggable thumb */}
      <div 
        ref={thumbRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ 
          transform: `translateX(${dragOffset}px)`, 
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
        }}
        className="absolute left-1 top-1 bottom-1 aspect-square rounded-full bg-white flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg z-10"
      >
        <ChevronRight className={`w-6 h-6 text-primary transition-opacity ${isUnlocked ? 'opacity-0' : 'opacity-100'}`} />
      </div>
    </div>
  );
}
