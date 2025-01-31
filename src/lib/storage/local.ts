import { nanoid } from "nanoid";
import { DataProvider } from "./types";

export class LocalStorageProvider<T extends { id: string }> implements DataProvider<T> {
  constructor(private readonly storageKey: string) {}

  private getStoredItems(): T[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private setStoredItems(items: T[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  async list(): Promise<T[]> {
    return this.getStoredItems();
  }

  async get(id: string): Promise<T> {
    const item = this.getStoredItems().find(item => item.id === id);
    if (!item) throw new Error('Item not found');
    return item;
  }

  async create(data: Omit<T, "id">): Promise<T> {
    const items = this.getStoredItems();
    const newItem = { ...data, id: nanoid() } as T;
    this.setStoredItems([newItem, ...items]);
    return newItem;
  }

  async createMany(dataArray: Omit<T, "id">[]): Promise<T[]> {
    const items = this.getStoredItems();
    const newItems = dataArray.map(data => ({ ...data, id: nanoid() } as T));
    this.setStoredItems([...items, ...newItems]);
    return newItems;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const items = this.getStoredItems();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Item not found');
    
    const updatedItem = { ...items[index], ...data };
    items[index] = updatedItem;
    this.setStoredItems(items);
    return updatedItem;
  }

  async delete(id: string): Promise<void> {
    const items = this.getStoredItems();
    this.setStoredItems(items.filter(item => item.id !== id));
  }
} 