import logInfo from './logger.json';

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

// let logTip: HTMLSpanElement;
// if (!main.replayChecking) {
//     const tip = document.createElement('span');
//     logTip = tip;
//     tip.style.position = 'fixed';
//     tip.style.right = '0';
//     tip.style.bottom = '0';
//     tip.style.height = '20px';
//     tip.style.width = 'auto';
//     tip.style.textAlign = 'right';
//     tip.style.padding = '0 5px';
//     tip.style.fontSize = '16px';
//     tip.style.fontFamily = 'Arial';
//     tip.style.display = 'none';
//     tip.style.margin = '2px';
//     document.body.appendChild(tip);
// }

// const hideTipText = debounce(() => {
//     if (main.replayChecking) return;
//     logTip.style.display = 'none';
// }, 5000);

const nums = new Set('1234567890');

export interface ILoggerInfo {
    error: Record<number, string>;
    warn: Record<number, string>;
}

export class Logger {
    enabled: boolean = true;

    private catching: boolean = false;
    private catchedInfo: LoggerCatchInfo[] = [];

    private catchStack: LoggerCatchInfo[][] = [];

    constructor(
        public readonly level: LogLevel,
        public readonly info: ILoggerInfo
    ) {}

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
                }
                if (!nums.has(text[pointer + 1])) {
                    inParam = false;
                    const num = Number(paramNum);
                    paramNum = '';
                    str += params[num - 1] ?? '[not delivered]';
                }
                continue;
            }

            str += char;
        }

        return str;
    }

    /**
     * 输出报错信息
     * @param code 错误代码，每个错误都应当使用唯一的错误代码
     * @param params 参数
     */
    error(code: number, ...params: string[]) {
        const info = this.info.error[code];
        if (!info) {
            logger.error(16, 'error', code.toString());
            return;
        }
        const text = this.parseInfo(info[code], ...params);
        if (this.catching) {
            this.catchedInfo.push({
                level: LogLevel.ERROR,
                message: text,
                code
            });
        }
        if (this.level <= LogLevel.ERROR && this.enabled) {
            // if (!main.replayChecking) {
            // logTip.style.color = 'lightcoral';
            // logTip.style.display = 'block';
            // logTip.textContent = `Error thrown, please check in console.`;
            // hideTipText();
            // }
            const n = Math.floor(code / 50) + 1;
            const n2 = code % 50;
            const url = `/_docs/logger/error/error${n}.html#error-code-${n2}`;
            console.error(`[ERROR Code ${code}] ${text}. See ${url}`);
        }
    }

    /**
     * 输出警告信息
     * @param code 警告代码
     * @param text 警告信息
     */
    warn(code: number, ...params: string[]) {
        const info = this.info.warn[code];
        if (!info) {
            logger.error(16, 'warn', code.toString());
            return;
        }
        const text = this.parseInfo(info[code], ...params);
        if (this.catching) {
            this.catchedInfo.push({
                level: LogLevel.ERROR,
                message: text,
                code
            });
        }
        if (this.level <= LogLevel.WARNING && this.enabled) {
            // if (!main.replayChecking) {
            //     logTip.style.color = 'gold';
            //     logTip.style.display = 'block';
            //     logTip.textContent = `Warning thrown, please check in console.`;
            //     hideTipText();
            // }
            const n = Math.floor(code / 50) + 1;
            const n2 = code % 50;
            const url = `/_docs/logger/warn/warn${n}.html#warn-code-${n2}`;
            console.warn(`[WARNING Code ${code}] ${text}. See ${url}`);
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
        this.catchStack.push(this.catchedInfo);
        this.disable();
        this.catching = true;
        const ret = fn();
        if (this.catchStack.length === 0) {
            this.catching = false;
        } else {
            this.catching = true;
        }
        if (before) this.enable();

        this.catchStack.pop();
        const last = this.catchStack?.at(-1);
        const info = this.catchedInfo;
        this.catchedInfo = last ?? [];

        return { ret, info };
    }

    disable() {
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
    }
}

export const logger = new Logger(LogLevel.LOG, logInfo);
