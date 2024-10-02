import { EventEmitter } from '../core/common/eventEmitter';
import type { DamageEnemy, EnemyCollection } from './enemy/damage';

// ----- 加载事件
interface GameLoadEvent {
    coreLoaded: () => void;
    autotileLoaded: () => void;
    coreInit: () => void;
    loaded: () => void;
    materialLoaded: () => void;
}

class GameLoading extends EventEmitter<GameLoadEvent> {
    private autotileLoaded: number = 0;
    private autotileNum?: number;
    private autotileListened: boolean = false;

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

    addAutotileLoaded() {
        this.autotileLoaded++;
        if (this.autotileLoaded === this.autotileNum) {
            this.emit('autotileLoaded');
        }
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

export interface GameEvent {
    /** Emitted in libs/events.js resetGame. */
    reset: () => void;
    /** Emitted in src/App.vue setup. */
    mounted: () => void;
    /** Emitted in plugin/game/ui.ts updateStatusBar_update */
    statusBarUpdate: () => void;
    /** Emitted in core/index.ts */
    renderLoaded: () => void;
    /** Emitted in libs/events.js getItem */
    afterGetItem: (
        itemId: AllIdsOf<'items'>,
        x: number,
        y: number,
        isGentleClick: boolean
    ) => void;
    /** Emitted in libs/events.js _openDoor_animate */
    afterOpenDoor: (doorId: AllIdsOf<'animates'>, x: number, y: number) => void;
    /** Emitted in project/functions.js afterChangeFloor */
    afterChangeFloor: (floorId: FloorIds) => void;
    /** Emitted in project/functions.js moveOneStep */
    moveOneStep: (x: number, y: number, floorId: FloorIds) => void;
    /** Emitted in src/game/enemy/battle.ts afterBattle */
    afterBattle: (enemy: DamageEnemy, x?: number, y?: number) => void;
    /** Emitted in libs/events.js changingFloor */
    changingFloor: (floorId: FloorIds, heroLoc: Loc) => void;
    /** Emitted in libs/maps.js setBlock */
    setBlock: (
        x: number,
        y: number,
        floorId: FloorIds,
        newBlock: AllNumbers,
        oldBlock: AllNumbers
    ) => void;
    /** Emitted in game/enemy/damage.ts */
    enemyExtract: (col: EnemyCollection) => void;
}

export const hook = new EventEmitter<GameEvent>();

interface ListenerEvent {
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

    mouseX: number = -1;
    mouseY: number = -1;

    constructor() {
        super();
        if (main.replayChecking) return;
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
            if (this.mouseX !== bx || this.mouseY !== by) {
                const lastBlock = blocks[`${this.mouseX},${this.mouseY}`];
                const block = blocks[`${bx},${by}`];
                if (!!lastBlock) {
                    this.emit('leaveBlock', lastBlock, e, false);
                }
                if (!!block) {
                    this.emit('hoverBlock', block, e);
                    this.mouseX = bx;
                    this.mouseY = by;
                } else {
                    this.mouseX = -1;
                    this.mouseY = -1;
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
            const lastBlock = blocks[`${this.mouseX},${this.mouseY}`];
            if (!!lastBlock) {
                this.emit('leaveBlock', lastBlock, e, true);
            }
            this.mouseX = -1;
            this.mouseY = -1;
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
