import { useEffect, useState } from 'react';

export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface ResourceOptions {
  minLoadingTime?: number;  // 最小加载时间
  retryTimes?: number;      // 重试次数
  retryDelay?: number;      // 重试延迟
}

export interface IResourceManager<T> {
  read(): T;
  reload(promise: Promise<T>): void;
}

const DEFAULT_OPTIONS: ResourceOptions = {
  minLoadingTime: 600,    // 默认最小加载时间600ms
  retryTimes: 3,
  retryDelay: 1000,
};

export class ResourceManagerImpl<T> implements IResourceManager<T> {
  private state: ResourceState<T> = {
    data: null,
    loading: true,
    error: null,
  };
  private listeners: Set<(state: ResourceState<T>) => void> = new Set();
  private loadStartTime: number = 0;
  private options: ResourceOptions;

  constructor(
    private promise: Promise<T>,
    options: ResourceOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.initialize();
  }

  private initialize() {
    this.loadStartTime = Date.now();
    this.promise
      .then(async (data) => {
        // 确保最小加载时间
        const elapsed = Date.now() - this.loadStartTime;
        const minTime = this.options.minLoadingTime || 0;
        if (elapsed < minTime) {
          await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
        }
        this.setState({ data, loading: false, error: null });
      })
      .catch(error => {
        this.setState({ data: null, loading: false, error });
      });
  }

  private setState(newState: Partial<ResourceState<T>>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: ResourceState<T>) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  read(): T {
    if (this.state.error) {
      throw this.state.error;
    }
    if (this.state.loading || !this.state.data) {
      throw this.promise;
    }
    return this.state.data;
  }

  getState(): ResourceState<T> {
    return this.state;
  }

  reload(promise: Promise<T>) {
    this.promise = promise;
    this.setState({ loading: true, error: null });
    this.initialize();
  }
}

// React Hook
export function useResource<T>(resource: ResourceManagerImpl<T>): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>(resource.getState());

  useEffect(() => {
    return resource.subscribe(setState);
  }, [resource]);

  return state;
}

export function createResource<T>(
  promise: Promise<T>,
  options?: ResourceOptions
): ResourceManagerImpl<T> {
  return new ResourceManagerImpl(promise, options);
} 