import { EventEmitter } from 'eventemitter3';
import { IDamageEnemy, IEnemyCollection } from '@motajs/types';

// ----- 加载事件
interface GameLoadEvent {
    /** 当核心脚本加载完毕时触发 */
    coreLoaded: [];
    /** 当自动元件加载完毕后触发 */
    autotileLoaded: [];
    /** 当核心类初始化完毕后触发 */
    coreInit: [];
    /** 当所有启动必要资源加载完毕后触发 */
    loaded: [];
    /** 当客户端（渲染端）和数据端都挂载完毕后触发 */
    registered: [];
    /** 当数据端挂载完毕后触发 */
    dataRegistered: [];
    /** 当客户端（渲染端）挂载完毕后触发 */
    clientRegistered: [];
}

class GameLoading extends EventEmitter<GameLoadEvent> {
    private autotileLoaded: number = 0;
    private autotileNum?: number;
    private autotileListened: boolean = false;
    loaded: boolean = false;

    constructor() {
        super();
        this.once('coreInit', () => {
            this.autotileNum = Object.keys(core.material.icons.autotile).length;
        });
        this.once('loaded', () => {
            this.loaded = true;
        });
    }

    addAutotileLoaded() {
        this.autotileLoaded++;
        if (this.autotileLoaded === this.autotileNum) {
            this.emit('autotileLoaded');
        }
    }

    /**
     * 当自动元件加载完毕时
     * @param autotiles 自动元件数组
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
main.loading = loading;

let clientRegistered = false;
let dataRegistered = false;

function checkRegistered() {
    if (main.replayChecking || main.mode === 'editor') {
        clientRegistered = true;
    }
    if (clientRegistered && dataRegistered) {
        loading.emit('registered');
    }
}

loading.once('clientRegistered', () => {
    clientRegistered = true;
    checkRegistered();
});
loading.once('dataRegistered', () => {
    dataRegistered = true;
    checkRegistered();
});

export interface GameEvent {
    /** 当游戏初始化时触发，Emitted in libs/events.js resetGame. */
    reset: [];
    /** 当游戏挂载完毕后触发，Emitted in src/App.vue setup. */
    mounted: [];
    /** 当状态栏更新时触发，Emitted in plugin/game/ui.ts updateStatusBar_update */
    statusBarUpdate: [];
    /** 当客户端（渲染端）加载完毕后触发，Emitted in core/index.ts */
    renderLoaded: [];
    /** 当捡拾道具后触发，Emitted in libs/events.js getItem */
    afterGetItem: [
        itemId: AllIdsOf<'items'>,
        x: number,
        y: number,
        isGentleClick: boolean
    ];
    /** 当开门后触发，Emitted in libs/events.js _openDoor_animate */
    afterOpenDoor: [doorId: AllIdsOf<'animates'>, x: number, y: number];
    /** 当楼层切换后触发，Emitted in project/functions.js afterChangeFloor */
    afterChangeFloor: [floorId: FloorIds];
    /** 勇士每移动一步时触发，Emitted in project/functions.js moveOneStep */
    moveOneStep: [x: number, y: number, floorId: FloorIds];
    /** 战斗后触发，Emitted in src/game/enemy/battle.ts afterBattle */
    afterBattle: [enemy: IDamageEnemy, x?: number, y?: number];
    /** 楼层切换中触发，具体时刻是楼层切换的正中间，刚刚执行完切换，Emitted in libs/events.js changingFloor */
    changingFloor: [floorId: FloorIds, heroLoc: Loc];
    /** 当某一个图块被设置时触发，Emitted in libs/maps.js setBlock */
    setBlock: [
        x: number,
        y: number,
        floorId: FloorIds,
        newBlock: AllNumbers,
        oldBlock: AllNumbers
    ];
    /** 当怪物信息被解析时触发，Emitted in game/enemy/damage.ts */
    enemyExtract: [col: IEnemyCollection];
    /** 当从游戏中回到游戏标题界面时触发，Emitted in lib/events.js restart */
    restart: [];
    /** 当设置背景或前景图块时触发，Emitted in lib/maps.js setBgFgBlock */
    setBgFgBlock: [
        name: 'bg' | 'fg' | 'bg2' | 'fg2',
        number: AllNumbers,
        x: number,
        y: number,
        floorId: FloorIds
    ];
    /** 当录像播放在暂停和播放状态间切换时触发，Emitted in lib/control.js */
    replayStatus: [replaying: boolean];
    /** 当加载存档时触发，Emitted in project/functions.js */
    loadData: [];
}

