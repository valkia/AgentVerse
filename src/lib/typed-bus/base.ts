import { ITypedKey, IObservable, IObserver, ISubscription } from './types';

type IEventHandler<T> = (data: T) => void;

export class TypedEventEmitter {
    private handlers = new Map<string, Set<IEventHandler<unknown>>>();

    emit<T>(key: ITypedKey<T>, data: T): void {
        const handlers = this.handlers.get(key.id);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('Error in event handler:', error);
                }
            });
        }
    }

    on<T>(key: ITypedKey<T>, handler: IEventHandler<T>): void {
        if (typeof handler !== 'function') {
            throw new TypeError('Event handler must be a function');
        }
        if (!this.handlers.has(key.id)) {
            this.handlers.set(key.id, new Set());
        }
        const handlers = this.handlers.get(key.id)!;
        handlers.add(handler as IEventHandler<unknown>);
    }

    off<T>(key: ITypedKey<T>, handler: IEventHandler<T>): void {
        const handlers = this.handlers.get(key.id);
        if (handlers) {
            handlers.delete(handler as IEventHandler<unknown>);
            if (handlers.size === 0) {
                this.handlers.delete(key.id);
            }
        }
    }

    protected createObservable<T>(key: ITypedKey<T>): IObservable<T> {
        return {
            subscribe: (observer: IObserver<T>): ISubscription => {
                const handler = (data: T) => {
                    try {
                        observer.next(data);
                    } catch (error) {
                        if (observer.error) {
                            observer.error(error as Error);
                        } else {
                            console.error('Error in observer:', error);
                        }
                    }
                };
                
                this.on(key, handler);
                
                return {
                    unsubscribe: () => {
                        this.off(key, handler);
                        if (observer.complete) {
                            observer.complete();
                        }
                    }
                };
            }
        };
    }
} 