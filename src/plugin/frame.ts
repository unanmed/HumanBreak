import { Ticker } from 'mutate-animate';

const ticker = new Ticker();

const div = document.createElement('div');
const frameSpan = document.createElement('span');
const innerSpan = document.createElement('span');
const realSpan = document.createElement('span');

[frameSpan, innerSpan, realSpan].forEach(v => {
    v.style.fontSize = '16px';
    v.style.fontFamily = 'Arial';
    v.style.color = 'lightgreen';
    v.style.padding = '0 5px';
    v.style.textAlign = 'right';
    v.style.width = '300px';
    v.style.height = '20px';
});

div.style.position = 'fixed';
div.style.right = '0';
div.style.top = '0';
div.style.display = 'flex';
div.style.flexDirection = 'column';
div.style.alignItems = 'end';
div.style.width = '300px';
div.style.height = '60px';

div.appendChild(frameSpan);
div.appendChild(innerSpan);
div.appendChild(realSpan);

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
let maxFrame = 0;
let frameThreshold = 0;

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
        if (frame > maxFrame) {
            maxFrame = frame;
            frameThreshold = (frame * 5) / 6;
        }
        if (frame < frameThreshold && starting > 5) {
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
            if (frame >= frameThreshold) {
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
        frameSpan.textContent = frame.toFixed(1);
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
    document.body.appendChild(div);
    starting = 0;
}

export function hide() {
    showing = false;
    div.remove();
}

export function isShowing() {
    return showing;
}

export function pauseFrame() {
    pause = true;
    frameSpan.innerText += '(paused)';
}

export function resumeFrame() {
    pause = false;
    starting = 0;
}

export function isPaused() {
    return pause;
}

function setSizeText() {
    innerSpan.textContent = `innerSize: ${window.innerWidth} x ${window.innerHeight}`;
    realSpan.textContent = `realSize: ${Math.floor(
        window.innerWidth * devicePixelRatio
    )} x ${Math.floor(window.innerHeight * devicePixelRatio)}`;
}
setSizeText();

window.addEventListener('resize', () => {
    setSizeText();
});
