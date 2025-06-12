import { createApp } from '@motajs/render';
import { defineComponent } from 'vue';
import { UIController } from '@motajs/system-ui';
import { mainSceneUI } from './ui/main';
import { MAIN_HEIGHT, MAIN_WIDTH } from './shared';
import { hook } from '@user/data-base';
import { createItemDetail } from './elements/itemDetail';
import { createLoopMap } from './loopMap';
import { createGameCanvas } from './legacy/gameCanvas';
import { createElements } from './elements';
import { mainRenderer } from './renderer';

export function createGameRenderer() {
    const App = defineComponent(_props => {
        const ui = new UIController('root-ui');
        ui.open(mainSceneUI, {});

        return () => (
            <container width={MAIN_WIDTH} height={MAIN_HEIGHT}>
                {ui.render()}
            </container>
        );
    });

    mainRenderer.hide();
    createApp(App).mount(mainRenderer);

    hook.on('reset', () => {
        mainRenderer.show();
    });

    hook.on('restart', () => {
        mainRenderer.hide();
    });

    console.log(mainRenderer);
}

export function createRender() {
    createGameCanvas();
    createItemDetail();
    createLoopMap();
    createElements();
}

export * from './components';
export * from './elements';
export * from './ui';
export * from './renderer';
export * from './shared';
export * from './use';
