import { ElementLocator, IWheelEvent } from '@motajs/render-core';
import { DefaultProps } from '@motajs/render-vue';
import { Font } from '@motajs/render';
import {
    GameUI,
    IUIMountable,
    SetupComponentOptions,
    UIComponentProps
} from '@motajs/system-ui';
import { defineComponent, ref, computed, onMounted } from 'vue';
import { Page, PageExpose } from '../components';
import { useKey } from '../use';
import { MAP_WIDTH, MAP_HEIGHT } from '../shared';
import { getSave, SaveData } from '../utils';
import { Thumbnail } from '../components/thumbnail';

export interface SaveProps extends UIComponentProps, DefaultProps {
    loc: ElementLocator;
}

export interface SaveBtnProps extends DefaultProps {
    loc: ElementLocator;
    index: number;
    isSelected: boolean;
    isDelete: boolean;
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

export type SaveBtnEmits = {
    /** 读取数据 */
    updateData: (isValid: boolean) => void;
};

const saveProps = {
    props: ['loc', 'controller', 'instance'],
    emits: ['delete', 'emit', 'exit']
} satisfies SetupComponentOptions<SaveProps, SaveEmits, keyof SaveEmits>;

const saveBtnProps = {
    props: ['loc', 'index', 'isSelected', 'isDelete', 'data']
} satisfies SetupComponentOptions<SaveBtnProps>;

export const SaveBtn = defineComponent<SaveBtnProps>(props => {
    const w = props.loc[2] ?? 200;
    const font = new Font('normal', 18);
    const statusFont = new Font('normal', 14);
    const mapBlocks = computed(() => {
        if (props.data === null || props.data === undefined) return void 0;
        else {
            const currData = props.data.data;
            const map = core.maps.loadMap(currData.maps, currData.floorId);
            core.extractBlocksForUI(map, currData.hero.flags); // 这一步会向map写入blocks
            return map.blocks;
        }
    });
    const name = computed(() =>
        props.index === -1 ? '自动存档' : `存档${props.index + 1}`
    );
    const statusText = computed(() => {
        if (props.data === null || props.data === undefined) return '';
        else {
            const hero = props.data.data.hero;
            return `${hero.hp}/${hero.atk}/${hero.def}`;
        }
    });
    const strokeStyle = computed(() => {
        if (props.isSelected) return props.isDelete ? 'red' : 'gold';
        else return 'white';
    });
    const lineWidth = computed(() => (props.isSelected ? 2 : 1));

    return () => (
        <container loc={props.loc}>
            <text
                text={name.value}
                font={font}
                loc={[w / 2, 20, void 0, void 0, 0.5, 1]}
            />
            <g-rect
                loc={[lineWidth.value, 24, w - 2 * lineWidth.value, w]}
                fill
                stroke
                fillStyle="gray"
                strokeStyle={strokeStyle.value}
                lineWidth={lineWidth.value}
                lineJoin="miter"
            />
            <Thumbnail
                hidden={props.data === null}
                loc={[3, 26, w - 6, w - 4]}
                padStyle="gray"
                floorId={props.data?.data.floorId || 'MT0'}
                map={mapBlocks.value}
                hero={props.data?.data.hero as HeroStatus}
                all
                noHD
                size={w / MAP_WIDTH}
            />
            <text
                text={statusText.value}
                fillStyle="yellow"
                font={statusFont}
                loc={[w / 2, w + 28, void 0, void 0, 0.5, 0]}
            />
        </container>
    );
}, saveBtnProps);

export const Save = defineComponent<SaveProps, SaveEmits, keyof SaveEmits>(
    (props, { emit }) => {
        const row = 2;
        const column = 3;
        /** 除自动存档外，每一页容纳的存档数量 */
        const pageCap = row * column - 1;
        const font = new Font('normal', 18);
        const pageFont = new Font('normal', 14);

        const isDelete = ref(false);
        const pageRef = ref<PageExpose>();

        /** posIndex 存档在当前页的序号 范围为0到pageCap-1 */
        const getPosIndex = (index: number) => {
            if (index === -1) return 0;
            return index - pageCap * (pageRef.value?.now() || 0) + 1;
        };
        /** index 存档的总序号 从0开始 用于数据交互 */
        const getIndex = (posIndex: number, page: number) => {
            return page * pageCap + posIndex - 1;
        };

        /** 存档数据的列表 */
        const dataList = ref<(SaveData | null)[]>(
            Array(pageCap + 1).fill(null)
        );
        const updateDataList = (page: number) => {
            dataList.value.forEach((_ele, i) => {
                getSave(getIndex(i, page)).then(saveValue => {
                    dataList.value[i] = saveValue;
                });
            });
        };
        const hasData = (posIndex: number) => {
            return dataList.value[posIndex] !== null;
        };
        const getData = (posIndex: number) => dataList.value[posIndex];
        const deleteData = (posIndex: number) => {
            dataList.value[posIndex] = null;
        };

        onMounted(() => {
            const currPage = pageRef.value?.now() || 0;
            updateDataList(currPage);
        });

        /** 当前页上被选中的存档的posIndex */
        const pickIndex = ref(1);

        const emitSave = (index: number) => {
            const posIndex = getPosIndex(index);
            if (isDelete.value) {
                emit('delete', index, hasData(posIndex));
                deleteData(posIndex);
            } else {
                emit('emit', index, hasData(posIndex));
            }
            pickIndex.value = (index % pageCap) + 1;
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
            isDelete.value = !isDelete.value;
        };

        const exit = () => {
            emit('exit');
            props.controller.close(props.instance);
        };

        // #region 按键实现
        const [key] = useKey();
        key.realize('confirm', () => {
            const currPage = pageRef.value?.now();
            if (currPage === void 0) return;
            emitSave(pageCap * currPage + pickIndex.value);
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
                    const now = pageRef.value.now();
                    if (pickIndex.value >= row) {
                        pickIndex.value -= column;
                    } else {
                        if (now === 0) {
                            pickIndex.value = 0;
                        } else {
                            pickIndex.value += pageCap + 1 - column;
                            pageRef.value?.movePage(-1);
                        }
                    }
                },
                { type: 'down-repeat' }
            )
            .realize(
                '@save_down',
                () => {
                    if (pickIndex.value <= pageCap - row) {
                        pickIndex.value += column;
                    } else {
                        pickIndex.value += column - pageCap - 1;
                        pageRef.value?.movePage(1);
                    }
                },
                { type: 'down-repeat' }
            )
            .realize(
                '@save_left',
                () => {
                    if (!pageRef.value) return;
                    const now = pageRef.value.now();
                    if (pickIndex.value > 0) {
                        pickIndex.value--;
                    } else {
                        if (now > 0) {
                            pickIndex.value = pageCap;
                            pageRef.value?.movePage(-1);
                        }
                    }
                },
                { type: 'down-repeat' }
            )
            .realize(
                '@save_right',
                () => {
                    if (pickIndex.value < pageCap) {
                        pickIndex.value++;
                    } else {
                        pickIndex.value = 0;
                        pageRef.value?.movePage(1);
                    }
                },
                { type: 'down-repeat' }
            );
        // #endregion

        return () => (
            <container loc={props.loc} zIndex={10}>
                <Page
                    loc={[0, 0, MAP_WIDTH, MAP_HEIGHT - 10]}
                    pages={1000}
                    onWheel={wheel}
                    onPageChange={updateDataList}
                    ref={pageRef}
                    font={pageFont}
                >
                    {(page: number) => (
                        <container loc={[0, 0, MAP_WIDTH, MAP_HEIGHT]}>
                            <SaveBtn
                                loc={[30, 50, 120, 170]}
                                index={-1}
                                isSelected={pickIndex.value === 0}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(-1)}
                                cursor="pointer"
                                data={getData(0)}
                            />
                            <SaveBtn
                                loc={[180, 50, 120, 170]}
                                index={page * pageCap}
                                isSelected={pickIndex.value === 1}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap)}
                                cursor="pointer"
                                data={getData(1)}
                            />
                            <SaveBtn
                                loc={[330, 50, 120, 170]}
                                index={page * pageCap + 1}
                                isSelected={pickIndex.value === 2}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap + 1)}
                                cursor="pointer"
                                data={getData(2)}
                            />
                            <SaveBtn
                                loc={[30, 230, 120, 170]}
                                index={page * pageCap + 2}
                                isSelected={pickIndex.value === 3}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap + 2)}
                                cursor="pointer"
                                data={getData(3)}
                            />
                            <SaveBtn
                                loc={[180, 230, 120, 170]}
                                index={page * pageCap + 3}
                                isSelected={pickIndex.value === 4}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap + 3)}
                                cursor="pointer"
                                data={getData(4)}
                            />
                            <SaveBtn
                                loc={[330, 230, 120, 170]}
                                index={page * pageCap + 4}
                                isSelected={pickIndex.value === 5}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap + 4)}
                                cursor="pointer"
                                data={getData(5)}
                            />
                        </container>
                    )}
                </Page>
                <text
                    text="删除模式"
                    font={font}
                    loc={[30, 450, void 0, void 0, 0, 0]}
                    zIndex={10}
                    fillStyle={isDelete.value ? 'red' : 'white'}
                    onClick={toggleDelete}
                    cursor="pointer"
                />
                <text
                    text="返回游戏"
                    font={font}
                    loc={[450, 450, void 0, void 0, 1, 0]}
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
 * if (index === -2) {
 *   // 如果用户未选择存档，而是关闭了存档。
 * } else if (index === -1) {
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
    // 由于样板存档编号从1开始，这里需要+1
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
        core.doSL('autosave', 'load');
    } else {
        core.doSL(index + 1, 'load');
    }
    return true;
}
