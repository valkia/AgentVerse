import { IEventBus, ITypedKey, IObservable } from '../types';
import { TypedEventEmitter } from '../base';
import { syncMethod, skipMiddleware } from '../decorators';

export class EventBus extends TypedEventEmitter implements IEventBus {
    @syncMethod()
    emit<T>(key: ITypedKey<T>, data: T): void {
        super.emit(key, data);
    }

    @syncMethod()
    on<T>(key: ITypedKey<T>, handler: (data: T) => void): void {
        super.on(key, handler);
    }

    @syncMethod()
    off<T>(key: ITypedKey<T>, handler: (data: T) => void): void {
        super.off(key, handler);
    }

    @syncMethod()
    @skipMiddleware()
    observe<T>(key: ITypedKey<T>): IObservable<T> {
        return super.createObservable(key);
    }
} 