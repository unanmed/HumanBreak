import { KeyCode } from '@/plugin/keyCodes';
import { Keyboard } from '../custom/keyboard';

const qweKey = new Keyboard('qwe');
qweKey.fontSize = 20;
qweKey
    .add({
        key: KeyCode.KeyQ,
        x: 0,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyW,
        x: 50,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyA,
        x: 10,
        y: 50,
        width: 45,
        height: 45
    });
