import { KeyCode } from '@motajs/client-base';
import { KeyboardEmits, Keyboard, isAssist } from '@motajs/system-action';
import { mainUi } from './preset/uiIns';

/**
 * 唤起虚拟键盘，并获取到一次按键操作
 * @param emitAssist 是否可以获取辅助按键，为true时，如果按下辅助按键，那么会立刻返回该按键，
 *                   否则会视为开关辅助按键
 * @param assist 初始化的辅助按键
 */
export function getVitualKeyOnce(
    emitAssist: boolean = false,
    assist: number = 0,
    emittable: KeyCode[] = []
): Promise<KeyboardEmits> {
    // todo: 正确触发后删除监听器
    return new Promise(res => {
        const key = Keyboard.get('full')!;
        key.withAssist(assist);
        const id = mainUi.open('virtualKey', { keyboard: key });
        key.on('emit', (item, assist, _index, ev) => {
            ev.preventDefault();
            if (emitAssist) {
                if (emittable.length === 0 || emittable.includes(item.key)) {
                    res({ key: item.key, assist: 0 });
                    key.disposeScope();
                    mainUi.close(id);
                }
            } else {
                if (
                    !isAssist(item.key) &&
                    (emittable.length === 0 || emittable.includes(item.key))
                ) {
                    res({ key: item.key, assist });
                    key.disposeScope();
                    mainUi.close(id);
                }
            }
        });
    });
}
