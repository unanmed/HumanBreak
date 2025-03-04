import { logger } from '@motajs/common';
import EventEmitter from 'eventemitter3';

export interface IStreamController<T = void> {
    readonly loading: boolean;

    /**
     * 开始流传输
     */
    start(): Promise<T>;

    /**
     * 主动终止流传输
     * @param reason 终止原因
     */
    cancel(reason?: string): void;
}

export interface IStreamReader<T = any> {
    /**
     * 接受字节流流传输的数据
     * @param data 传入的字节流数据，只包含本分块的内容
     * @param done 是否传输完成
     */
    pump(
        data: Uint8Array | undefined,
        done: boolean,
        response: Response
    ): Promise<void>;

    /**
     * 当前对象被传递给加载流时执行的函数
     * @param controller 传输流控制对象
     */
    piped(controller: IStreamController<T>): void;

    /**
     * 开始流传输
     * @param stream 传输流对象
     * @param controller 传输流控制对象
     */
    start(
        stream: ReadableStream,
        controller: IStreamController<T>,
        response: Response
    ): Promise<void>;

    /**
     * 结束流传输
     * @param done 是否传输完成，如果为 false 的话，说明可能是由于出现错误导致的终止
     * @param reason 如果没有传输完成，那么表示失败的原因
     */
    end(done: boolean, reason?: string): void;
}

interface StreamLoaderEvent {
    data: [data: Uint8Array | undefined, done: boolean];
}

export class StreamLoader
    extends EventEmitter<StreamLoaderEvent>
    implements IStreamController<void>
{
    /** 传输目标 */
    private target: Set<IStreamReader> = new Set();
    /** 读取流对象 */
    private stream?: ReadableStream;

    loading: boolean = false;

    constructor(public readonly url: string) {
        super();
    }

    /**
     * 将加载流传递给字节流读取对象
     * @param reader 字节流读取对象
     */
    pipe(reader: IStreamReader) {
        if (this.loading) {
            logger.warn(46);
            return;
        }
        this.target.add(reader);
        reader.piped(this);
        return this;
    }

    async start() {
        if (this.loading) return;
        this.loading = true;
        const response = await window.fetch(this.url);
        const stream = response.body;
        if (!stream) {
            logger.error(23);
            return;
        }
        // 获取读取器
        this.stream = stream;
        const reader = response.body?.getReader();
        const targets = [...this.target];
        await Promise.all(targets.map(v => v.start(stream, this, response)));
        if (reader && reader.read) {
            // 开始流传输
            while (true) {
                const { value, done } = await reader.read();
                await Promise.all(
                    targets.map(v => v.pump(value, done, response))
                );
                if (done) break;
            }
        } else {
            // 如果不支持流传输
            const buffer = await response.arrayBuffer();
            const data = new Uint8Array(buffer);
            await Promise.all(targets.map(v => v.pump(data, true, response)));
        }
        this.loading = false;
        targets.forEach(v => v.end(true));
    }

    cancel(reason?: string) {
        if (!this.stream) return;
        this.stream.cancel(reason);
        this.loading = false;
        this.target.forEach(v => v.end(false, reason));
    }
}
