import EventEmitter from 'eventemitter3';
import { RenderItem } from '@motajs/render-core';

export interface IAnimateFrame {
    updateFrameAnimate(frame: number, time: number): void;
}

interface RenderEvent {
    animateFrame: [frame: number, time: number];
}

class RenderEmits extends EventEmitter<RenderEvent> {
    private framer: Set<IAnimateFrame> = new Set();

    /**
     * 添加一个可更新帧动画的对象
     */
    addFramer(framer: IAnimateFrame) {
        this.framer.add(framer);
    }

    /**
     * 移除一个可更新帧动画的对象
     */
    removeFramer(framer: IAnimateFrame) {
        this.framer.delete(framer);
    }

    /**
     * 更新所有帧动画
     * @param frame 帧数
     * @param time 帧动画时刻
     */
    emitAnimateFrame(frame: number, time: number) {
        this.framer.forEach(v => v.updateFrameAnimate(frame, time));
        this.emit('animateFrame', frame, time);
    }
}

export const renderEmits = new RenderEmits();

export function createFrame() {
    Mota.require('@user/data-base').hook.once('reset', () => {
        let lastTime = 0;
        RenderItem.ticker.add(time => {
            if (!core.isPlaying()) return;
            if (time - lastTime > core.values.animateSpeed) {
                RenderItem.animatedFrame++;
                lastTime = time;
                renderEmits.emitAnimateFrame(RenderItem.animatedFrame, time);
            }
        });
    });
}
