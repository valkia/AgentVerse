import { useState, useCallback } from 'react';

interface RequestState {
  loading: boolean;
  error: Error | null;
}

interface UseRequestOptions {
  // 防抖时间，单位毫秒
  debounceTime?: number;
  // 最小loading显示时间，避免闪烁
  minLoadingTime?: number;
}

export function useRequest(options: UseRequestOptions = {}) {
  const { debounceTime = 300, minLoadingTime = 500 } = options;
  const [state, setState] = useState<RequestState>({
    loading: false,
    error: null,
  });

  const withLoading = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    let loadingTimer: NodeJS.Timeout | null = null;
    let startTime: number = 0;

    // 延迟显示loading状态，避免短请求的闪烁
    const loadingTimeout = new Promise<void>(resolve => {
      loadingTimer = setTimeout(() => {
        startTime = Date.now();
        setState(prev => ({ ...prev, loading: true }));
        resolve();
      }, debounceTime);
    });

    try {
      // 等待 loading 状态或请求完成，先发生者优先
      await Promise.race([loadingTimeout, promise]);
      const result = await promise;

      // 确保最小loading时间
      if (startTime) {
        const elapsed = Date.now() - startTime;
        if (elapsed < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed));
        }
      }

      setState({ loading: false, error: null });
      return result;
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    } finally {
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
    }
  }, [debounceTime, minLoadingTime]);

  return {
    ...state,
    withLoading,
  };
} 