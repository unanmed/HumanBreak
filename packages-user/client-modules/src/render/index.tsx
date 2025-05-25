import { MotaRenderer, createApp } from '@motajs/render';
import { defineComponent } from 'vue';
import { UIController } from '@motajs/system-ui';
import { mainSceneUI } from './ui/main';
import { MAIN_HEIGHT, MAIN_WIDTH } from './shared';
import { hook } from '@user/data-base';
import { createItemDetail } from './itemDetail';
import { createLoopMap } from './loopMap';
import { createGameCanvas } from './legacy/gameCanvas';
import { createElements } from './elements';

export function createGameRenderer() {
    const main = new MotaRenderer();
    main.size(MAIN_WIDTH, MAIN_HEIGHT);

    const App = defineComponent(_props => {
        const ui = new UIController('root-ui');
        ui.open(mainSceneUI, {});

        return () => (
            <container width={MAIN_WIDTH} height={MAIN_HEIGHT}>
                {ui.render()}
            </container>
        );
    });

    main.hide();
    createApp(App).mount(main);

    hook.on('reset', () => {
        main.show();
    });

    hook.on('restart', () => {
        main.hide();
    });

    console.log(main);
}

export function createRender() {
    createGameCanvas();
    createItemDetail();
    createLoopMap();
    createElements();
}

export * from './components';
export * from './ui';
export * from './use';
export * from './elements';
