import { EmitableEvent, EventEmitter } from '../common/eventEmitter';

export interface GameEvent extends EmitableEvent {
    /** Emitted in events.prototype.resetGame. */
    reset: () => void;
    /** Emitted in src/App.vue setup. */
    mounted: () => void;
}

export const hook = new EventEmitter<GameEvent>();
