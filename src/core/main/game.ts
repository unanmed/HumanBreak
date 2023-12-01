import { EmitableEvent, EventEmitter } from '../common/eventEmitter';
import { loading } from '../loader/load';

export interface GameEvent extends EmitableEvent {
    /** Emitted in events.prototype.resetGame. */
    reset: () => void;
    /** Emitted in src/App.vue setup. */
    mounted: () => void;
    /** Emitted in plugin/ui.js */
    statusBarUpdate: () => void;
    /** Emitted in libs/events.js */
    afterGetItem: (
        itemId: AllIdsOf<'items'>,
        x: number,
        y: number,
        isGentleClick: boolean
    ) => void;
    afterOpenDoor: (doorId: AllIdsOf<'animates'>, x: number, y: number) => void;
}

export const hook = new EventEmitter<GameEvent>();

interface ListenerEvent extends EmitableEvent {
    // block
    hoverBlock: (block: Block, ev: MouseEvent) => void;
    leaveBlock: (block: Block, ev: MouseEvent, leaveGame: boolean) => void;
    clickBlock: (block: Block, ev: MouseEvent) => void;
    // mouse
    mouseMove: (ev: MouseEvent) => void;
}

class GameListener extends EventEmitter<ListenerEvent> {
    static num: number = 0;

    num: number = GameListener.num++;

    constructor() {
        super();

        if (!!window.core) {
            this.init();
        } else {
            loading.once('coreInit', () => {
                this.init();
            });
        }
    }

    private init() {
        // ----- block
        let lastHoverX = -1;
        let lastHoverY = -1;

        const data = core.canvas.data.canvas;

        const getBlockLoc = (px: number, py: number, size: number) => {
            return [
                Math.floor(((px * 32) / size - core.bigmap.offsetX) / 32),
                Math.floor(((py * 32) / size - core.bigmap.offsetY) / 32)
            ];
        };

        // hover & leave & mouseMove
        data.addEventListener('mousemove', e => {
            if (core.status.lockControl || !core.isPlaying()) return;
            this.emit('mouseMove', e);
            const {
                x: px,
                y: py,
                size
            } = core.actions._getClickLoc(e.clientX, e.clientY);
            const [bx, by] = getBlockLoc(px, py, size);
            const blocks = core.getMapBlocksObj();
            if (lastHoverX !== bx || lastHoverY !== by) {
                const lastBlock = blocks[`${lastHoverX},${lastHoverY}`];
                const block = blocks[`${bx},${by}`];
                if (!!lastBlock) {
                    this.emit('leaveBlock', lastBlock, e, false);
                }
                if (!!block) {
                    this.emit('hoverBlock', block, e);
                    lastHoverX = bx;
                    lastHoverY = by;
                } else {
                    lastHoverX = -1;
                    lastHoverY = -1;
                }
            }
        });
        data.addEventListener('mouseleave', e => {
            if (core.status.lockControl || !core.isPlaying()) return;
            const blocks = core.getMapBlocksObj();
            const lastBlock = blocks[`${lastHoverX},${lastHoverY}`];
            if (!!lastBlock) {
                this.emit('leaveBlock', lastBlock, e, true);
            }
            lastHoverX = -1;
            lastHoverY = -1;
        });
        // click
        data.addEventListener('click', e => {
            if (core.status.lockControl || !core.isPlaying()) return;
            const {
                x: px,
                y: py,
                size
            } = core.actions._getClickLoc(e.clientX, e.clientY);
            const [bx, by] = getBlockLoc(px, py, size);
            const blocks = core.getMapBlocksObj();
            const block = blocks[`${bx},${by}`];
            if (!!block) {
                this.emit('clickBlock', block, e);
            }
        });

        // ----- mouse
    }
}

export const gameListener = new GameListener();
