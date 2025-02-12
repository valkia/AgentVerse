import { useContext } from 'react';
import { BreakpointContext } from '@/contexts/breakpoint-context';

export function useBreakpoint() {
  const context = useContext(BreakpointContext);
  if (!context) {
    throw new Error('useBreakpoint must be used within a BreakpointProvider');
  }
  return context;
}