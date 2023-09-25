import { EmitableEvent, EventEmitter } from '../common/eventEmitter';

export interface GameEvent extends EmitableEvent {
    reset: () => void;
    moveDirectly: (
        x: number,
        y: number,
        moveSteps: Array<{ direction: string; step: number }>,
        ctx: CanvasRenderingContext2D
    ) => void;
}

export const hook = new EventEmitter<GameEvent>();
