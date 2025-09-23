import { DefaultProps, ElementLocator, Font } from '@motajs/render';
import { logger } from '@motajs/common';
import { computed, defineComponent, onUnmounted, ref } from 'vue';
import { transitioned } from '../use';
import { hyper } from 'mutate-animate';
import { debounce } from 'lodash-es';
import { texture } from '../elements';
import { SetupComponentOptions } from '@motajs/system-ui';

export interface TipProps extends DefaultProps {
    /** 显示的位置 */
    loc: ElementLocator;
    /** 边距 */
    pad?: [number, number];
    /** 圆角 */
    corner?: number;
    /** 显示的图标 */
    id?: string;
}

export interface TipExpose {
    /**
     * 显示提示文本
     * @param text 提示文字
     * @param icon 显示的图标，不填则不显示
     */
    drawTip(text: string, icon?: AllIds | AllNumbers): void;
}

const tipProps = {
    props: ['loc', 'pad', 'corner', 'id']
} satisfies SetupComponentOptions<TipProps>;

let id = 0;
function getNextTipId() {
    return `@default-tip-${id++}`;
}

export const Tip = defineComponent<TipProps>((props, { expose }) => {
    const iconNum = ref<AllNumbers>(0);
    const text = ref<string>('');
    const textWidth = ref(0);

    const font = new Font('normal');

    const alpha = transitioned(0, 500, hyper('sin', 'in-out'))!;
    const pad = computed(() => props.pad ?? [4, 4]);
    const locHeight = computed(() => props.loc[3] ?? 200);
    const hidden = computed(() => alpha.ref.value === 0);
    const showIcon = computed(() => iconNum.value !== 0);
    const iconSize = computed<[number, number]>(() => {
        const renderable = texture.getRenderable(iconNum.value);
        if (!renderable) return [1, 1];
        const [, , width, height] = renderable.render[0];
        return [width, height];
    });
    const iconLoc = computed<ElementLocator>(() => {
        const [width, height] = iconSize.value;
        const aspect = width / height;
        const realHeight = locHeight.value - pad.value[1] * 2;
        const realWidth = realHeight * aspect;
        return [pad.value[0], pad.value[1], realWidth, realHeight];
    });
    const textLoc = computed<ElementLocator>(() => {
        if (showIcon.value) {
            const [, , width] = iconLoc.value;
            const x = width! + pad.value[0] + pad.value[1];
            return [x, locHeight.value / 2, void 0, void 0, 0, 0.5];
        } else {
            return [pad.value[0], locHeight.value / 2, void 0, void 0, 0, 0.5];
        }
    });
    const containerLoc = computed<ElementLocator>(() => {
        const [x = 0, y = 0, , height = 200] = props.loc;
        const iconWidth = iconLoc.value[2] ?? 32;
        if (showIcon.value) {
            const width =
                textWidth.value + iconWidth + pad.value[0] * 2 + pad.value[1];
            return [x, y, width, height];
        } else {
            const width = textWidth.value + pad.value[0] * 2;
            return [x, y, width, height];
        }
    });
    const rectLoc = computed<ElementLocator>(() => {
        const [, , width = 200, height = 200] = containerLoc.value;
        return [1, 1, width - 2, height - 2];
    });

    const hide = debounce(() => {
        alpha.set(0);
    }, 3000);

    const drawTip = (tipText: string, iconId: AllIds | AllNumbers = 0) => {
        if (typeof iconId === 'string') {
            const num = texture.idNumberMap[iconId];
            iconNum.value = num;
        } else {
            // 样板竟然会传 null 进来，然后报错
            iconNum.value = iconId ?? 0;
        }
        text.value = core.replaceText(tipText);
        alpha.set(0, 0);
        alpha.set(1);
        hide();
    };

    const onSetText = (_: string, width: number) => {
        textWidth.value = width;
    };

    const ex: TipExpose = { drawTip };

    TipStore.use(props.id ?? getNextTipId(), ex);

    expose<TipExpose>(ex);

    return () => (
        <container
            loc={containerLoc.value}
            alpha={alpha.ref.value}
            hidden={hidden.value}
            noevent
        >
            <g-rectr
                loc={rectLoc.value}
                circle={[props.corner ?? 4]}
                fill
                fillStyle="rgba(0,0,0,0.8)"
            />
            <icon
                hidden={!showIcon.value}
                icon={iconNum.value}
                loc={iconLoc.value}
            />
            <text
                loc={textLoc.value}
                text={text.value}
                onSetText={onSetText}
                font={font}
            />
        </container>
    );
}, tipProps);

export class TipStore {
    static list: Map<string, TipStore> = new Map();

    private constructor(private readonly data: TipExpose) {}

    /**
     * 显示提示文本
     * @param text 提示文字
     * @param icon 显示的图标，不填则不显示
     */
    drawTip(text: string, icon: AllIds | AllNumbers = 0) {
        this.data.drawTip(text, icon);
    }

    static get(id: string) {
        return TipStore.list.get(id);
    }

    static use(id: string, data: TipExpose) {
        const store = new TipStore(data);
        if (this.list.has(id)) {
            logger.warn(60, id);
        }
        this.list.set(id, store);
        onUnmounted(() => {
            this.list.delete(id);
        });
        return store;
    }
}
