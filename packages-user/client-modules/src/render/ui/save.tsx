import { ElementLocator, IWheelEvent } from '@motajs/render-core';
import { DefaultProps } from '@motajs/render-vue';
import { Font } from '@motajs/render';
import {
    GameUI,
    IUIMountable,
    SetupComponentOptions,
    UIComponentProps
} from '@motajs/system-ui';
import {
    defineComponent,
    ref,
    computed,
    onMounted,
    shallowReactive
} from 'vue';
import { Page, PageExpose } from '../components';
import { useKey } from '../use';
import { MAP_WIDTH } from '../shared';
import { getSave, SaveData } from '../utils';
import { Thumbnail } from '../components/thumbnail';
import { adjustGrid, IGridLayoutData } from '../utils/layout';

export interface SaveProps extends UIComponentProps, DefaultProps {
    loc: ElementLocator;
}

export interface SaveItemProps extends DefaultProps {
    loc: ElementLocator;
    index: number;
    selected: boolean;
    inDelete: boolean;
    data: SaveData | null;
}

export type SaveEmits = {
    /** 点击存档时触发 */
    emit: (index: number, exist: boolean) => void;
    /** 删除存档时触发 */
    delete: (index: number, exist: boolean) => void;
    /** 手动点击退出时触发 */
    exit: () => void;
};

const saveProps = {
    props: ['loc', 'controller', 'instance'],
    emits: ['delete', 'emit', 'exit']
} satisfies SetupComponentOptions<SaveProps, SaveEmits, keyof SaveEmits>;

const saveBtnProps = {
    props: ['loc', 'index', 'selected', 'inDelete', 'data']
} satisfies SetupComponentOptions<SaveItemProps>;

export const SaveItem = defineComponent<SaveItemProps>(props => {
    const font = new Font('normal', 18);
    const statusFont = new Font('normal', 14);

    const w = computed(() => props.loc[2] ?? 200);
    const lineWidth = computed(() => (props.selected ? 4 : 2));
    const imgLoc = computed<ElementLocator>(() => {
        const size = w.value - 4;
        return [2, 24, size, size];
    });

    const name = computed(() => {
        return props.index === 0 ? '自动存档' : `存档${props.index}`;
    });
    const statusText = computed(() => {
        if (!props.data) return '';
        else {
            const hero = props.data.data.hero;
            return `${hero.hp}/${hero.atk}/${hero.def}`;
        }
    });

    const strokeStyle = computed(() => {
        if (props.selected) return props.inDelete ? 'red' : 'gold';
        else return 'white';
    });

    const floorId = computed(() => props.data?.data.floorId ?? 'empty');
    const mapBlocks = computed(() => {
        if (!props.data) return [];
        else {
            const currData = props.data.data;
            const map = core.maps.loadMap(currData.maps, currData.floorId);
            core.extractBlocksForUI(map, currData.hero.flags); // 这一步会向map写入blocks
            return map.blocks;
        }
    });

    return () => (
        <container loc={props.loc}>
            <text
                text={name.value}
                font={font}
                loc={[w.value / 2, 20]}
                anc={[0.5, 1]}
            />
            <g-rect
                loc={imgLoc.value}
                strokeAndFill
                fillStyle="gray"
                strokeStyle={strokeStyle.value}
                lineWidth={lineWidth.value}
                lineJoin="miter"
                cursor="pointer"
            />
            <Thumbnail
                hidden={!props.data}
                loc={imgLoc.value}
                padStyle="gray"
                floorId={floorId.value}
                map={mapBlocks.value}
                hero={props.data?.data.hero}
                all
                noHD
                size={(w.value - 4) / MAP_WIDTH}
                noevent
            />
            <text
                text={statusText.value}
                fillStyle="yellow"
                font={statusFont}
                loc={[w.value / 2, w.value + 28]}
                anc={[0.5, 0]}
            />
        </container>
    );
}, saveBtnProps);

