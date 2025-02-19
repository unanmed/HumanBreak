import { computed, defineComponent, VNode } from 'vue';
import { IUIMountable, UIComponent } from './shared';
import { SetupComponentOptions } from '@/module';

export interface UIContainerProps {
    controller: IUIMountable<UIComponent>;
}

const containerConfig = {
    props: ['controller']
} satisfies SetupComponentOptions<UIContainerProps>;

export const UIContainer = defineComponent<UIContainerProps>(props => {
    const data = props.controller;
    const back = data.backIns;
    const show = computed(() => data.stack.filter(v => !v.hidden));
    return (): VNode[] => {
        const elements: VNode[] = [];
        const b = back.value;
        if (b && data.showBack.value && !b.hidden) {
            elements.push(
                <b.ui.component {...b.vBind} key={b.key}></b.ui.component>
            );
        }
        return elements.concat(
            show.value.map(v => (
                <v.ui.component {...v.vBind} key={v.key}></v.ui.component>
            ))
        );
    };
}, containerConfig);
