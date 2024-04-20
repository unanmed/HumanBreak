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
