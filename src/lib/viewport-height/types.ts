export interface ViewportOptions {
  // 是否启用键盘适配
  enableKeyboardAdapter?: boolean;
  // 自定义容器选择器,默认为 body
  containerSelector?: string;
  // 是否启用 dvh 回退
  enableDvhFallback?: boolean;
  // 自定义 CSS 变量名
  cssVariable?: string;
  // 自定义事件处理
  onHeightChange?: (height: number) => void;
  // 防抖时间
  debounceWait?: number;
  // 是否在组件卸载时清理
  cleanupOnDestroy?: boolean;
}

// 视口状态
export interface ViewportState {
  height: number;
  isKeyboardVisible: boolean;
  orientation: 'portrait' | 'landscape';
} 