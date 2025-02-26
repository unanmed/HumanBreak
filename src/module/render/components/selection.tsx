import { DefaultProps, ElementLocator, onTick } from '@/core/render';
import { computed, defineComponent } from 'vue';
import { SetupComponentOptions } from './types';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { transitioned } from '../use';
import { hyper } from 'mutate-animate';

export interface SelectionProps extends DefaultProps {
    loc: ElementLocator;
    color?: CanvasStyle;
    border?: CanvasStyle;
    winskin?: ImageIds;
    /** 选择图标的不透明度范围 */
    alphaRange?: [number, number];
}

const selectionProps = {
    props: ['loc', 'color', 'border', 'winskin', 'alphaRange']
} satisfies SetupComponentOptions<SelectionProps>;

export const Selection = defineComponent<SelectionProps>(props => {
    const minAlpha = computed(() => props.alphaRange?.[0] ?? 0.25);
    const maxAlpha = computed(() => props.alphaRange?.[1] ?? 0.55);
    const alpha = transitioned(minAlpha.value, 2000, hyper('sin', 'in-out'))!;

    const isWinskin = computed(() => !!props.winskin);
    const winskinImage = computed(() =>
        isWinskin.value ? core.material.images.images[props.winskin!] : null
    );
    const fixedLoc = computed<ElementLocator>(() => {
        const [x = 0, y = 0, width = 200, height = 200] = props.loc;
        return [x + 1, y + 1, width - 2, height - 2];
    });

    const renderWinskin = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        const image = winskinImage.value;
        if (!image) return;
        const [, , width = 200, height = 200] = props.loc;
        // 背景
        ctx.drawImage(image, 130, 66, 28, 28, 2, 2, width - 4, height - 4);
        // 四个角
        ctx.drawImage(image, 128, 64, 2, 2, 0, 0, 2, 2);
        ctx.drawImage(image, 158, 64, 2, 2, width - 2, 0, 2, 2);
        ctx.drawImage(image, 128, 94, 2, 2, 0, height - 2, 2, 2);
        ctx.drawImage(image, 158, 94, 2, 2, width - 2, height - 2, 2, 2);
        // 四条边
        ctx.drawImage(image, 130, 64, 28, 2, 2, 0, width - 4, 2);
        ctx.drawImage(image, 130, 94, 28, 2, 2, height - 2, width - 4, 2);
        ctx.drawImage(image, 128, 66, 2, 28, 0, 2, 2, height - 4);
        ctx.drawImage(image, 158, 66, 2, 28, width - 2, 2, 2, height - 4);
    };

    onTick(() => {
        if (alpha.value === maxAlpha.value) {
            alpha.set(minAlpha.value);
        }
        if (alpha.value === minAlpha.value) {
            alpha.set(maxAlpha.value);
        }
    });

    return () =>
        isWinskin.value ? (
            <sprite
                loc={props.loc}
                render={renderWinskin}
                alpha={alpha.ref.value}
                noanti
            />
        ) : (
            <g-rectr
                loc={fixedLoc.value}
                circle={[4]}
                alpha={alpha.ref.value}
                fill
                stroke
                fillStyle={props.color}
                strokeStyle={props.border}
                lineWidth={1}
            />
        );
}, selectionProps);
