/**
 * 应用的断点配置
 * 与 Tailwind CSS 的默认断点保持一致
 * @see https://tailwindcss.com/docs/breakpoints
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * 媒体查询字符串
 * 例如: { sm: '@media (min-width: 640px)' }
 */
export const mediaQueries = Object.entries(BREAKPOINTS).reduce(
  (acc, [key, value]) => ({
    ...acc,
    [key]: `@media (min-width: ${value}px)`,
  }),
  {} as Record<Breakpoint, string>
);

/**
 * 检查一个值是否为有效的断点
 */
export function isBreakpoint(value: string): value is Breakpoint {
  return value in BREAKPOINTS;
}

/**
 * 获取下一个更大的断点
 */
export function getNextBreakpoint(current: Breakpoint): Breakpoint | null {
  const breakpoints = Object.keys(BREAKPOINTS) as Breakpoint[];
  const currentIndex = breakpoints.indexOf(current);
  return currentIndex < breakpoints.length - 1 ? breakpoints[currentIndex + 1] : null;
}

/**
 * 获取下一个更小的断点
 */
export function getPrevBreakpoint(current: Breakpoint): Breakpoint | null {
  const breakpoints = Object.keys(BREAKPOINTS) as Breakpoint[];
  const currentIndex = breakpoints.indexOf(current);
  return currentIndex > 0 ? breakpoints[currentIndex - 1] : null;
} 