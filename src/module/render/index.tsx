import { MotaRenderer, createApp } from '@motajs/render';
import { defineComponent } from 'vue';
import { UIController } from '@motajs/system-ui';
import { mainSceneUI } from './ui/main';
import { MAIN_HEIGHT, MAIN_WIDTH } from './shared';
import { TextboxStore } from './components';

export function create() {
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

    Mota.require('var', 'hook').on('reset', () => {
        main.show();
    });

    Mota.require('var', 'hook').on('restart', () => {
        main.hide();
    });

    console.log(main);
}

Mota.register('module', 'MainUI', {
    TextboxStore
});

export * from './components';
export * from './ui';
export * from './use';
