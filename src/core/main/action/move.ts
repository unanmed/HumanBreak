import { KeyCode } from '@/plugin/keyCodes';
import { Hotkey, HotkeyData } from '../custom/hotkey';
import type { HeroMover, IMoveController } from '@/game/state/move';
import { Ticker } from 'mutate-animate';
import { mainScope } from '../init/hotkey';

type MoveKey = Record<Dir, HotkeyData>;
type MoveKeyConfig = Record<Dir, string>;

export class HeroKeyMover {
    /** 当前按下的键 */
    private pressedKey: Set<Dir> = new Set();
    /** 当前的移动方向 */
    private moveDir: Dir = 'down';
    /** 当前是否正在使用按键移动 */
    private moving: boolean = false;
    /** 当前移动的控制器 */
    private controller?: IMoveController;

    /** 按键接续ticker */
    private ticker = new Ticker();

    /** 当前移动实例绑定的热键 */
    hotkey: Hotkey;
    /** 当前热键的移动按键信息 */
    hotkeyData: MoveKey;
    /** 移动实例 */
    mover: HeroMover;
    /** 移动可触发的作用域 */
    scope: symbol = mainScope;

    constructor(hotkey: Hotkey, mover: HeroMover, config?: MoveKeyConfig) {
        this.hotkey = hotkey;
        this.mover = mover;
        hotkey.on('press', this.onPressKey);
        hotkey.on('release', this.onReleaseKey);

        const data = hotkey.data;

        this.hotkeyData = {
            left: data[config?.left ?? 'moveLeft'],
            right: data[config?.right ?? 'moveRight'],
            up: data[config?.up ?? 'moveUp'],
            down: data[config?.down ?? 'moveDown']
        };

        this.ticker.add(() => {
            if (!this.moving) {
                if (this.pressedKey.size > 0) {
                    const dir = [...this.pressedKey].at(-1);
                    if (!dir) return;
                    this.moveDir = dir;
                    this.tryStartMove();
                }
            }
        });
    }

    private onPressKey = (code: KeyCode) => {
        if (code === this.hotkeyData.left.key) this.press('left');
        else if (code === this.hotkeyData.right.key) this.press('right');
        else if (code === this.hotkeyData.up.key) this.press('up');
        else if (code === this.hotkeyData.down.key) this.press('down');
    };

    private onReleaseKey = (code: KeyCode) => {
        if (code === this.hotkeyData.left.key) this.release('left');
        else if (code === this.hotkeyData.right.key) this.release('right');
        else if (code === this.hotkeyData.up.key) this.release('up');
        else if (code === this.hotkeyData.down.key) this.release('down');
    };

    /**
     * 设置按键触发作用域
     */
    setScope(scope: symbol) {
        this.scope = scope;
    }

    /**
     * 按下某个方向键
     * @param dir 移动方向
     */
    press(dir: Dir) {
        if (this.hotkey.scope !== this.scope || core.status.lockControl) return;
        this.pressedKey.add(dir);
        this.moveDir = dir;
        if (!this.moving) {
            this.tryStartMove();
        }
    }

    /**
     * 松开方向键
     * @param dir 移动方向
     */
    release(dir: Dir) {
        this.pressedKey.delete(dir);
        if (this.pressedKey.size > 0) {
            this.moveDir = [...this.pressedKey][0];
        } else {
            this.endMove();
        }
    }

    /**
     * 尝试开始移动
     * @returns 是否成功开始移动
     */
    tryStartMove() {
        if (this.moving || core.status.lockControl) return false;

        this.mover.oneStep(this.moveDir);
        const controller = this.mover.startMove(false, false, false, true);
        if (!controller) return;

        this.controller = controller;
        controller.onEnd.then(() => {
            this.moving = false;
            this.controller = void 0;
            this.mover.off('stepEnd', this.onStepEnd);
        });
        this.moving = true;

        this.mover.on('stepEnd', this.onStepEnd);
        return true;
    }

    /**
     * 停止本次按键移动
     */
    endMove() {
        this.controller?.stop();
    }

    private onStepEnd = () => {
        const con = this.controller;
        if (!con) return;
        if (!this.moving) {
            con.stop();
            return;
        }

        if (this.pressedKey.size > 0) {
            if (con.queue.length === 0) {
                con.push({ type: 'dir', value: this.moveDir });
            }
        } else {
            con.stop();
        }
    };

    destroy() {
        this.hotkey.off('press', this.onPressKey);
        this.hotkey.off('release', this.onReleaseKey);
        this.mover.off('stepEnd', this.onStepEnd);
        this.ticker.destroy();
    }
}
