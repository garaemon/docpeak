import {useState, useCallback, useEffect, useRef} from 'react';

interface UseResizableOptions {
  initialHeight: number;
  minHeight?: number;
  maxHeight?: number;
}

interface UseResizableReturn {
  height: number;
  isDragging: boolean;
  handleMouseDown: (event: React.MouseEvent) => void;
}

export const useResizable = ({
  initialHeight,
  minHeight = 100,
  maxHeight = window.innerHeight - 200,
}: UseResizableOptions): UseResizableReturn => {
  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setIsDragging(true);
      startYRef.current = event.clientY;
      startHeightRef.current = height;
    },
    [height],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = event.clientY - startYRef.current;
      const newHeight = startHeightRef.current + deltaY;

      // Apply constraints
      const constrainedHeight = Math.max(
        minHeight,
        Math.min(maxHeight, newHeight),
      );

      setHeight(constrainedHeight);
    },
    [isDragging, minHeight, maxHeight],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
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
    height,
    isDragging,
    handleMouseDown,
  };
};

export default useResizable;
