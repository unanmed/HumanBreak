import { EmitableEvent, EventEmitter } from '../common/eventEmitter';

export interface GameEvent extends EmitableEvent {
    reset: () => void;
}

export const hook = new EventEmitter<GameEvent>();
