import React from 'react';
import { useViewportHeight } from './hooks';
import type { ViewportOptions } from './types';

interface ViewportProviderProps extends ViewportOptions {
  children: React.ReactNode;
}

export function ViewportProvider({ children, ...options }: ViewportProviderProps) {
  useViewportHeight(options);
  return <>{children}</>;
}

export const ViewportContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement>
>((props, ref) => {
  const { className, ...rest } = props;
  return (
    <div
      ref={ref}
      data-viewport-height
      className={className}
      {...rest}
    />
  );
});
ViewportContainer.displayName = 'ViewportContainer'; 