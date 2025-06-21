import {
    ElementLocator,
    MotaOffscreenCanvas2D,
    Sprite
} from '@motajs/render-core';
import { SpriteProps } from '@motajs/render-vue';
import { defineComponent, ref, watch } from 'vue';

export interface ThumbnailProps extends SpriteProps {
    loc: ElementLocator;
    padStyle: CanvasStyle;
    floorId: FloorIds;
    map?: Block[];
    hero?: HeroStatus;
    // configs
    damage?: boolean;
    all?: boolean;
}

export const Thumbnail = defineComponent<ThumbnailProps>(props => {
    const spriteRef = ref<Sprite>();

    const update = () => {
        spriteRef.value?.update();
    };

    const drawThumbnail = (canvas: MotaOffscreenCanvas2D) => {
        const hero = props.hero;
        const options: Partial<DrawThumbnailConfig> = {
            damage: props.damage,
            ctx: canvas.ctx,
            x: 0,
            y: 0,
            size: 1,
            all: props.all,
            noHD: false,
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
        core.drawThumbnail(props.floorId, props.map, options);
    };

    watch(props, update);

    return () => (
        <sprite ref={spriteRef} loc={props.loc} render={drawThumbnail} />
    );
});
