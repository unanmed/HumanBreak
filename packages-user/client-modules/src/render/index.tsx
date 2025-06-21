import { createApp } from '@motajs/render';
import { defineComponent } from 'vue';
import { UIController } from '@motajs/system-ui';
import { mainSceneUI } from './ui/main';
import { MAIN_HEIGHT, MAIN_WIDTH } from './shared';
import { hook } from '@user/data-base';
import { createLoopMap } from './loopMap';
import { createElements } from './elements';
import { mainRenderer } from './renderer';
import { createUI } from './ui';
import { createAction } from './action';
import { createLegacy } from './legacy';

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
    createElements();
    createLegacy();
    createUI();
    createAction();
    createLoopMap();
}

export * from './components';
export * from './elements';
export * from './ui';
export * from './utils';
export * from './renderer';
export * from './shared';
export * from './use';
