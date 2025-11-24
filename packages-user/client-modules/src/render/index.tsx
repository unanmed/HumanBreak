import { createApp, Font } from '@motajs/render';
import { defineComponent } from 'vue';
import { DEFAULT_FONT, MAIN_HEIGHT, MAIN_WIDTH } from './shared';
import { hook, loading } from '@user/data-base';
import { createLoopMap } from './loopMap';
import { createElements } from './elements';
import { mainRenderer } from './renderer';
import { createUI } from './ui';
import { createAction } from './action';
import { createLegacy } from './legacy';
import { sceneController } from './scene';
import { GameTitleUI } from './ui/title';
import { createWeather } from './weather';
import { createMainExtension } from './commonIns';

export function createGameRenderer() {
    const App = defineComponent(_props => {
        return () => (
            <container width={MAIN_WIDTH} height={MAIN_HEIGHT}>
                {sceneController.render()}
            </container>
        );
    });

    mainRenderer.hide();
    createApp(App).mount(mainRenderer);
}

export function createRender() {
    createElements();
    createLegacy();
    createUI();
    createAction();
    createLoopMap();
    createWeather();

    loading.once('loaded', () => {
        sceneController.open(GameTitleUI, {});
        mainRenderer.show();
    });

    loading.once('assetBuilt', () => {
        createMainExtension();
    });

    hook.on('restart', () => {
        sceneController.closeAll();
        sceneController.open(GameTitleUI, {});
    });

    Font.setDefaults(DEFAULT_FONT);
}

export * from './commonIns';
export * from './components';
export * from './elements';
export * from './fx';
export * from './legacy';
export * from './ui';
export * from './utils';
export * from './weather';
export * from './renderer';
export * from './scene';
export * from './shared';
export * from './use';
