import { MotaRenderer } from '@motajs/render-core';
import { MAIN_WIDTH, MAIN_HEIGHT } from './shared';

export const mainRenderer = new MotaRenderer({
    canvas: '#render-main',
    width: MAIN_WIDTH,
    height: MAIN_HEIGHT
});
