import {useState, useCallback, useEffect, useRef} from 'react';

interface UseHorizontalResizableOptions {
  initialWidth: number;
  minWidth?: number;
  maxWidth?: number;
}

interface UseHorizontalResizableReturn {
  width: number;
  isDragging: boolean;
  handleMouseDown: (event: React.MouseEvent) => void;
}

export const useHorizontalResizable = ({
  initialWidth,
  minWidth = 250,
  maxWidth = window.innerWidth - 300,
}: UseHorizontalResizableOptions): UseHorizontalResizableReturn => {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setIsDragging(true);
      startXRef.current = event.clientX;
      startWidthRef.current = width;
    },
    [width],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = startXRef.current - event.clientX; // Reverse delta for right-side panel
      const newWidth = startWidthRef.current + deltaX;

      // Apply constraints
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      setWidth(constrainedWidth);
    },
    [isDragging, minWidth, maxWidth],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    width,
    isDragging,
    handleMouseDown,
  };
};

export default useHorizontalResizable;