export const Save = defineComponent<SaveProps, SaveEmits, keyof SaveEmits>(
    (props, { emit }) => {
        const itemSize = 150;
        const itemHeight = itemSize + 40;
        const interval = 30;

        const font = new Font('normal', 18);
        const pageFont = new Font('normal', 14);

        /** 当前页上被选中的存档的posIndex */
        const selected = ref(0);
        const now = ref(0);
        const inDelete = ref(false);
        const pageRef = ref<PageExpose>();

        const saveData: Record<number, SaveData | null> = shallowReactive({});

        const width = computed(() => props.loc[2] ?? 200);
        const height = computed(() => props.loc[3] ?? 200);

        const grid = computed<IGridLayoutData>(() =>
            adjustGrid(
                width.value,
                height.value - 30,
                itemSize,
                itemHeight,
                interval
            )
        );

        const contentLoc = computed<ElementLocator>(() => {
            const cx = width.value / 2;
            const cy = (height.value - 30) / 2;
            return [cx, cy, grid.value.width, grid.value.height, 0.5, 0.5];
        });

        const deleteLoc = computed<ElementLocator>(() => {
            const pad = (width.value - grid.value.width) / 2;
            return [pad, height.value - 13, void 0, void 0, 0, 1];
        });

        const exitLoc = computed<ElementLocator>(() => {
            const pad = (width.value - grid.value.width) / 2;
            const right = width.value - pad;
            return [right, height.value - 13, void 0, void 0, 1, 1];
        });

        /**
         * 获取存档在当前页的序号，范围为 0 到 pageCap-1。
         */
        const getPosIndex = (index: number) => {
            if (index === -1) return 0;
            return (index % (grid.value.count - 1)) + 1;
        };

        /**
         * 获取存档的总序号，从 0 开始，用于数据交互。
         */
        const getIndex = (posIndex: number, page: number) => {
            return page * (grid.value.count - 1) + posIndex - 1;
        };

        const updateDataList = async (page: number) => {
            const promises: Promise<SaveData | null>[] = [getSave(0)];
            for (let i = 1; i < grid.value.count; i++) {
                const index = getIndex(i, page);
                promises.push(getSave(index + 1));
            }
            const data = await Promise.all(promises);

            data.forEach((v, i) => {
                if (v) {
                    saveData[i] = v;
                } else {
                    saveData[i] = null;
                }
            });
        };

        const exist = (index: number) => {
            return saveData[index] !== null;
        };

        const deleteData = (index: number) => {
            saveData[index] = null;
        };

        onMounted(() => {
            const startIndex = getPosIndex(core.saves.saveIndex);
            selected.value = startIndex;
            pageRef.value?.changePage(
                Math.floor(core.saves.saveIndex / (grid.value.count - 1))
            );
            updateDataList(now.value);
        });

        const emitSave = (index: number) => {
            const posIndex = getPosIndex(index);
            if (inDelete.value) {
                emit('delete', index, exist(posIndex));
                deleteData(posIndex);
            } else {
                emit('emit', index, exist(posIndex));
            }
            if (index === -1) {
                selected.value = 0;
            } else {
                selected.value = (index % (grid.value.count - 1)) + 1;
            }
        };

        const wheel = (ev: IWheelEvent) => {
            const delta = Math.sign(ev.wheelY);
            if (ev.ctrlKey) {
                pageRef.value?.movePage(delta * 10);
            } else {
                pageRef.value?.movePage(delta);
            }
        };

        const toggleDelete = () => {
            inDelete.value = !inDelete.value;
        };

        const exit = () => {
            emit('exit');
            props.controller.close(props.instance);
        };

        // #region 按键实现

        const [key] = useKey();
        key.realize('confirm', () => {
            if (selected.value === 0) {
                emitSave(-1);
            } else {
                emitSave(
                    (grid.value.count - 1) * now.value + selected.value - 1
                );
            }
        })
            .realize('exit', exit)
            .realize('@save_exit', exit)
            .realize(
                '@save_pageUp',
                () => {
                    pageRef.value?.movePage(1);
                },
                { type: 'down-repeat' }
            )
            .realize(
                '@save_pageDown',
                () => {
                    pageRef.value?.movePage(-1);
                },
                { type: 'down-repeat' }
            )
            .realize(
                '@save_up',
                () => {
                    if (!pageRef.value) return;
                    const cols = grid.value.cols;
                    const count = grid.value.count;
                    if (selected.value >= cols) {
                        selected.value -= cols;
                    } else {
                        if (now.value === 0) {
                            selected.value = 0;
                        } else {
                            const selectedCol = selected.value % cols;
                            selected.value = count - (cols - selectedCol);
                            pageRef.value?.movePage(-1);
                        }
                    }
                },
                { type: 'down-repeat' }
            )
            .realize(
                '@save_down',
                () => {
                    const cols = grid.value.cols;
                    const count = grid.value.count;
                    if (selected.value < count - cols) {
                        selected.value += cols;
                    } else {
                        const selectedCol = selected.value % cols;
                        selected.value = selectedCol;
                        pageRef.value?.movePage(1);
                    }
                },
                { type: 'down-repeat' }
            )
            .realize(
                '@save_left',
                () => {
                    if (!pageRef.value) return;
                    const count = grid.value.count;
                    if (selected.value > 0) {
                        selected.value--;
                    } else {
                        if (now.value > 0) {
                            selected.value = count;
                            pageRef.value?.movePage(-1);
                        }
                    }
                },
                { type: 'down-repeat' }
            )
            .realize(
                '@save_right',
                () => {
                    const count = grid.value.count;
                    if (selected.value < count) {
                        selected.value++;
                    } else {
                        selected.value = 0;
                        pageRef.value?.movePage(1);
                    }
                },
                { type: 'down-repeat' }
            );

        return () => (
            <container loc={props.loc} zIndex={10}>
                <Page
                    ref={pageRef}
                    loc={[0, 0, width.value, height.value - 10]}
                    pages={1000}
                    font={pageFont}
                    v-model:page={now.value}
                    onWheel={wheel}
                    onPageChange={updateDataList}
                >
                    {(page: number) => (
                        <container loc={contentLoc.value}>
                            {grid.value.locs.map((v, i) => {
                                const count = grid.value.count;
                                const rawIndex = (count - 1) * page + i;
                                const index = i === 0 ? 0 : rawIndex;
                                return (
                                    <SaveItem
                                        loc={v}
                                        index={index}
                                        selected={selected.value === i}
                                        inDelete={inDelete.value}
                                        data={saveData[i]}
                                        onClick={() => emitSave(index - 1)}
                                        onEnter={() => (selected.value = i)}
                                    />
                                );
                            })}
                        </container>
                    )}
                </Page>
                <text
                    text="删除模式"
                    loc={deleteLoc.value}
                    font={font}
                    zIndex={10}
                    fillStyle={inDelete.value ? 'red' : 'white'}
                    onClick={toggleDelete}
                    cursor="pointer"
                />
                <text
                    text="返回游戏"
                    loc={exitLoc.value}
                    font={font}
                    zIndex={10}
                    onClick={exit}
                    cursor="pointer"
                />
            </container>
        );
    },
    saveProps
);

