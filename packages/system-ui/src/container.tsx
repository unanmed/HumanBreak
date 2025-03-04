import { defineComponent, VNode } from 'vue';
import { IUIMountable } from './shared';
import { SetupComponentOptions } from './types';

export interface UIContainerProps {
    controller: IUIMountable;
}

const containerConfig = {
    props: ['controller']
} satisfies SetupComponentOptions<UIContainerProps>;

export const UIContainer = defineComponent<UIContainerProps>(props => {
    const data = props.controller;
    const back = data.backIns;
    return (): VNode[] => {
        const elements: VNode[] = [];
        const b = back.value;
        if (b && data.showBack.value && !b.hidden) {
            elements.push(
                <b.ui.component
                    {...b.vBind}
                    controller={data}
                    instance={b}
                    key={b.key}
                    hidden={b.hidden && !b.alwaysShow}
                ></b.ui.component>
            );
        }
        return elements.concat(
            data.stack.map(v => (
                <v.ui.component
                    {...v.vBind}
                    key={v.key}
                    controller={data}
                    instance={v}
                    hidden={v.hidden && !v.alwaysShow}
                ></v.ui.component>
            ))
        );
    };
}, containerConfig);
