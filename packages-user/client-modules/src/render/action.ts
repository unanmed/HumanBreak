import { gameKey } from '@motajs/system-action';
import { POP_BOX_WIDTH, CENTER_LOC, FULL_LOC } from './shared';
import {
    saveSave,
    mainUIController,
    saveLoad,
    openSettings,
    openViewMap,
    openReplay
} from './ui';
import { ElementLocator } from '@motajs/render-core';

export function createAction() {
    gameKey
        .realize('save', () => {
            saveSave(mainUIController, FULL_LOC);
        })
        .realize('load', () => {
            saveLoad(mainUIController, FULL_LOC);
        })
        .realize('menu', () => {
            const loc = CENTER_LOC.slice() as ElementLocator;
            loc[2] = POP_BOX_WIDTH;
            openSettings(mainUIController, loc);
        })
        .realize('replay', () => {
            const loc = CENTER_LOC.slice() as ElementLocator;
            loc[2] = POP_BOX_WIDTH;
            openReplay(mainUIController, loc);
        })
        .realize('viewMap', () => {
            openViewMap(mainUIController, FULL_LOC);
        });
}
