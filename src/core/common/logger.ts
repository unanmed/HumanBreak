import { debounce } from 'lodash-es';

export const enum LogLevel {
    /** 输出所有，包括日志 */
    LOG,
    /** 报错、严重警告和警告 */
    WARNING,
    /** 报错和严重警告 */
    SEVERE_WARNING,
    /** 仅报错 */
    ERROR
}

let logTip: HTMLSpanElement;
if (!main.replayChecking) {
    const tip = document.createElement('span');
    logTip = tip;
    tip.style.position = 'fixed';
    tip.style.right = '0';
    tip.style.bottom = '0';
    tip.style.height = '20px';
    tip.style.width = 'auto';
    tip.style.textAlign = 'right';
    tip.style.padding = '0 5px';
    tip.style.fontSize = '16px';
    tip.style.fontFamily = 'Arial';
    tip.style.display = 'none';
    tip.style.margin = '2px';
    document.body.appendChild(tip);
}

const hideTipText = debounce(() => {
    if (main.replayChecking) return;
    logTip.style.display = 'none';
}, 5000);

export class Logger {
    level: LogLevel = LogLevel.LOG;

    constructor(logLevel: LogLevel) {
        this.level = logLevel;
    }

    /**
     * 设置该日志类的输出等级
     * @param level 要设置为的输出等级
     */
    setLogLevel(level: LogLevel) {
        this.level = level;
    }

    /**
     * 输出报错信息
     * @param code 错误代码，每个错误都应当使用唯一的错误代码
     * @param text 错误信息
     */
    error(code: number, text: string) {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[ERROR Code ${code}] ${text}`);
            if (!main.replayChecking) {
                logTip.style.color = 'lightcoral';
                logTip.style.display = 'block';
                logTip.textContent = `Error thrown, please check in console.`;
                hideTipText();
            }
        }
    }

    /**
     * 输出严重警告信息
     * @param code 警告代码
     * @param text 警告信息
     */
    severe(code: number, text: string) {
        if (this.level <= LogLevel.SEVERE_WARNING) {
            console.warn(`[SEVERE WARNING Code ${code}] ${text}`);
            if (!main.replayChecking) {
                logTip.style.color = 'goldenrod';
                logTip.style.display = 'block';
                logTip.textContent = `Severe warning thrown, please check in console.`;
                hideTipText();
            }
        }
    }

    /**
     * 输出警告信息
     * @param code 警告代码
     * @param text 警告信息
     */
    warn(code: number, text: string) {
        if (this.level <= LogLevel.WARNING) {
            console.warn(`[WARNING Code ${code}] ${text}`);
            if (!main.replayChecking) {
                logTip.style.color = 'gold';
                logTip.style.display = 'block';
                logTip.textContent = `Warning thrown, please check in console.`;
                hideTipText();
            }
        }
    }

    /**
     * 输出日志
     * @param text 日志信息
     */
    log(text: string) {
        if (this.level <= LogLevel.LOG) {
            console.log(`[LOG] ${text}`);
        }
    }
}

export const logger = new Logger(LogLevel.LOG);
