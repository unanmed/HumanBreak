import { Ticker } from 'mutate-animate';

const ticker = new Ticker();

const span = document.createElement('span');
span.style.fontSize = '16px';
span.style.position = 'fixed';
span.style.right = '0';
span.style.top = '0';
span.style.fontFamily = 'Arial';
span.style.color = 'lightgreen';
span.style.padding = '5px';

let showing = false;
let pause = false;

interface FrameInfo {
    time: number;
    frame: number;
    mark?: string;
    period?: number;
}

const frameList: FrameInfo[] = [];

let inLowFrame = false;
let leaveLowFrameTime = 0;
let starting = 0;
let beginLeaveTime = 0;

export function init() {
    const settings = Mota.require('var', 'mainSetting');
    const setting = settings.getSetting('debug.frame');
    /** 记录前5帧的时间戳 */
    let lasttimes = [0, 0, 0, 0, 0];
    ticker.add(time => {
        if (!setting?.value || pause) return;
        let marked = false;
        lasttimes.shift();
        lasttimes.push(time);
        const frame = 1000 / ((lasttimes[4] - lasttimes[0]) / 4);
        starting++;
        if (frame < 50 && starting > 5) {
            if (!inLowFrame) {
                performance.mark(`low_frame_start`);
                inLowFrame = true;
                frameList.push({
                    time,
                    frame,
                    mark: 'low_frame_start'
                });
                marked = true;
            }
        }
        if (inLowFrame) {
            if (leaveLowFrameTime === 0) {
                performance.mark('low_frame_end');
                const measure = performance.measure(
                    'low_frame',
                    'low_frame_start',
                    'low_frame_end'
                );
                beginLeaveTime = measure.duration;
            }
            if (frame >= 50) {
                leaveLowFrameTime++;
            } else {
                performance.clearMarks('low_frame_end');
                performance.clearMeasures('low_frame');
                leaveLowFrameTime = 0;
            }
            if (leaveLowFrameTime >= 10) {
                leaveLowFrameTime = 0;
                inLowFrame = false;
                marked = true;
                console.warn(
                    `Mota frame performance analyzer: Marked a low frame period.`
                );
                performance.clearMarks();
                frameList.push({
                    time,
                    frame,
                    mark: 'low_frame_end',
                    period: beginLeaveTime
                });
            }
        }
        frameList.push();
        span.innerText = frame.toFixed(1);
        if (!marked) {
            frameList.push({
                time,
                frame
            });
        }
        if (frameList.length >= 1000) frameList.shift();
    });
}

export function getFrameList() {
    return frameList;
}

export function show() {
    showing = true;
    document.body.appendChild(span);
    starting = 0;
}

export function hide() {
    showing = false;
    span.remove();
}

export function isShowing() {
    return showing;
}

export function pauseFrame() {
    pause = true;
    span.innerText += '(paused)';
}

export function resumeFrame() {
    pause = false;
    starting = 0;
}

export function isPaused() {
    return pause;
}
