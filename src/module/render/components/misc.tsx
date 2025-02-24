import { DefaultProps, ElementLocator, Sprite } from '@/core/render';
import { defineComponent, ref, watch } from 'vue';
import { SetupComponentOptions } from './types';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';

interface ProgressProps extends DefaultProps {
    /** 进度条的位置 */
    loc: ElementLocator;
    /** 进度条的进度，1表示完成，0表示未完成 */
    progress: number;
    /** 已完成部分的样式，默认为绿色（green） */
    success?: CanvasStyle;
    /** 未完成部分的样式，默认为灰色（gray） */
    background?: CanvasStyle;
    /** 线宽度 */
    lineWidth?: number;
}

const progressProps = {
    props: ['loc', 'progress', 'success', 'background']
} satisfies SetupComponentOptions<ProgressProps>;

export const Progress = defineComponent<ProgressProps>(props => {
    const element = ref<Sprite>();

    const render = (canvas: MotaOffscreenCanvas2D) => {
        const { ctx } = canvas;
        const width = props.loc[2] ?? 200;
        const height = props.loc[3] ?? 200;
        ctx.lineCap = 'round';
        const lineWidth = props.lineWidth ?? 2;
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = props.background ?? 'gray';
        ctx.beginPath();
        ctx.moveTo(lineWidth, height / 2);
        ctx.lineTo(width - lineWidth, height / 2);
        ctx.stroke();
        if (!isNaN(props.progress)) {
            ctx.strokeStyle = props.success ?? 'green';
            const p = lineWidth + (width - lineWidth * 2) * props.progress;
            ctx.beginPath();
            ctx.moveTo(lineWidth, height / 2);
            ctx.lineTo(p, height / 2);
            ctx.stroke();
        }
    };

    watch(props, () => {
        element.value?.update();
    });

    return () => {
        return <sprite ref={element} loc={props.loc} render={render}></sprite>;
    };
}, progressProps);
