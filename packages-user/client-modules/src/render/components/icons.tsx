import { DefaultProps, ElementLocator, GraphicPropsBase } from '@motajs/render';
import { SetupComponentOptions } from '@motajs/system-ui';
import { computed, defineComponent, onMounted, Ref, ref, watch } from 'vue';

export interface IconsProps extends DefaultProps<GraphicPropsBase> {
    loc: ElementLocator;
}

const iconsProps = {
    props: ['loc']
} satisfies SetupComponentOptions<IconsProps>;

type PathGenerator = (width: number, height: number) => Path2D;
/**
 * @param ox 横向偏移坐标
 * @param oy 纵向偏移坐标
 * @param width 路径宽度
 * @param height 路径高度
 */
type PathFn = (ox: number, oy: number, width: number, height: number) => Path2D;

function adjustPath(
    aspect: number,
    ref: Ref<Path2D | undefined>,
    fn: PathFn
): PathGenerator {
    let beforeWidth = 200;
    let beforeHeight = 200;
    let path: Path2D | undefined;
    return (width, height) => {
        if (width === beforeWidth && height === beforeHeight && path) {
            return path;
        }
        beforeWidth = width;
        beforeHeight = height;
        const eleAspect = width / height;
        let ox = 0;
        let oy = 0;
        let dw = 0;
        let dh = 0;
        if (aspect >= eleAspect) {
            ox = 0;
            dw = width;
            dh = width / aspect;
            oy = (height - dh) / 2;
        } else {
            oy = 0;
            dh = height;
            dw = height * aspect;
            ox = (width - dw) / 2;
        }
        path = fn(ox, oy, dw, dh);
        ref.value = path;
        return path;
    };
}

export const RollbackIcon = defineComponent<IconsProps>(props => {
    const path = ref<Path2D>();

    const width = computed(() => props.loc[2] ?? 200);
    const height = computed(() => props.loc[3] ?? 200);
    const generatePath = adjustPath(1, path, (ox, oy, width, height) => {
        const path = new Path2D();
        const arc = width / 10;
        const arrow = width / 10;
        const left = ox + width / 10;
        const top = oy + height / 5;
        const right = ox + width - width / 10;
        const bottom = oy + height - height / 5;
        const end = left + width / 4;
        path.moveTo(left, bottom);
        path.lineTo(right - arc, bottom);
        path.arcTo(right, bottom, right, bottom - arc, arc);
        path.lineTo(right, top + arc);
        path.arcTo(right, top, right - arc, top, arc);
        path.lineTo(end, top);
        path.moveTo(end + arrow, top - arrow);
        path.lineTo(end, top);
        path.lineTo(end + arrow, top + arrow);
        path.moveTo(left, top);
        return path;
    });

    watch(props, () => {
        generatePath(width.value, height.value);
    });

    onMounted(() => {
        generatePath(width.value, height.value);
    });

    return () => {
        return (
            <g-path
                loc={props.loc}
                path={path.value}
                stroke
                lineJoin="round"
                lineCap="round"
            ></g-path>
        );
    };
}, iconsProps);

export const RetweetIcon = defineComponent<IconsProps>(props => {
    const path = ref<Path2D>();

    const width = computed(() => props.loc[2] ?? 200);
    const height = computed(() => props.loc[3] ?? 200);
    const generatePath = adjustPath(1, path, (ox, oy, width, height) => {
        const path = new Path2D();
        const arc = width / 10;
        const arrow = width / 10;
        const left = ox + width / 10;
        const top = oy + height / 5;
        const right = ox + width - width / 10;
        const bottom = oy + height - height / 5;
        const end = left + width / 2;
        path.moveTo(end, bottom);
        path.lineTo(left + arc, bottom);
        path.arcTo(left, bottom, left, bottom - arc, arc);
        path.lineTo(left, top + arc);
        path.arcTo(left, top, left + arc, top, arc);
        path.lineTo(right, top);
        path.moveTo(right - arrow, top - arrow);
        path.lineTo(right, top);
        path.lineTo(right - arrow, top + arrow);
        path.moveTo(left, top);
        return path;
    });

    watch(props, () => {
        generatePath(width.value, height.value);
    });

    onMounted(() => {
        generatePath(width.value, height.value);
    });

    return () => {
        return (
            <g-path
                loc={props.loc}
                path={path.value}
                stroke
                lineJoin="round"
                lineCap="round"
            ></g-path>
        );
    };
}, iconsProps);

