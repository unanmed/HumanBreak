import { debounce } from 'lodash-es';
import logInfo from '@/data/logger.json';

// todo: 使用格式化输出？

export const enum LogLevel {
    /** 输出所有，包括日志 */
    LOG,
    /** 报错、严重警告和警告 */
    WARNING,
    /** 仅报错 */
    ERROR
}

interface LoggerCatchInfo {
    code?: number;
    level: LogLevel;
    message: string;
}

interface LoggerCatchReturns<T> {
    ret: T;
    info: LoggerCatchInfo[];
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

const nums = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);

const logError = logInfo.error as Record<number, string>;
const logWarn = logInfo.warn as Record<number, string>;

export class Logger {
    level: LogLevel = LogLevel.LOG;
    enabled: boolean = true;

    private catching: boolean = false;
    private catchedInfo: LoggerCatchInfo[] = [];

    constructor(logLevel: LogLevel) {
        this.level = logLevel;
    }

    private parseInfo(text: string, ...params: string[]) {
        let pointer = -1;
        let str = '';

        let inParam = false;
        let paramNum = '';
        while (++pointer < text.length) {
            const char = text[pointer];

            if (char === '$' && text[pointer - 1] !== '\\') {
                inParam = true;
                continue;
            }

            if (inParam) {
                if (nums.has(char)) {
                    paramNum += char;
                } else {
                    inParam = false;
                    const num = Number(paramNum);
                    str += params[num] ?? '[not delivered]';
                }
                continue;
            }

            str += char;
        }

        return str;
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
     * @param params 参数
     */
    error(code: number, ...params: string[]) {
        const text = this.parseInfo(logError[code], ...params);
        if (this.catching) {
            this.catchedInfo.push({
                level: LogLevel.ERROR,
                message: text,
                code
            });
        }
        if (this.level <= LogLevel.ERROR && this.enabled) {
            if (!main.replayChecking) {
                logTip.style.color = 'lightcoral';
                logTip.style.display = 'block';
                logTip.textContent = `Error thrown, please check in console.`;
                hideTipText();
            }
            console.error(`[ERROR Code ${code}] ${text}`);
        }
    }

    /**
     * 输出警告信息
     * @param code 警告代码
     * @param text 警告信息
     */
    warn(code: number, ...params: string[]) {
        const text = this.parseInfo(logWarn[code], ...params);
        if (this.catching) {
            this.catchedInfo.push({
                level: LogLevel.ERROR,
                message: text,
                code
            });
        }
        if (this.level <= LogLevel.WARNING && this.enabled) {
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
        if (this.catching) {
            this.catchedInfo.push({
                level: LogLevel.ERROR,
                message: text
            });
        }
        if (this.level <= LogLevel.LOG && this.enabled) {
            console.log(`[LOG] ${text}`);
        }
    }

    catch<T>(fn: () => T): LoggerCatchReturns<T> {
        const before = this.enabled;
        this.catchedInfo = [];
        this.disable();
        this.catching = true;
        const ret = fn();
        this.catching = false;
        if (before) this.enable();

        return { ret, info: this.catchedInfo };
    }

    disable() {
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
    }
}

export const logger = new Logger(LogLevel.LOG);
