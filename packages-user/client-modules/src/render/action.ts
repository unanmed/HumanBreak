import { gameKey } from '@motajs/system-action';
import { MAIN_WIDTH, MAIN_HEIGHT } from './shared';
import { saveSave, mainUIController, openStatistics } from './ui';

export function createAction() {
    gameKey
        .realize('save', () => {
            saveSave(mainUIController, [0, 0, MAIN_WIDTH, MAIN_HEIGHT]);
        })
        .realize('statistics', () => {
            openStatistics(mainUIController);
        });
}