export const ViewMapIcon = defineComponent<IconsProps>(props => {
    const path = ref<Path2D>();

    const width = computed(() => props.loc[2] ?? 200);
    const height = computed(() => props.loc[3] ?? 200);
    const generatePath = adjustPath(1, path, (ox, oy, width, height) => {
        const path = new Path2D();
        const left = ox + width / 5;
        const top = oy + height / 5;
        const right = ox + width - width / 5;
        const bottom = oy + height - height / 5;
        const cx = ox + width / 2;
        const cy = oy + height / 2;
        path.rect(left, top, right - left, bottom - top);
        path.moveTo(cx, top);
        path.lineTo(cx, bottom);
        path.moveTo(left, cy);
        path.lineTo(right, cy);

        return path;
    });

    watch(props, () => {
        generatePath(width.value, height.value);
    });

    onMounted(() => {
        generatePath(width.value, height.value);
    });

    return () => {
        return (
            <g-path
                loc={props.loc}
                path={path.value}
                stroke
                lineJoin="round"
                lineCap="round"
            ></g-path>
        );
    };
}, iconsProps);

export const DanmakuIcon = defineComponent<IconsProps>(props => {
    const path = ref<Path2D>();

    const width = computed(() => props.loc[2] ?? 200);
    const height = computed(() => props.loc[3] ?? 200);
    const generatePath = adjustPath(1, path, (ox, oy, width, height) => {
        const path = new Path2D();
        const left = ox + width / 5;
        const bottom = oy + height - height / 5;
        const cx = ox + width / 2;
        const cy = oy + height / 2;
        const rx = width / 3;
        const ry = height / 4;
        const start = (Math.PI * 16) / 18;
        const end = (Math.PI * 12) / 18;
        path.ellipse(cx, cy, rx, ry, 0, start, end);
        path.lineTo(left - width / 24, bottom - height / 36);
        path.closePath();
        return path;
    });

    watch(props, () => {
        generatePath(width.value, height.value);
    });

    onMounted(() => {
        generatePath(width.value, height.value);
    });

    return () => {
        return (
            <g-path
                loc={props.loc}
                path={path.value}
                stroke
                lineJoin="round"
                lineCap="round"
            ></g-path>
        );
    };
}, iconsProps);

export const ReplayIcon = defineComponent<IconsProps>(props => {
    const path = ref<Path2D>();

    const width = computed(() => props.loc[2] ?? 200);
    const height = computed(() => props.loc[3] ?? 200);
    const generatePath = adjustPath(1, path, (ox, oy, width, height) => {
        const path = new Path2D();
        const arc = width / 10;
        const left = ox + width / 5;
        const top = oy + height / 5;
        const right = ox + width - width / 5;
        const bottom = oy + height - height / 5;
        const cy = oy + height / 2;
        path.moveTo(right, cy - height / 8);
        path.lineTo(right, top + arc);
        path.arcTo(right, top, right - arc, top, arc);
        path.lineTo(left + arc, top);
        path.arcTo(left, top, left, top + arc, arc);
        path.lineTo(left, cy);
        path.moveTo(left + arc, cy - arc);
        path.lineTo(left, cy);
        path.lineTo(left - arc, cy - arc);
        path.moveTo(left, cy + height / 8);
        path.lineTo(left, bottom - arc);
        path.arcTo(left, bottom, left + arc, bottom, arc);
        path.lineTo(right - arc, bottom);
        path.arcTo(right, bottom, right, bottom - arc, arc);
        path.lineTo(right, cy);
        path.moveTo(right - arc, cy + arc);
        path.lineTo(right, cy);
        path.lineTo(right + arc, cy + arc);
        return path;
    });

    watch(props, () => {
        generatePath(width.value, height.value);
    });

    onMounted(() => {
        generatePath(width.value, height.value);
    });

    return () => {
        return (
            <g-path
                loc={props.loc}
                path={path.value}
                stroke
                lineJoin="round"
                lineCap="round"
            ></g-path>
        );
    };
}, iconsProps);

export const NumpadIcon = defineComponent<IconsProps>(props => {
    const path = ref<Path2D>();

    const width = computed(() => props.loc[2] ?? 200);
    const height = computed(() => props.loc[3] ?? 200);
    const generatePath = adjustPath(1, path, (ox, oy, width, height) => {
        const path = new Path2D();
        const left = ox + width / 5;
        const top = oy + height / 5;
        const right = ox + width - width / 5;
        const bottom = oy + height - height / 5;
        const cx = ox + width / 2;
        const cy = oy + height / 2;
        path.rect(left, top, right - left, bottom - top);
        const path2 = new Path2D();
        path2.ellipse(cx, cy, width / 9, height / 6, 0, 0, Math.PI * 2);
        path.addPath(path2);
        return path;
    });

    watch(props, () => {
        generatePath(width.value, height.value);
    });

    onMounted(() => {
        generatePath(width.value, height.value);
    });

    return () => {
        return (
            <g-path
                loc={props.loc}
                path={path.value}
                stroke
                lineJoin="round"
                lineCap="round"
            ></g-path>
        );
    };
}, iconsProps);

