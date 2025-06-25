import { gameKey } from '@motajs/system-action';
import { MAIN_WIDTH, MAIN_HEIGHT } from './shared';
import {
    saveSave,
    mainUIController,
    openStatistics,
    saveLoad,
    openSettings,
    ReplaySettingsUI
} from './ui';

export function createAction() {
    gameKey
        .realize('save', () => {
            saveSave(mainUIController, [0, 0, MAIN_WIDTH, MAIN_HEIGHT]);
        })
        .realize('statistics', () => {
            openStatistics(mainUIController);
        })
        .realize('load', () => {
            saveLoad(mainUIController, [0, 0, MAIN_WIDTH, MAIN_HEIGHT]);
        })
        .realize('menu', () => {
            openSettings(mainUIController, [420, 240, 240, 400, 0.5, 0.5]);
        })
        .realize('replay', () => {
            mainUIController.open(ReplaySettingsUI, {
                loc: [420, 240, void 0, void 0, 0.5, 0.5]
            });
        });
}
