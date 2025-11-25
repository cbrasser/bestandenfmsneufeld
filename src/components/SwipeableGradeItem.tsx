import { useState, useRef, useEffect } from 'react';
import type { Grade } from '../types';
import { Edit2, Trash2 } from 'lucide-react';

// Hook to detect if we're on a large screen
const useIsLargeScreen = () => {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 768); // md breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return isLargeScreen;
};

interface SwipeableGradeItemProps {
  grade: Grade;
  onEdit: () => void;
  onDelete: () => void;
}

export const SwipeableGradeItem = ({
  grade,
  onEdit,
  onDelete,
}: SwipeableGradeItemProps) => {
  const isLargeScreen = useIsLargeScreen();
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 80; // pixels to swipe before triggering

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      // Determine if this is a horizontal or vertical swipe
      if (!isHorizontalSwipe && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        setIsHorizontalSwipe(true);
      }

      // Only prevent default if it's a horizontal swipe
      if (isHorizontalSwipe && Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault();
        setCurrentX(deltaX);

        // Limit swipe distance
        if (deltaX < -SWIPE_THRESHOLD) {
          setIsSwipeOpen(true);
        } else if (deltaX > 10) {
          setIsSwipeOpen(false);
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      setIsHorizontalSwipe(false);

      if (currentX < -SWIPE_THRESHOLD) {
        setIsSwipeOpen(true);
      } else {
        setIsSwipeOpen(false);
      }
      setCurrentX(0);
    };

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, startX, startY, currentX, isHorizontalSwipe]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
    setIsHorizontalSwipe(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      setCurrentX(deltaX);

      if (deltaX < -SWIPE_THRESHOLD) {
        setIsSwipeOpen(true);
      } else if (deltaX > 10) {
        setIsSwipeOpen(false);
      }
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);

      if (currentX < -SWIPE_THRESHOLD) {
        setIsSwipeOpen(true);
      } else {
        setIsSwipeOpen(false);
      }
      setCurrentX(0);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startX, currentX]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const offsetX = isSwipeOpen && !isLargeScreen ? -120 : Math.min(0, currentX);

  return (
    <div className="relative overflow-hidden rounded" style={{ touchAction: 'pan-y' }}>
      {/* Actions behind (only for mobile swipe) */}
      {!isLargeScreen && (
        <div className="absolute inset-y-0 right-0 flex items-center bg-gray-300 dark:bg-gray-600">
          <div className="flex items-center gap-2 px-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setIsSwipeOpen(false);
              }}
              className="p-2 bg-blue-500 text-white rounded transition-colors hover:bg-blue-600"
              aria-label="Edit grade"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setIsSwipeOpen(false);
              }}
              className="p-2 bg-red-600 text-white rounded transition-colors hover:bg-red-700"
              aria-label="Delete grade"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Grade item */}
      <div
        ref={itemRef}
        onTouchStart={!isLargeScreen ? handleTouchStart : undefined}
        onMouseDown={!isLargeScreen ? handleMouseDown : undefined}
        className="relative bg-gray-50 dark:bg-gray-700 rounded text-sm transition-transform duration-200"
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
      >
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {roundToTwoDecimals(grade.value).toFixed(2)}
            </span>
            {grade.weight !== 1 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">(×{grade.weight})</span>
            )}
            {grade.label && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{grade.label}</span>
            )}
          </div>
          {/* Show buttons on large screens */}
          {isLargeScreen && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                aria-label="Edit grade"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                aria-label="Delete grade"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function
const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

