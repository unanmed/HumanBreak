import { ElementLocator, IWheelEvent } from '@motajs/render-core';
import { DefaultProps } from '@motajs/render-vue';
import { Font } from '@motajs/render';
import {
    GameUI,
    IUIMountable,
    SetupComponentOptions,
    UIComponentProps
} from '@motajs/system-ui';
import { defineComponent, ref, computed } from 'vue';
import { Background, Page, PageExpose } from '../components';
import { useKey } from '../use';
import { MAP_WIDTH, MAP_HEIGHT } from '../shared';
import { gameKey } from '@motajs/system-action';
import { KeyCode } from '@motajs/client-base';

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
    emit: (index: number) => void;
    /** 删除存档时触发 */
    delete: (index: number) => void;
    /** 手动点击退出时触发 */
    exit: () => void;
};

const saveProps = {
    props: ['loc', 'controller', 'instance'],
    emits: ['delete', 'emit', 'exit']
} satisfies SetupComponentOptions<SaveProps, SaveEmits, keyof SaveEmits>;

const saveBtnProps = {
    props: ['loc', 'index', 'isSelected', 'isDelete']
} satisfies SetupComponentOptions<SaveBtnProps>;

gameKey
    .group('@ui_save', 'save')
    .register({
        id: '@ui_save_exit',
        name: '退出存档界面',
        defaults: KeyCode.KeyS
    })
    .register({
        id: '@ui_save_pageUp',
        name: '存档向后翻页',
        defaults: KeyCode.PageUp
    })
    .register({
        id: '@ui_save_pageDown',
        name: '存档向前翻页',
        defaults: KeyCode.PageDown
    })
    .register({
        id: '@ui_save_up',
        name: '存档选择框向上',
        defaults: KeyCode.UpArrow
    })
    .register({
        id: '@ui_save_down',
        name: '存档选择框向下',
        defaults: KeyCode.DownArrow
    })
    .register({
        id: '@ui_save_left',
        name: '存档选择框向左',
        defaults: KeyCode.LeftArrow
    })
    .register({
        id: '@ui_save_right',
        name: '存档选择框向右',
        defaults: KeyCode.RightArrow
    });

export const SaveBtn = defineComponent<SaveBtnProps>(props => {
    const w = props.loc[2] ?? 200;
    const font = new Font('normal', 18);
    const text = computed(() =>
        props.index === -1 ? '自动存档' : `存档${props.index + 1}`
    );
    const lineWidth = computed(() => (props.isSelected ? 2 : 1));
    return () => (
        <container loc={props.loc}>
            <text
                text={text.value}
                font={font}
                loc={[w / 2, 0, void 0, void 0, 0.5, 0]}
            />
            <g-rect
                loc={[lineWidth.value, 20, w - 2 * lineWidth.value, w]}
                fill
                stroke
                fillStyle="gray"
                strokeStyle={
                    props.isSelected
                        ? props.isDelete
                            ? 'red'
                            : 'gold'
                        : 'white'
                }
                lineWidth={lineWidth.value}
            />
            <text
                text="placeholder"
                fillStyle="yellow"
                font={font}
                loc={[w / 2, w + 20, void 0, void 0, 0.5, 0]}
            />
        </container>
    );
}, saveBtnProps);

export const Save = defineComponent<SaveProps, SaveEmits, keyof SaveEmits>(
    (props, { emit }) => {
        // 这些注释写完之后删了
        // 这里是 UI 部分，不负责任何存读档操作，这些在特定场景下传入 onEmit 来实现
        // 缩略图暂用 container 元素替代，点击时触发 onEmit
        // onEmit 事件在点击存档或按键确认时触发
        // 存读档执行函数在 ../../utils/saves.ts

        const [row, column] = [2, 3];
        /** 除自动存档外，每一页容纳的存档数量 */
        const pageCap = row * column - 1;
        const font = new Font('normal', 18);

        const isDelete = ref(false);
        const pageRef = ref<PageExpose>();
        /** 当前页上被选中的存档的序号 只会是0到5 */
        const pickIndex = ref(1);

        const emitSave = (index: number) => {
            if (isDelete.value) emit('delete', index);
            else emit('emit', index);
            pickIndex.value = (index % 5) + 1;
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

        // 参考 ../../action/hotkey.ts 中的按键定义
        const [key] = useKey();
        key.realize('confirm', () => {
            const currPage = pageRef.value?.now();
            if (currPage == null) return;
            emitSave(pageCap * currPage + pickIndex.value);
        })
            .realize('exit', exit)
            .realize('@ui_save_exit', exit)
            .realize('@ui_save_pageUp', () => {
                pageRef.value?.movePage(1);
            })
            .realize('@ui_save_pageDown', () => {
                pageRef.value?.movePage(-1);
            })
            .realize('@ui_save_up', () => {
                if (pickIndex.value >= row) pickIndex.value -= column;
            })
            .realize('@ui_save_down', () => {
                if (pickIndex.value <= pageCap - row) pickIndex.value += column;
            })
            .realize('@ui_save_left', () => {
                if (pickIndex.value > 0) pickIndex.value--;
            })
            .realize('@ui_save_right', () => {
                if (pickIndex.value < pageCap) pickIndex.value++;
            });
        // 其他按键自定义，需要新开一个 save 的 group

        return () => (
            <container loc={props.loc}>
                <Background loc={[0, 0, MAP_WIDTH, MAP_HEIGHT]} color="black" />
                <Page
                    loc={[0, 0, MAP_WIDTH, MAP_HEIGHT - 10]}
                    pages={1000}
                    onWheel={wheel}
                    ref={pageRef}
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
                            />
                            <SaveBtn
                                loc={[180, 50, 120, 170]}
                                index={page * pageCap}
                                isSelected={pickIndex.value === 1}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap)}
                                cursor="pointer"
                            />
                            <SaveBtn
                                loc={[330, 50, 120, 170]}
                                index={page * pageCap + 1}
                                isSelected={pickIndex.value === 2}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap + 1)}
                                cursor="pointer"
                            />
                            <SaveBtn
                                loc={[30, 230, 120, 170]}
                                index={page * pageCap + 2}
                                isSelected={pickIndex.value === 3}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap + 2)}
                                cursor="pointer"
                            />
                            <SaveBtn
                                loc={[180, 230, 120, 170]}
                                index={page * pageCap + 3}
                                isSelected={pickIndex.value === 4}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap + 3)}
                                cursor="pointer"
                            />
                            <SaveBtn
                                loc={[330, 230, 120, 170]}
                                index={page * pageCap + 4}
                                isSelected={pickIndex.value === 5}
                                isDelete={isDelete.value}
                                onClick={() => emitSave(page * pageCap + 4)}
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
                />
                <text
                    text="返回游戏"
                    font={font}
                    loc={[450, 450, void 0, void 0, 1, 0]}
                    zIndex={10}
                    onClick={exit}
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
    validate?: (index: number) => SaveValidation,
    props?: SaveProps
) {
    return new Promise<number>(res => {
        const instance = controller.open(SaveUI, {
            loc,
            ...props,
            onEmit: (index: number) => {
                if (!validate) {
                    controller.close(instance);
                    res(index);
                    return;
                }
                const validation = validate(index);
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
