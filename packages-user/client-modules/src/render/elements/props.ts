import { BaseProps, TagDefine } from '@motajs/render-vue';
import { ERenderItemEvent, Transform } from '@motajs/render-core';
import { CanvasStyle } from '@motajs/render-assets';
import {
    ILayerGroupRenderExtends,
    FloorLayer,
    ILayerRenderExtends,
    ELayerEvent,
    ELayerGroupEvent
} from './layer';
import { EAnimateEvent } from './animate';
import { EIconEvent, EWinskinEvent } from './misc';
import { IEnemyCollection } from '@motajs/types';
import { ILayerState } from '@user/data-state';
import { IMapRenderer } from '../map';

export interface AnimateProps extends BaseProps {}

export interface DamageProps extends BaseProps {
    mapWidth?: number;
    mapHeight?: number;
    cellSize?: number;
    enemy?: IEnemyCollection;
    font?: string;
    strokeStyle?: CanvasStyle;
    strokeWidth?: number;
}

export interface IconProps extends BaseProps {
    /** 图标 id 或数字 */
    icon: AllNumbers | AllIds;
    /** 显示图标的第几帧 */
    frame?: number;
    /** 是否开启动画，开启后 frame 参数无效 */
    animate?: boolean;
}

export interface WinskinProps extends BaseProps {
    /** winskin 的图片 id */
    image: ImageIds;
    /** 边框大小 */
    borderSize?: number;
}

export interface LayerGroupProps extends BaseProps {
    cellSize?: number;
    blockSize?: number;
    floorId?: FloorIds;
    bindThisFloor?: boolean;
    camera?: Transform;
    ex?: readonly ILayerGroupRenderExtends[];
    layers?: readonly FloorLayer[];
}

export interface LayerProps extends BaseProps {
    layer?: FloorLayer;
    mapWidth?: number;
    mapHeight?: number;
    cellSize?: number;
    background?: AllNumbers;
    floorImage?: FloorAnimate[];
    ex?: readonly ILayerRenderExtends[];
}

export interface MapRenderProps extends BaseProps {
    layerState: ILayerState;
    renderer: IMapRenderer;
}

declare module 'vue/jsx-runtime' {
    namespace JSX {
        export interface IntrinsicElements {
            layer: TagDefine<LayerProps, ELayerEvent>;
            'layer-group': TagDefine<LayerGroupProps, ELayerGroupEvent>;
            animation: TagDefine<AnimateProps, EAnimateEvent>;
            icon: TagDefine<IconProps, EIconEvent>;
            winskin: TagDefine<WinskinProps, EWinskinEvent>;
            'map-render': TagDefine<MapRenderProps, ERenderItemEvent>;
        }
    }
}
