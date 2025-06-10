import { ElementLocator, IWheelEvent } from '@motajs/render-core';
import { DefaultProps } from '@motajs/render-vue';
import { SetupComponentOptions, UIComponentProps } from '@motajs/system-ui';
import { defineComponent } from 'vue';
import { Page } from '../components';
import { useKey } from '../use';

export interface SaveProps extends UIComponentProps, DefaultProps {
    loc: ElementLocator;
}

export type SaveEmits = {
    /** 点击存档时触发 */
    emit: (index: number) => void;
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
