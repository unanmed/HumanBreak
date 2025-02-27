import { DefaultProps, ElementLocator, useKey } from '@/core/render';
import { computed, defineComponent, ref } from 'vue';
import { Background, Selection } from './misc';
import { TextContent, TextContentExpose, TextContentProps } from './textbox';
import { SetupComponentOptions } from './types';
import { TextAlign } from './textboxTyper';

export interface ConfirmBoxProps extends DefaultProps, TextContentProps {
    text: string;
    width: number;
    loc: ElementLocator;
    selFont?: string;
    selFill?: CanvasStyle;
    pad?: number;
    yesText?: string;
    noText?: string;
    winskin?: ImageIds;
    defaultYes?: boolean;
    color?: CanvasStyle;
    border?: CanvasStyle;
}

export type ConfirmBoxEmits = {
    yes: () => void;
    no: () => void;
};

const confirmBoxProps = {
    props: [
        'text',
        'width',
        'loc',
        'selFont',
        'selFill',
        'pad',
        'yesText',
        'noText',
        'winskin',
        'defaultYes',
        'color',
        'border'
    ],
    emits: ['no', 'yes']
} satisfies SetupComponentOptions<
    ConfirmBoxProps,
    ConfirmBoxEmits,
    keyof ConfirmBoxEmits
>;

export const ConfirmBox = defineComponent<
    ConfirmBoxProps,
    ConfirmBoxEmits,
    keyof ConfirmBoxEmits
>((props, { emit, attrs }) => {
    const content = ref<TextContentExpose>();
    const height = ref(200);
    const selected = ref(props.defaultYes ? true : false);
    const yesSize = ref<[number, number]>([0, 0]);
    const noSize = ref<[number, number]>([0, 0]);

    const loc = computed<ElementLocator>(() => {
        const [x = 0, y = 0, , , ax = 0, ay = 0] = props.loc;
        return [x, y, props.width, height.value, ax, ay];
    });
    const yesText = computed(() => props.yesText ?? '确认');
    const noText = computed(() => props.noText ?? '取消');
    const pad = computed(() => props.pad ?? 32);
    const yesLoc = computed<ElementLocator>(() => {
        const y = height.value - pad.value;
        return [props.width / 3, y, void 0, void 0, 0.5, 1];
    });
    const noLoc = computed<ElementLocator>(() => {
        const y = height.value - pad.value;
        return [(props.width / 3) * 2, y, void 0, void 0, 0.5, 1];
    });
    const contentLoc = computed<ElementLocator>(() => {
        const width = props.width - pad.value * 2;
        return [props.width / 2, pad.value, width, 0, 0.5, 0];
    });
    const selectLoc = computed<ElementLocator>(() => {
        if (selected.value) {
            const [x = 0, y = 0] = yesLoc.value;
            const [width, height] = yesSize.value;
            return [x, y + 4, width + 8, height + 8, 0.5, 1];
        } else {
            const [x = 0, y = 0] = noLoc.value;
            const [width, height] = noSize.value;
            return [x, y + 4, width + 8, height + 8, 0.5, 1];
        }
    });

    const onUpdateHeight = (textHeight: number) => {
        height.value = textHeight + pad.value * 4;
    };

    const setYes = (_: string, width: number, height: number) => {
        yesSize.value = [width, height];
    };

    const setNo = (_: string, width: number, height: number) => {
        noSize.value = [width, height];
    };

    const [key] = useKey();
    key.realize('confirm', () => {
        if (selected.value) emit('yes');
        else emit('no');
    });
    key.realize('moveLeft', () => void (selected.value = true));
    key.realize('moveRight', () => void (selected.value = false));

    return () => (
        <container loc={loc.value}>
            <Background
                loc={[0, 0, props.width, height.value]}
                winskin={props.winskin}
                color={props.color}
                border={props.border}
                zIndex={0}
            />
            <TextContent
                {...attrs}
                ref={content}
                loc={contentLoc.value}
                text={props.text}
                width={props.width - pad.value * 2}
                zIndex={5}
                textAlign={TextAlign.Center}
                autoHeight
                onUpdateHeight={onUpdateHeight}
            />
            <Selection
                loc={selectLoc.value}
                winskin={props.winskin}
                color={props.color}
                border={props.border}
                noevent
                zIndex={10}
            />
            <text
                loc={yesLoc.value}
                text={yesText.value}
                fillStyle={props.selFill}
                font={props.selFont}
                cursor="pointer"
                zIndex={15}
                onClick={() => emit('yes')}
                onEnter={() => (selected.value = true)}
                onSetText={setYes}
            />
            <text
                loc={noLoc.value}
                text={noText.value}
                fillStyle={props.selFill}
                font={props.selFont}
                cursor="pointer"
                zIndex={15}
                onClick={() => emit('no')}
                onEnter={() => (selected.value = false)}
                onSetText={setNo}
            />
        </container>
    );
}, confirmBoxProps);
