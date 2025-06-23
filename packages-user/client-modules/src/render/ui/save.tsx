import { ElementLocator, IWheelEvent } from '@motajs/render-core';
import { DefaultProps } from '@motajs/render-vue';
import { Font } from '@motajs/render';
import {
    GameUI,
    IUIMountable,
    SetupComponentOptions,
    UIComponentProps
} from '@motajs/system-ui';
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
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
    props: ['loc', 'index', 'isSelected', 'isDelete']
} satisfies SetupComponentOptions<SaveBtnProps>;

export const SaveBtn = defineComponent<
    SaveBtnProps,
    SaveBtnEmits,
    keyof SaveBtnEmits
>((props, { emit }) => {
    const w = props.loc[2] ?? 200;
    const font = new Font('normal', 18);
    const statusFont = new Font('normal', 14);
    const data = ref<SaveData | null>(null);
    const mapBlocks = computed(() => {
        if (data.value === null) return void 0;
        else {
            const currData = data.value?.data;
            const map = core.maps.loadMap(currData.maps, currData.floorId);
            core.extractBlocksForUI(map, currData.hero.flags); // 这一步会向map写入blocks
            return map.blocks;
        }
    });
    const text = computed(() =>
        props.index === -1 ? '自动存档' : `存档${props.index + 1}`
    );
    const strokeStyle = computed(() => {
        if (props.isSelected) return props.isDelete ? 'red' : 'gold';
        else return 'white';
    });
    const lineWidth = computed(() => (props.isSelected ? 2 : 1));

    watch(
        () => props.index,
        newIndex => {
            getSave(newIndex + 1).then(value => {
                data.value = value;
                emit('updateData', value != null);
            });
        },
        { immediate: true }
    );

    return () => (
        <container loc={props.loc}>
            <text
                text={text.value}
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
                hidden={data.value === null}
                loc={[3, 26, w - 6, w - 4]}
                padStyle="gray"
                floorId={data.value?.data.floorId || 'MT0'}
                map={mapBlocks.value}
                hero={data.value?.data.hero as HeroStatus}
                all
                noHD
                size={w / MAP_WIDTH}
            />
            <text
                text="placeholder"
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

        /** 各个存档是否有数据 */
        const saveValidArr = Array(pageCap).fill(false);
        /** 这里参数是存档在当前页的索引posIndex */
        const updateValid = (index: number) => (isValid: boolean) => {
            saveValidArr[index] = isValid;
        };

        const isDelete = ref(false);
        const pageRef = ref<PageExpose>();
        /** 当前页上被选中的存档的序号 只会是0到5 */
        const pickIndex = ref(1);
        const getPosIndex = (index: number) => {
            if (index === -1) return 0;
            return index - pageCap * (pageRef.value?.now() || 0) + 1;
        };

        const emitSave = (index: number) => {
            const posIndex = getPosIndex(index);
            if (isDelete.value) emit('delete', index, saveValidArr[posIndex]);
            else emit('emit', index, saveValidArr[posIndex]);
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
                                onUpdateData={updateValid(0)}
                                cursor="pointer"
                            />
                            <SaveBtn
                                loc={[180, 50, 120, 170]}
                                index={page * pageCap}
                                isSelected={pickIndex.value === 1}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap)}
                                onUpdateData={updateValid(1)}
                                cursor="pointer"
                            />
                            <SaveBtn
                                loc={[330, 50, 120, 170]}
                                index={page * pageCap + 1}
                                isSelected={pickIndex.value === 2}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap + 1)}
                                onUpdateData={updateValid(2)}
                                cursor="pointer"
                            />
                            <SaveBtn
                                loc={[30, 230, 120, 170]}
                                index={page * pageCap + 2}
                                isSelected={pickIndex.value === 3}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap + 2)}
                                onUpdateData={updateValid(3)}
                                cursor="pointer"
                            />
                            <SaveBtn
                                loc={[180, 230, 120, 170]}
                                index={page * pageCap + 3}
                                isSelected={pickIndex.value === 4}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap + 3)}
                                onUpdateData={updateValid(4)}
                                cursor="pointer"
                            />
                            <SaveBtn
                                loc={[330, 230, 120, 170]}
                                index={page * pageCap + 4}
                                isSelected={pickIndex.value === 5}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap + 4)}
                                onUpdateData={updateValid(5)}
                                cursor="pointer"
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