export const PlayIcon = defineComponent<IconsProps>(props => {
    const path = ref<Path2D>();

    const width = computed(() => props.loc[2] ?? 200);
    const height = computed(() => props.loc[3] ?? 200);
    const generatePath = adjustPath(1, path, (ox, oy, width, height) => {
        const path = new Path2D();
        const left = ox + width / 5;
        const top = oy + height / 5;
        const right = ox + width - width / 5;
        const bottom = oy + height - height / 5;
        path.moveTo(left, top);
        path.lineTo(right, oy + height / 2);
        path.lineTo(left, bottom);
        path.closePath();
        return path;
    });

    watch(props, () => {
        generatePath(width.value, height.value);
    });

    onMounted(() => {
        generatePath(width.value, height.value);
    });

    return () => {
        return (
            <g-path
                loc={props.loc}
                path={path.value}
                fill
                stroke
                lineJoin="round"
                lineCap="round"
            ></g-path>
        );
    };
}, iconsProps);

export const PauseIcon = defineComponent<IconsProps>(props => {
    const path = ref<Path2D>();

    const width = computed(() => props.loc[2] ?? 200);
    const height = computed(() => props.loc[3] ?? 200);
    const generatePath = adjustPath(1, path, (ox, oy, width, height) => {
        const path = new Path2D();
        const cx = ox + width / 2;
        const top = oy + height / 5;
        const bottom = oy + height - height / 5;
        path.moveTo(cx - width / 5, top);
        path.lineTo(cx - width / 5, bottom);
        path.moveTo(cx + width / 5, top);
        path.lineTo(cx + width / 5, bottom);
        return path;
    });

    watch(props, () => {
        generatePath(width.value, height.value);
    });

    onMounted(() => {
        generatePath(width.value, height.value);
    });

    return () => {
        return (
            <g-path
                loc={props.loc}
                path={path.value}
                stroke
                lineJoin="round"
                lineCap="round"
            ></g-path>
        );
    };
}, iconsProps);

export const DoubleArrow = defineComponent<IconsProps>(props => {
    const path = ref<Path2D>();

    const width = computed(() => props.loc[2] ?? 200);
    const height = computed(() => props.loc[3] ?? 200);
    const generatePath = adjustPath(1, path, (ox, oy, width, height) => {
        const path = new Path2D();
        const path2 = new Path2D();
        const left = ox + width / 5;
        const top = oy + height / 5;
        const right = ox + width - width / 5;
        const bottom = oy + height - height / 5;
        const cx = ox + width / 2;
        const cy = oy + height / 2;
        path.moveTo(left, top + height / 12);
        path.lineTo(cx + width / 8, cy);
        path.lineTo(left, bottom - height / 12);
        path.closePath();
        path2.moveTo(cx, top + height / 12);
        path2.lineTo(right, cy);
        path2.lineTo(cx, bottom - height / 12);
        path2.closePath();
        path.addPath(path2);
        return path;
    });

    watch(props, () => {
        generatePath(width.value, height.value);
    });

    onMounted(() => {
        generatePath(width.value, height.value);
    });

    return () => {
        return (
            <g-path
                loc={props.loc}
                path={path.value}
                stroke
                fill
                lineJoin="round"
                lineCap="round"
            ></g-path>
        );
    };
}, iconsProps);

export const StepForward = defineComponent<IconsProps>(props => {
    const path = ref<Path2D>();

    const width = computed(() => props.loc[2] ?? 200);
    const height = computed(() => props.loc[3] ?? 200);
    const generatePath = adjustPath(1, path, (ox, oy, width, height) => {
        const path = new Path2D();
        const path2 = new Path2D();
        const left = ox + width / 5;
        const top = oy + height / 5;
        const right = ox + width - width / 5;
        const bottom = oy + height - height / 5;
        path.moveTo(left, top);
        path.lineTo(right, oy + height / 2);
        path.lineTo(left, bottom);
        path.closePath();
        path2.moveTo(right, top);
        path2.lineTo(right, bottom);
        path.addPath(path2);
        return path;
    });

    watch(props, () => {
        generatePath(width.value, height.value);
    });

    onMounted(() => {
        generatePath(width.value, height.value);
    });

    return () => {
        return (
            <g-path
                loc={props.loc}
                path={path.value}
                stroke
                fill
                lineJoin="round"
                lineCap="round"
            ></g-path>
        );
    };
}, iconsProps);