export const hook = new EventEmitter<GameEvent>();

interface ListenerEvent {
    // block
    hoverBlock: [block: Block, ev: MouseEvent];
    leaveBlock: [block: Block, ev: MouseEvent, leaveGame: boolean];
    clickBlock: [block: Block, ev: MouseEvent];
    // mouse
    mouseMove: [ev: MouseEvent];
}

class GameListener extends EventEmitter<ListenerEvent> {
    static num: number = 0;

    num: number = GameListener.num++;

    mouseX: number = -1;
    mouseY: number = -1;

    constructor() {
        super();
        if (main.replayChecking) return;
        if (window.core) {
            this.init();
        } else {
            loading.once('coreInit', () => {
                this.init();
            });
        }
    }

    private init() {
        // ----- block
        // const data = core.canvas.data.canvas;
        // const getBlockLoc = (px: number, py: number, size: number) => {
        //     return [
        //         Math.floor(((px * 32) / size + core.bigmap.offsetX) / 32),
        //         Math.floor(((py * 32) / size + core.bigmap.offsetY) / 32)
        //     ];
        // };
        // // hover & leave & mouseMove
        // data.addEventListener('mousemove', e => {
        //     if (
        //         core.status.lockControl ||
        //         !core.isPlaying() ||
        //         !core.status.floorId
        //     )
        //         return;
        //     this.emit('mouseMove', e);
        //     const {
        //         x: px,
        //         y: py,
        //         size
        //     } = core.actions._getClickLoc(e.offsetX, e.offsetY);
        //     const [bx, by] = getBlockLoc(px, py, size);
        //     const blocks = core.getMapBlocksObj();
        //     if (this.mouseX !== bx || this.mouseY !== by) {
        //         const lastBlock = blocks[`${this.mouseX},${this.mouseY}`];
        //         const block = blocks[`${bx},${by}`];
        //         if (lastBlock) {
        //             this.emit('leaveBlock', lastBlock, e, false);
        //         }
        //         if (block) {
        //             this.emit('hoverBlock', block, e);
        //             this.mouseX = bx;
        //             this.mouseY = by;
        //         } else {
        //             this.mouseX = -1;
        //             this.mouseY = -1;
        //         }
        //     }
        // });
        // data.addEventListener('mouseleave', e => {
        //     if (
        //         core.status.lockControl ||
        //         !core.isPlaying() ||
        //         !core.status.floorId
        //     )
        //         return;
        //     const blocks = core.getMapBlocksObj();
        //     const lastBlock = blocks[`${this.mouseX},${this.mouseY}`];
        //     if (lastBlock) {
        //         this.emit('leaveBlock', lastBlock, e, true);
        //     }
        //     this.mouseX = -1;
        //     this.mouseY = -1;
        // });
        // // click
        // data.addEventListener('click', e => {
        //     if (
        //         core.status.lockControl ||
        //         !core.isPlaying() ||
        //         !core.status.floorId
        //     )
        //         return;
        //     const {
        //         x: px,
        //         y: py,
        //         size
        //     } = core.actions._getClickLoc(e.offsetX, e.offsetY);
        //     const [bx, by] = getBlockLoc(px, py, size);
        //     const blocks = core.getMapBlocksObj();
        //     const block = blocks[`${bx},${by}`];
        //     if (block) {
        //         this.emit('clickBlock', block, e);
        //     }
        // });
        // ----- mouse
    }
}

/** @deprecated */
export const gameListener = new GameListener();

declare global {
    interface Main {
        loading: GameLoading;
    }
}
