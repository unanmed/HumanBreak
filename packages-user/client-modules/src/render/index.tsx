import { createApp, Font } from '@motajs/render';
import { defineComponent } from 'vue';
import { DEFAULT_FONT, MAIN_HEIGHT, MAIN_WIDTH } from './shared';
import { hook, loading } from '@user/data-base';
import { createElements } from './elements';
import { mainRenderer } from './renderer';
import { createUI } from './ui';
import { createAction } from './action';
import { sceneController } from './scene';
import { GameTitleUI } from './ui/title';
import { createWeather } from './weather';

export function createGameRenderer() {
    const App = defineComponent(_props => {
        return () => (
            <container noanti width={MAIN_WIDTH} height={MAIN_HEIGHT}>
                {sceneController.render()}
            </container>
        );
    });

    mainRenderer.setAntiAliasing(false);
    mainRenderer.hide();
    createApp(App).mount(mainRenderer);

    console.log(mainRenderer);
}

export function createRender() {
    createElements();
    createUI();
    createAction();
    createWeather();

    loading.on('loaded', () => {
        sceneController.open(GameTitleUI, {});
        mainRenderer.show();
    });

    hook.on('restart', () => {
        sceneController.closeAll();
        sceneController.open(GameTitleUI, {});
    });

    Font.setDefaults(DEFAULT_FONT);
}

export * from './components';
export * from './elements';
export * from './fx';
export * from './ui';
export * from './utils';
export * from './weather';
export * from './renderer';
export * from './scene';
export * from './shared';
export * from './use';
