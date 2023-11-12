import { EmitableEvent, EventEmitter } from '../common/eventEmitter';
import { loading } from '../loader/load';

export interface GameEvent extends EmitableEvent {
    /** Emitted in events.prototype.resetGame. */
    reset: () => void;
    /** Emitted in src/App.vue setup. */
    mounted: () => void;
}

export const hook = new EventEmitter<GameEvent>();

interface ListenerEvent extends EmitableEvent {
    hoverBlock: (block: Block) => void;
    leaveBlock: (block: Block) => void;
    clickBlock: (block: Block) => void;
}

class GameListener extends EventEmitter<ListenerEvent> {
    static num: number = 0;

    num: number = GameListener.num++;

    constructor() {
        super();

        loading.once('coreInit', () => {
            this.init();
        });
    }

    private init() {
        // block
        let lastHoverX = -1;
        let lastHoverY = -1;

        const getBlockLoc = (px: number, py: number) => {
            return [
                Math.floor((px - core.bigmap.offsetX) / 32),
                Math.floor((py - core.bigmap.offsetY) / 32)
            ];
        };

        core.registerAction(
            'onmove',
            `@GameListener_${this.num}_block`,
            (x, y, px, py) => {
                if (core.status.lockControl || !core.isPlaying()) return false;
                const [bx, by] = getBlockLoc(px, py);
                const blocks = core.getMapBlocksObj();
                if (lastHoverX !== bx || lastHoverY !== by) {
                    const lastBlock = blocks[`${lastHoverX},${lastHoverY}`];
                    const block = blocks[`${bx},${by}`];
                    if (!!lastBlock) {
                        this.emit('leaveBlock', lastBlock);
                    }
                    if (!!block) {
                        this.emit('hoverBlock', block);
                        lastHoverX = bx;
                        lastHoverY = by;
                    } else {
                        lastHoverX = -1;
                        lastHoverY = -1;
                    }
                }
                return false;
            },
            50
        );
        core.canvas.data.canvas.addEventListener('mouseleave', () => {
            if (core.status.lockControl || !core.isPlaying()) return;
            const blocks = core.getMapBlocksObj();
            const lastBlock = blocks[`${lastHoverX},${lastHoverY}`];
            if (!!lastBlock) {
                this.emit('leaveBlock', lastBlock);
            }
            lastHoverX = -1;
            lastHoverY = -1;
        });
        core.registerAction(
            'onup',
            `@GameListener_${this.num}_block`,
            (x, y, px, py) => {
                if (core.status.lockControl || !core.isPlaying()) return false;
                const [bx, by] = getBlockLoc(px, py);
                const blocks = core.getMapBlocksObj();
                const block = blocks[`${bx},${by}`];
                if (!!block) {
                    this.emit('clickBlock', block);
                }
                return false;
            },
            50
        );
    }
}

export const gameListener = new GameListener();
