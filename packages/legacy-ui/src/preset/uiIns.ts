import { GameUi, UiController } from '../controller';
import * as UI from '../ui';
import { VirtualKey } from '@motajs/legacy-system';

export const mainUi = new UiController();
mainUi.register(
    new GameUi('book', UI.Book),
    new GameUi('toolbox', UI.Toolbox),
    new GameUi('equipbox', UI.Equipbox),
    new GameUi('settings', UI.Settings),
    new GameUi('fly', UI.Fly),
    new GameUi('shop', UI.Shop),
    new GameUi('hotkey', UI.Hotkey),
    new GameUi('virtualKey', VirtualKey)
);
mainUi.showAll();

export const fixedUi = new UiController(true);
fixedUi.register(new GameUi('load', UI.Load));
fixedUi.showAll();
