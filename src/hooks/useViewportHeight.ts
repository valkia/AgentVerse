import { useCallback, useEffect, useState } from 'react';

interface ViewportState {
  height: number;
  isKeyboardVisible: boolean;
  keyboardHeight: number;
}

export function useViewportHeight(): ViewportState {
  const [state, setState] = useState<ViewportState>(() => ({
    height: window.innerHeight,
    isKeyboardVisible: false,
    keyboardHeight: 0
  }));

  const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  const getVisibleHeight = useCallback((): number => {
    if (window.visualViewport) {
      return window.visualViewport.height;
    }
    return window.innerHeight;
  }, []);

  const updateViewportState = useCallback(() => {
    const currentHeight = getVisibleHeight();
    const maxHeight = Math.max(window.innerHeight, currentHeight);
    const heightDiff = maxHeight - currentHeight;
    const keyboardThreshold = maxHeight * 0.15;
    const isKeyboardVisible = heightDiff > keyboardThreshold;

    setState({
      height: currentHeight,
      isKeyboardVisible,
      keyboardHeight: isKeyboardVisible ? heightDiff : 0
    });
  }, [getVisibleHeight]);

  useEffect(() => {
    if (!isMobile) {
      window.addEventListener('resize', updateViewportState);
      return () => window.removeEventListener('resize', updateViewportState);
    }

    let cleanup: (() => void)[] = [];

    if (window.visualViewport) {
      const handleViewportChange = () => {
        requestAnimationFrame(updateViewportState);
      };

      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);

      cleanup.push(() => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
        window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      });
    }

    if (isIOS) {
      const handleFocusIn = () => {
        setTimeout(updateViewportState, 300);
      };

      const handleFocusOut = () => {
        setTimeout(updateViewportState, 100);
      };

      window.addEventListener('focusin', handleFocusIn);
      window.addEventListener('focusout', handleFocusOut);

      cleanup.push(() => {
        window.removeEventListener('focusin', handleFocusIn);
        window.removeEventListener('focusout', handleFocusOut);
      });
    }

    if (!isIOS && isMobile) {
      const handleResize = () => {
        requestAnimationFrame(updateViewportState);
      };

      window.addEventListener('resize', handleResize);
      cleanup.push(() => window.removeEventListener('resize', handleResize));
    }

    const handleOrientationChange = () => {
      setTimeout(updateViewportState, 150);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    cleanup.push(() => window.removeEventListener('orientationchange', handleOrientationChange));

    updateViewportState();

    return () => cleanup.forEach(fn => fn());
  }, [isMobile, isIOS, updateViewportState]);

  return state;
} 