export const SaveUI = new GameUI('save', Save);

export interface SaveValidation {
    readonly valid: boolean;
    readonly message: string;
}

export type SaveValidationFunction = (
    index: number,
    exist: boolean
) => SaveValidation;

/**
 * 打开存读档界面并让用户选择一个存档。如果用户手动关闭了存档界面，返回 -2，否则返回用户选择的存档索引。
 * 参数参考 {@link SaveProps}，事件不可自定义。
 *
 * 使用示例：
 * ```ts
 * const index = await selectSave(props.controller, [0, 0, 416, 416]);
 * if (index === -1) {
 *   // 如果用户未选择存档，而是关闭了存档。
 * } else if (index === 0) {
 *   // 用户选择了自动存档。
 * } else {
 *   // 用户选择了一个存档。
 * }
 * ```
 * @param controller 在哪个控制器上打开
 * @param loc 存读档界面的坐标
 * @param props 传递给存读档界面的参数
 * @returns 选择的存档索引
 */
export function selectSave(
    controller: IUIMountable,
    loc: ElementLocator,
    validate?: SaveValidationFunction,
    props?: SaveProps
) {
    const validateDelete = (index: number, exist: boolean): SaveValidation => {
        if (index === -1) {
            return { message: '不能删除自动存档！', valid: false };
        } else {
            return { message: '无法删除该存档！', valid: exist };
        }
    };

    return new Promise<number>(res => {
        const instance = controller.open(SaveUI, {
            loc,
            ...props,
            onEmit: (index: number, exist: boolean) => {
                if (!validate) {
                    controller.close(instance);
                    res(index);
                    return;
                }
                const validation = validate(index, exist);
                if (validation.valid) {
                    controller.close(instance);
                    res(index);
                } else {
                    core.drawTip(validation.message);
                }
            },
            onDelete: (index: number, exist: boolean) => {
                if (!validate) return;
                const validation = validateDelete(index, exist);
                if (validation.valid) {
                    core.removeSave(index);
                } else {
                    core.drawTip(validation.message);
                }
            },
            onExit: () => {
                res(-2);
            }
        });
    });
}

export async function saveSave(
    controller: IUIMountable,
    loc: ElementLocator,
    props?: SaveProps
) {
    const validate = (index: number): SaveValidation => {
        if (index === -1) {
            return { message: '不能存档至自动存档！', valid: false };
        } else {
            return { message: '', valid: true };
        }
    };
    const index = await selectSave(controller, loc, validate, props);
    if (index === -2) return false;
    core.saves.saveIndex = index;
    core.doSL(index + 1, 'save');
    return true;
}

export async function saveLoad(
    controller: IUIMountable,
    loc: ElementLocator,
    props?: SaveProps
) {
    const validate = (_: number, exist: boolean): SaveValidation => {
        return { message: '无效的存档！', valid: exist };
    };
    const index = await selectSave(controller, loc, validate, props);
    if (index === -2) return false;
    if (index === -1) {
        core.doSL('autoSave', 'load');
    } else {
        core.doSL(index + 1, 'load');
    }
    return true;
}
