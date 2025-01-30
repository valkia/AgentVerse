import { LocalStorageProvider } from "./local";
import { DataProvider } from "./types";

export class MockHttpProvider<T extends { id: string }> implements DataProvider<T> {
  private localStorage: LocalStorageProvider<T>;
  private delay: number;

  constructor(storageKey: string, delay = 300) {
    this.localStorage = new LocalStorageProvider<T>(storageKey);
    this.delay = delay;
  }

  private async withDelay<R>(operation: () => Promise<R>): Promise<R> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
    try {
      return await operation();
    } catch (error) {
      // 模拟 HTTP 错误格式
      throw {
        status: 500,
        message: error instanceof Error ? error.message : 'Internal Server Error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async list(): Promise<T[]> {
    return this.withDelay(() => this.localStorage.list());
  }

  async get(id: string): Promise<T> {
    return this.withDelay(() => this.localStorage.get(id));
  }

  async create(data: Omit<T, "id">): Promise<T> {
    return this.withDelay(() => this.localStorage.create(data));
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.withDelay(() => this.localStorage.update(id, data));
  }

  async delete(id: string): Promise<void> {
    return this.withDelay(() => this.localStorage.delete(id));
  }
} 