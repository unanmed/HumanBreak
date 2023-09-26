import { EmitableEvent, EventEmitter } from '../common/eventEmitter';

export interface GameEvent extends EmitableEvent {
    reset: () => void;
    beforeMoveDirectly: (
        x: number,
        y: number,
        moveSteps: { direction: Dir; step: number }[],
        ctxName: string
    ) => void;
}

export const hook = new EventEmitter<GameEvent>();
