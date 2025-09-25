import { gameKey } from '@motajs/system-action';
import { MAIN_WIDTH, MAIN_HEIGHT, POP_BOX_WIDTH, CENTER_LOC } from './shared';
import {
    saveSave,
    mainUIController,
    openStatistics,
    saveLoad,
    openSettings,
    ReplaySettingsUI,
    openViewMap
} from './ui';
import { ElementLocator } from '@motajs/render-core';

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
            const loc = CENTER_LOC.slice() as ElementLocator;
            loc[2] = POP_BOX_WIDTH;
            openSettings(mainUIController, loc);
        })
        .realize('replay', () => {
            mainUIController.open(ReplaySettingsUI, {
                loc: CENTER_LOC
            });
        })
        .realize('viewMap', () => {
            openViewMap(mainUIController, [0, 0, MAIN_WIDTH, MAIN_HEIGHT]);
        });
}
