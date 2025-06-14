import { ElementLocator, IWheelEvent } from '@motajs/render-core';
import { DefaultProps } from '@motajs/render-vue';
import {
    GameUI,
    IUIMountable,
    SetupComponentOptions,
    UIComponentProps
} from '@motajs/system-ui';
import { defineComponent } from 'vue';
import { Page } from '../components';
import { useKey } from '../use';

export interface SaveProps extends UIComponentProps, DefaultProps {
    loc: ElementLocator;
}

export type SaveEmits = {
    /** 点击存档时触发 */
    emit: (index: number) => void;
    /** 手动点击退出时触发 */
    exit: () => void;
};

const saveProps = {
    props: ['loc', 'controller', 'instance']
} satisfies SetupComponentOptions<SaveProps, SaveEmits, keyof SaveEmits>;

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

        const emitSave = (index: number) => {
            emit('emit', index);
        };

        const wheel = (ev: IWheelEvent) => {};

        return () => <Page loc={props.loc} pages={1000} onWheel={wheel}></Page>;
    },
    saveProps
);

export const SaveUI = new GameUI('save', Save);

/**
 * 打开存读档界面并让用户选择一个存档。如果用户手动关闭了存档界面，返回 -1，否则返回用户选择的存档索引。
 * 参数参考 {@link SaveProps}，事件不可自定义。
 *
 * 使用示例：
 * ```ts
 * const index = await selectSave(props.controller, [0, 0, 416, 416]);
 * if (index === -1) {
 *   // 如果用户未选择存档，而是关闭了存档。
 * } else {
 *   // 用户选择了一个存档。
 * }
 * ```
 * @param controller 在哪个控制器上打开
 * @param loc 存读档界面的坐标
 * @param props 传递给存读档界面的参数
 * @returns
 */
export function selectSave(
    controller: IUIMountable,
    loc: ElementLocator,
    props?: SaveProps
) {
    return new Promise<number>(res => {
        const instance = controller.open(SaveUI, {
            loc,
            ...props,
            onEmit: index => {
                controller.close(instance);
                res(index);
            },
            onExit: () => {
                res(-1);
            }
        });
    });
}
