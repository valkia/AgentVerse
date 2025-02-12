import { Breakpoint } from '@/constants/breakpoints';

export interface BreakpointContextValue {
  breakpoint: Breakpoint;
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isGreaterThan: (bp: Breakpoint) => boolean;
  isLessThan: (bp: Breakpoint) => boolean;
} 