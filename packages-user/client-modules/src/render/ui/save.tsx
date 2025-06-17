import { ElementLocator, IWheelEvent } from '@motajs/render-core';
import { DefaultProps } from '@motajs/render-vue';
import { Font } from '@motajs/render';
import {
    GameUI,
    IUIMountable,
    SetupComponentOptions,
    UIComponentProps
} from '@motajs/system-ui';
import { defineComponent, ref } from 'vue';
import { Background, Page, PageExpose } from '../components';
import { useKey } from '../use';
import { MAP_WIDTH, MAP_HEIGHT } from '../shared';

export interface SaveProps extends UIComponentProps, DefaultProps {
    loc: ElementLocator;
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

function SaveBtn(props: {
    loc: ElementLocator;
    index: number;
    emit: (index: number) => void;
    isDelete: boolean;
}) {
    const w = props.loc[2];
    return (
        <container loc={props.loc}>
            <text
                text={
                    props.index === -1 ? '自动存档' : '存档' + (props.index + 1)
                }
                font={new Font('normal', 18)}
                loc={[w! / 2, 0, undefined, undefined, 0.5, 0]}
            />
            <g-rect
                loc={[0, 20, w, w]}
                fill
                stroke
                fillStyle="gray"
                strokeStyle={props.isDelete ? 'red' : 'white'}
                onClick={() => props.emit(props.index)}
            />
            <text
                text={'1000/10/10'}
                fillStyle={'yellow'}
                font={new Font('normal', 18)}
                loc={[w! / 2, w! + 20, undefined, undefined, 0.5, 0]}
            />
        </container>
    );
}

export const Save = defineComponent<SaveProps, SaveEmits, keyof SaveEmits>(
    (props, { emit }) => {
        // 这些注释写完之后删了
        // 这里是 UI 部分，不负责任何存读档操作，这些在特定场景下传入 onEmit 来实现
        // 缩略图暂用 container 元素替代，点击时触发 onEmit
        // onEmit 事件在点击存档或按键确认时触发
        // 存读档执行函数在 ../../utils/saves.ts

        // 参考 ../../action/hotkey.ts 中的按键定义
        const [key] = useKey();
        key.realize('confirm', () => {});
        key.realize('exit', () => {});
        // 其他按键自定义，需要新开一个 save 的 group

        /** 除自动存档外，每一页容纳的存档数量 */
        const pageRef = ref<PageExpose>();
        const pageCap = 5;

        let isDelete = ref(false);

        const emitSave = (index: number) => {
            if (index === -1) {
                console.log('不能覆盖自动存档!');
                return;
            }
            emit('emit', index, isDelete.value);
        };

        const wheel = (ev: IWheelEvent) => {
            if (ev.wheelY < 0) {
                pageRef.value?.movePage(-(ev.ctrlKey ? 10 : 1));
            } else if (ev.wheelY > 0) {
                pageRef.value?.movePage(ev.ctrlKey ? 10 : 1);
            }
        };

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
                                emit={emitSave}
                                isDelete={isDelete.value}
                            />
                            <SaveBtn
                                loc={[180, 50, 120, 170]}
                                index={page * pageCap}
                                emit={emitSave}
                                isDelete={isDelete.value}
                            />
                            <SaveBtn
                                loc={[330, 50, 120, 170]}
                                index={page * pageCap + 1}
                                emit={emitSave}
                                isDelete={isDelete.value}
                            />
                            <SaveBtn
                                loc={[30, 230, 120, 170]}
                                index={page * pageCap + 2}
                                emit={emitSave}
                                isDelete={isDelete.value}
                            />
                            <SaveBtn
                                loc={[180, 230, 120, 170]}
                                index={page * pageCap + 3}
                                emit={emitSave}
                                isDelete={isDelete.value}
                            />
                            <SaveBtn
                                loc={[330, 230, 120, 170]}
                                index={page * pageCap + 4}
                                emit={emitSave}
                                isDelete={isDelete.value}
                            />
                        </container>
                    )}
                </Page>
                <text
                    text={'删除模式'}
                    font={new Font('normal', 18)}
                    loc={[30, 450, undefined, undefined, 0, 0]}
                    zIndex={1}
                    fillStyle={isDelete.value ? 'red' : 'white'}
                    onClick={() => {
                        isDelete.value = !isDelete.value;
                    }}
                />
                <text
                    text={'返回游戏'}
                    font={new Font('normal', 18)}
                    loc={[450, 450, undefined, undefined, 1, 0]}
                    zIndex={1}
                    onClick={() => emit('exit')}
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
                controller.close(instance);
                res(-2);
            }
        });
    });
}
