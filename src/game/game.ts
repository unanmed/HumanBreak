import { EmitableEvent, EventEmitter } from '../core/common/eventEmitter';

// ----- 加载事件
interface GameLoadEvent extends EmitableEvent {
    coreLoaded: () => void;
    autotileLoaded: () => void;
    coreInit: () => void;
    materialLoaded: () => void;
}

class GameLoading extends EventEmitter<GameLoadEvent> {
    private autotileLoaded: number = 0;
    private autotileNum?: number;
    private autotileListened: boolean = false;

    private materialsNum: number = main.materials.length;
    private materialsLoaded: number = 0;

    constructor() {
        super();
        this.on(
            'coreInit',
            () => {
                this.autotileNum = Object.keys(
                    core.material.icons.autotile
                ).length;
            },
            { immediate: true }
        );
        this.on('materialLoaded', () => {
            core.loader._loadMaterials_afterLoad();
        });
    }

    addMaterialLoaded() {
        this.once('coreInit', () => {
            this.materialsLoaded++;
            if (this.materialsLoaded === this.materialsNum) {
                this.emit('materialLoaded');
            }
        });
    }

    addAutotileLoaded() {
        this.once('coreInit', () => {
            this.autotileLoaded++;
            if (this.autotileLoaded === this.autotileNum) {
                this.emit('autotileLoaded');
            }
        });
    }

    /**
     * 当自动原件加载完毕时
     * @param autotiles 自动原件数组
     */
    onAutotileLoaded(
        autotiles: Partial<Record<AllIdsOf<'autotile'>, HTMLImageElement>>
    ) {
        if (this.autotileListened) return;
        this.autotileListened = true;
        this.on('autotileLoaded', () => {
            const keys = Object.keys(
                core.material.icons.autotile
            ) as AllIdsOf<'autotile'>[];

            keys.forEach(v => {
                core.material.images.autotile[v] = autotiles[v]!;
            });

            setTimeout(() => {
                core.maps._makeAutotileEdges();
            });
        });
    }
}

export const loading = new GameLoading();

export interface GameEvent extends EmitableEvent {
    /** Emitted in events.prototype.resetGame. */
    reset: () => void;
    /** Emitted in src/App.vue setup. */
    mounted: () => void;
    /** Emitted in plugin/ui.js */
    statusBarUpdate: () => void;
    /** Emitted in core/index.ts */
    renderLoaded: () => void;
    // /** Emitted in libs/events.js */
    // afterGetItem: (
    //     itemId: AllIdsOf<'items'>,
    //     x: number,
    //     y: number,
    //     isGentleClick: boolean
    // ) => void;
    // afterOpenDoor: (doorId: AllIdsOf<'animates'>, x: number, y: number) => void;
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
                Math.floor(((px * 32) / size + core.bigmap.offsetX) / 32),
                Math.floor(((py * 32) / size + core.bigmap.offsetY) / 32)
            ];
        };

        // hover & leave & mouseMove
        data.addEventListener('mousemove', e => {
            if (
                core.status.lockControl ||
                !core.isPlaying() ||
                !core.status.floorId
            )
                return;
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
            if (
                core.status.lockControl ||
                !core.isPlaying() ||
                !core.status.floorId
            )
                return;
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
            if (
                core.status.lockControl ||
                !core.isPlaying() ||
                !core.status.floorId
            )
                return;
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

declare global {
    interface Main {
        loading: GameLoading;
    }
}
