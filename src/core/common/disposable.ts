import { EmitableEvent, EventEmitter } from './eventEmitter';

interface DisposableEvent<T> extends EmitableEvent {
    active: (value: T) => void;
    dispose: (value: T) => void;
}

export class Disposable<T> extends EventEmitter<DisposableEvent<T>> {
    protected _data: T;
    set data(value: T | null) {
        if (value !== null) this._data = value;
    }
    get data(): T | null {
        if (!this.activated) {
            return null;
        }
        return this._data;
    }

    protected activated: boolean = false;

    constructor(data: T) {
        super();
        this._data = data;
    }

    active() {
        this.activated = true;
        this.emit('active', this._data);
    }

    dispose() {
        this.activated = false;
        this.emit('dispose', this._data);
    }
}
