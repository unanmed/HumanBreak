import { drawRoute } from '../../plugin/fx/drawRoute';
import { nextFrame } from '../../plugin/utils';
import { EmitableEvent, EventEmitter } from '../common/eventEmitter';

export interface GameEvent extends EmitableEvent {
    reset: () => void;
    beforeMoveDirectly: (
        x: number,
        y: number,
        moveSteps: DiredLoc[]
    ) => void;
}

export const hook = new EventEmitter<GameEvent>();

hook.on('beforeMoveDirectly', (x, y, moveSteps) => {
    // if (!storage.getValue('directMovePath', true)) return;
    const paint = [ // 先粗后细
        { color: '#333', width: 6, length: 12, size: 10 },
        { color: '#FFD700', width: 4, length: 14, size: 8 }
    ];
    const ctx = drawRoute({ x, y }, moveSteps, paint);
    ctx.canvas.style.transition = 'all 0.6s ease-in';
    nextFrame(() => (ctx.canvas.style.opacity = '0'));
});