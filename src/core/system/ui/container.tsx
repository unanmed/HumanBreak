import { computed, defineComponent } from 'vue';
import { IUIMountable, UIBaseElementSlots, UIComponent } from './shared';
import { SetupComponentOptions } from '@/module';
import { ContainerProps } from '@/core/render';

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
    return () => {
        return (
            <data.baseElement>
                {(() => {
                    const b = back.value;
                    if (!b || !data.showBack.value || b.hidden) return;
                    return (
                        <b.ui.component
                            {...b.vBind}
                            key={b.key}
                        ></b.ui.component>
                    );
                })()}
                {show.value.map(v => (
                    <v.ui.component {...v.vBind} key={v.key}></v.ui.component>
                ))}
            </data.baseElement>
        );
    };
}, containerConfig);

export const UIRenderBase = defineComponent<
    ContainerProps,
    {},
    string,
    UIBaseElementSlots
>((_props, { slots }) => {
    return () => {
        return <container>{slots.defaults()}</container>;
    };
});

export const UIDomBase = defineComponent<{}, {}, string, UIBaseElementSlots>(
    (_props, { slots }) => {
        return () => {
            return <div>{slots.defaults()}</div>;
        };
    }
);
