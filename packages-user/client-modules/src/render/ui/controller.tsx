import { DefaultProps } from '@motajs/render-vue';
import {
    GameUI,
    SetupComponentOptions,
    UIComponentProps,
    UIController
} from '@motajs/system-ui';
import { defineComponent } from 'vue';
import { MAIN_HEIGHT, MAIN_WIDTH } from '../shared';

export const mainUIController = new UIController('main-ui');

export interface MainBackgroundProps extends DefaultProps, UIComponentProps {}

const mainBackgroundProps = {
    props: ['controller', 'instance']
} satisfies SetupComponentOptions<MainBackgroundProps>;

export const MainBackground = defineComponent<MainBackgroundProps>(() => {
    return () => (
        <g-rect
            loc={[0, 0, MAIN_WIDTH, MAIN_HEIGHT]}
            fill
            fillStyle="rgba(0, 0, 0, 0.8)"
        />
    );
}, mainBackgroundProps);

export const MainBackgroundUI = new GameUI('main-background', MainBackground);

export function createMainController() {
    mainUIController.setBackground(MainBackgroundUI, {});
}
