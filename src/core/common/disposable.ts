import { EmitableEvent, EventEmitter } from './eventEmitter';

interface DisposableEvent<T> extends EmitableEvent {
    active: (value: T) => void;
    dispose: (value: T) => void;
    destroy: () => void;
}

export class Disposable<T> extends EventEmitter<DisposableEvent<T>> {
    protected _data?: T;
    set data(value: T | null) {
        if (this.destroyed) {
            throw new Error(
                `Cannot set value of destroyed disposable variable.`
            );
        }
        if (value !== null) this._data = value;
    }
    get data(): T | null {
        if (this.destroyed) {
            throw new Error(
                `Cannot get value of destroyed disposable variable.`
            );
        }
        if (!this.activated) {
            return null;
        }
        return this._data!;
    }

    protected activated: boolean = false;
    protected destroyed: boolean = false;

    constructor(data: T) {
        super();
        this._data = data;
    }

    active() {
        if (this.activated) return;
        this.activated = true;
        this.emit('active', this._data!);
    }

    dispose() {
        if (!this.activated) return;
        this.activated = false;
        this.emit('dispose', this._data!);
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.emit('destroy');
        delete this._data;
    }
}
