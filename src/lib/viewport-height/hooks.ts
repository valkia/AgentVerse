import { useEffect, useRef } from 'react';
import { ViewportManager } from './viewport';
import type { ViewportOptions } from './types';

export function useViewportHeight(options?: ViewportOptions) {
  const managerRef = useRef<ViewportManager | null>(null);

  useEffect(() => {
    managerRef.current = new ViewportManager(options);
    return () => managerRef.current?.destroy();
  }, []);

  return managerRef.current;
} 