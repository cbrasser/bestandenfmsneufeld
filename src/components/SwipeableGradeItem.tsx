import { useState, useRef, useEffect } from 'react';
import type { Grade } from '../types';
import { Edit2, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/context';

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
  const { t } = useI18n();
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

  const offsetX = isSwipeOpen && !isLargeScreen ? -108 : Math.min(0, currentX);

  return (
    <div className="grade">
      {/* Actions behind (only for mobile swipe) */}
      {!isLargeScreen && (
        <div
          className="grade-actions"
          style={{ visibility: isSwipeOpen || currentX < 0 ? 'visible' : 'hidden' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
              setIsSwipeOpen(false);
            }}
            className="btn btn-icon"
            aria-label={t('editGrade')}
          >
            <Edit2 size={16} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setIsSwipeOpen(false);
            }}
            className="btn btn-icon"
            aria-label={t('deleteGrade')}
          >
            <Trash2 size={16} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Grade item */}
      <div
        ref={itemRef}
        onTouchStart={!isLargeScreen ? handleTouchStart : undefined}
        onMouseDown={!isLargeScreen ? handleMouseDown : undefined}
        className="grade-row"
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
      >
        <span className="grade-value">{roundToTwoDecimals(grade.value).toFixed(2)}</span>
        <div className="grade-text">
          {grade.label && <span className="grade-label">{grade.label}</span>}
          {grade.date && (
            <span className="grade-date">
              {new Date(grade.date).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          )}
        </div>
        <div className="grade-tags">
          {grade.weight !== 1 && <span>×{grade.weight}</span>}
          {grade.semester && (
            <span className="chip">{grade.semester === 'Herbstsemester' ? 'HS' : 'FS'}</span>
          )}
        </div>
        {/* Show buttons on large screens */}
        {isLargeScreen && (
          <div className="flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="btn btn-quiet btn-sm btn-icon"
              aria-label={t('editGrade')}
            >
              <Edit2 size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="btn btn-quiet btn-sm btn-icon"
              aria-label={t('deleteGrade')}
            >
              <Trash2 size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function
const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};
