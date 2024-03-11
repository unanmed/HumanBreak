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

export function init() {
    const settings = Mota.require('var', 'mainSetting');
    const setting = settings.getSetting('debug.frame');
    /** 记录前5帧的时间戳 */
    let lasttimes = [0, 0, 0, 0, 0];
    ticker.add(time => {
        if (!setting?.value) return;
        lasttimes.shift();
        lasttimes.push(time);
        span.innerText = (1000 / ((lasttimes[4] - lasttimes[0]) / 4)).toFixed(
            1
        );
    });
}

export function show() {
    showing = true;
    document.body.appendChild(span);
}

export function hide() {
    showing = false;
    span.remove();
}

export function isShowing() {
    return showing;
}
