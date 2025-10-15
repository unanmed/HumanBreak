import {
    ElementLocator,
    MotaOffscreenCanvas2D,
    Sprite
} from '@motajs/render-core';
import { SpriteProps } from '@motajs/render-vue';
import { defineComponent, ref, watch } from 'vue';
import { SetupComponentOptions } from '@motajs/system-ui';

export interface ThumbnailProps extends SpriteProps {
    /** 缩略图的位置 */
    loc: ElementLocator;
    /** 楼层 ID */
    floorId: FloorIds;
    /** 缩略图填充样式 */
    padStyle?: CanvasStyle;
    /** 楼层信息 */
    map?: Block[];
    /** 角色信息 */
    hero?: HeroStatus;
    // configs
    damage?: boolean;
    all?: boolean;
    noHD?: boolean;
    /** 缩略图的比例，1 表示与实际地图大小一致 */
    size?: number;
}

const thumbnailProps = {
    props: [
        'loc',
        'padStyle',
        'floorId',
        'map',
        'hero',
        'damage',
        'all',
        'noHD',
        'size'
    ]
} satisfies SetupComponentOptions<ThumbnailProps>;

export const Thumbnail = defineComponent<ThumbnailProps>(props => {
    const spriteRef = ref<Sprite>();

    const update = () => {
        spriteRef.value?.update();
    };

    const drawThumbnail = (canvas: MotaOffscreenCanvas2D) => {
        if (props.hidden) return;
        const ctx = canvas.ctx;
        const hero = props.hero;
        const options: Partial<DrawThumbnailConfig> = {
            damage: props.damage,
            ctx: ctx,
            x: 0,
            y: 0,
            size: props.size ?? 1,
            all: props.all,
            noHD: props.noHD,
            v2: true,
            inFlyMap: false
        };
        if (hero) {
            options.heroLoc = hero.loc;
            options.heroIcon = hero.image;
            options.flags = hero.flags;
            options.centerX = hero.loc.x;
            options.centerY = hero.loc.y;
        }
        ctx.save();
        ctx.fillStyle = props.padStyle ?? 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        core.drawThumbnail(props.floorId, props.map, options);
        ctx.restore();
    };

    watch(props, update);

    return () => (
        <sprite noanti ref={spriteRef} loc={props.loc} render={drawThumbnail} />
    );
}, thumbnailProps);
