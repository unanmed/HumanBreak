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
        ctx.fillStyle = props.background ?? 'gray';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = props.success ?? 'green';
        ctx.fillRect(0, 0, width * props.progress, height);
    };

    watch(props, () => {
        element.value?.update();
    });

    return () => {
        return <sprite ref={element} loc={props.loc} render={render}></sprite>;
    };
}, progressProps);
