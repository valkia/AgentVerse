import { debounce } from 'lodash-es';
import { ViewportOptions, ViewportState } from './types';

export class ViewportManager {
  private options: Required<ViewportOptions>;
  private state: ViewportState;
  private cleanup: (() => void)[] = [];
  
  constructor(options: ViewportOptions = {}) {
    this.options = {
      enableKeyboardAdapter: true,
      containerSelector: 'body',
      enableDvhFallback: true,
      cssVariable: '--vh',
      onHeightChange: () => {},
      debounceWait: 100,
      cleanupOnDestroy: true,
      ...options
    };

    this.state = {
      height: window.innerHeight,
      isKeyboardVisible: false,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
    };

    this.init();
  }

  private init() {
    // 设置初始高度
    this.updateHeight(this.getViewportHeight());

    // 添加事件监听
    const updateHeightDebounced = debounce(
      () => this.updateHeight(this.getViewportHeight()),
      this.options.debounceWait
    );

    // 视口变化监听
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', () => {
        this.updateHeight(window.visualViewport!.height);
      });
      window.visualViewport?.addEventListener('scroll', () => {
        this.updateHeight(window.visualViewport!.height);
      });
    } else {
      (window as Window & typeof globalThis).addEventListener('resize', updateHeightDebounced);
    }

    // 键盘监听
    if (this.options.enableKeyboardAdapter) {
      this.setupKeyboardListeners();
    }

    // 方向变化监听
    window.addEventListener('orientationchange', () => {
      // 等待方向变化完成
      setTimeout(() => {
        this.updateHeight(this.getViewportHeight());
      }, 150);
    });

    // 添加清理函数
    this.cleanup.push(() => {
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', updateHeightDebounced);
        window.visualViewport?.removeEventListener('scroll', updateHeightDebounced);
      }
      (window as Window & typeof globalThis).removeEventListener('resize', updateHeightDebounced);
      window.removeEventListener('orientationchange', updateHeightDebounced);
    });

    // 添加 dvh 回退样式
    if (this.options.enableDvhFallback) {
      this.setupDvhFallback();
    }

    this.setupBaseStyles();
  }

  private getViewportHeight(): number {
    if ('visualViewport' in window) {
      return window.visualViewport!.height;
    }
    return (window as Window & typeof globalThis).innerHeight;
  }

  private updateHeight(height: number) {
    if (height === 0) return; // 忽略无效高度
    
    this.state.height = height;
    const vh = height * 0.01;
    
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty(this.options.cssVariable, `${vh}px`);
      this.options.onHeightChange(height);
    });
  }

  private setupKeyboardListeners() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      window.addEventListener('focusin', () => {
        this.state.isKeyboardVisible = true;
        document.body.classList.add('keyboard-visible');
      });
      
      window.addEventListener('focusout', () => {
        this.state.isKeyboardVisible = false;
        document.body.classList.remove('keyboard-visible');
      });
    } else {
      // Android 设备通过视口高度变化检测键盘
      const threshold = window.innerHeight * 0.15;
      const checkKeyboard = () => {
        const isKeyboardVisible = window.innerHeight < this.state.height - threshold;
        if (isKeyboardVisible !== this.state.isKeyboardVisible) {
          this.state.isKeyboardVisible = isKeyboardVisible;
          document.body.classList.toggle('keyboard-visible', isKeyboardVisible);
        }
      };
      
      window.addEventListener('resize', checkKeyboard);
      this.cleanup.push(() => window.removeEventListener('resize', checkKeyboard));
    }
  }

  private setupDvhFallback() {
    const style = document.createElement('style');
    style.innerHTML = `
      [data-viewport-height] {
        height: 100vh;
        height: calc(var(${this.options.cssVariable}, 1vh) * 100);
        max-height: -webkit-fill-available;
      }
      .keyboard-visible [data-viewport-height] {
        height: calc(var(${this.options.cssVariable}, 1vh) * 100);
      }
    `;
    document.head.appendChild(style);
    this.cleanup.push(() => style.remove());
  }

  private setupBaseStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      /* 基础视口高度 */
      :root {
        --real-vh: 100vh;
      }

      /* 使用视口高度的元素 */
      [data-viewport-height] {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: var(--real-vh);
        overflow: hidden;
        /* 防止iOS橡皮筋效果 */
        overscroll-behavior: none;
        -webkit-overflow-scrolling: touch;
      }

      /* 内部可滚动区域 */
      [data-viewport-scroll] {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: contain;
      }
    `;
    
    document.head.appendChild(style);
    this.cleanup.push(() => style.remove());
  }

  public destroy() {
    if (this.options.cleanupOnDestroy) {
      this.cleanup.forEach(fn => fn());
      this.cleanup = [];
    }
  }

  public getState(): Readonly<ViewportState> {
    return { ...this.state };
  }
} 