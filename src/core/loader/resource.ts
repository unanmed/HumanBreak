import axios, { AxiosResponse } from 'axios';
import { Disposable } from '../common/disposable';
import { ensureArray } from '../../plugin/game/utils';
import { has } from '../../plugin/utils';
import JSZip from 'jszip';
import { EmitableEvent, EventEmitter } from '../common/eventEmitter';

interface ResourceData {
    image: HTMLImageElement;
    arraybuffer: ArrayBuffer;
    text: string;
    json: any;
    zip: ZippedResource;
}

type ResourceType = keyof ResourceData;

export class Resource<
    T extends ResourceType = ResourceType
> extends Disposable<string> {
    format: T;
    request?: Promise<AxiosResponse<ResourceData[T]> | '@imageLoaded'>;
    loaded: boolean = false;

    /** 资源数据 */
    resource?: ResourceData[T];

    constructor(resource: string, type: T) {
        super(resource);
        this.data = this.resolveUrl(resource);
        this.format = type;

        this.on('active', this.load);
    }

    /**
     * 解析资源url
     * @param resource 资源字符串
     * @returns 解析出的资源url
     */
    protected resolveUrl(resource: string) {
        const resolve = resource.split('.');
        const type = resolve[0];
        const name = resolve.slice(1, -1).join('.');
        const ext = '.' + resolve.at(-1);

        if (!main.USE_RESOURCE) {
            return `/games/${core.data.firstData.name}/project/${type}/${name}${ext}`;
        }

        const base = main.RESOURCE_URL;
        const indexes = main.RESOURCE_INDEX;
        const symbol = main.RESOURCE_SYMBOL;

        if (has(indexes[`${type}.*`])) {
            const i = indexes[`${type}.*`];
            return `${base}${i}/${type}/${name}-${symbol}${ext}`;
        } else {
            const i = indexes[`${type}.${name}${ext}`];
            const index = has(i) ? i : 0;
            return `${base}${index}/${type}/${name}-${symbol}${ext}`;
        }
    }

    /**
     * 加载资源
     */
    protected load() {
        const data = this.data;
        if (!data) {
            throw new Error(`Unexpected null of url in loading resource.`);
        }
        if (this.format === 'image') {
            this.request = new Promise(res => {
                const img = new Image();
                img.src = data;
                img.addEventListener('load', () => {
                    this.resource = img;
                    this.loaded = true;
                    res('@imageLoaded');
                });
            });
        } else if (
            this.format === 'json' ||
            this.format === 'text' ||
            this.format === 'arraybuffer'
        ) {
            this.request = axios
                .get(data, { responseType: this.format })
                .then(v => {
                    this.resource = v.data;
                    this.loaded = true;
                    return v;
                });
        } else if (this.format === 'zip') {
            this.request = axios
                .get(data, { responseType: 'arraybuffer' })
                .then(v => {
                    this.resource = new ZippedResource(v.data);
                    this.loaded = true;
                    return v;
                });
        }
    }

    /**
     * 获取资源，如果还没加载会等待加载完毕再获取
     */
    async getData(): Promise<ResourceData[T] | null> {
        if (!this.activated) return null;
        if (this.loaded) return this.resource ?? null;
        else {
            if (!this.request) this.load();
            await this.request;
            return this.resource ?? null;
        }
    }
}

interface ZippedEvent extends EmitableEvent {
    ready: (data: JSZip) => void;
}

export class ZippedResource extends EventEmitter<ZippedEvent> {
    zip: Promise<JSZip>;
    data?: JSZip;

    constructor(buffer: ArrayBuffer) {
        super();
        this.zip = JSZip.loadAsync(buffer).then(v => {
            this.emit('ready', v);
            this.data = v;
            return v;
        });
    }
}

class ResourceStore extends Map<string, Resource> {
    active(key: string[] | string) {
        const keys = ensureArray(key);
        keys.forEach(v => this.get(v)?.active());
    }

    dispose(key: string[] | string) {
        const keys = ensureArray(key);
        keys.forEach(v => this.get(v)?.dispose());
    }

    destroy(key: string[] | string) {
        const keys = ensureArray(key);
        keys.forEach(v => this.get(v)?.destroy());
    }

    push(data: [string, Resource][] | Record<string, Resource>): void {
        if (data instanceof Array) {
            for (const [key, res] of data) {
                if (this.has(key)) {
                    console.warn(`Resource already exists: '${key}'.`);
                }
                this.set(key, res);
            }
        } else {
            return this.push(Object.entries(data));
        }
    }

    async getData<T extends ResourceType = ResourceType>(
        key: string
    ): Promise<ResourceData[T] | null> {
        return this.get(key)?.getData() ?? null;
    }
}

declare global {
    interface Window {
        /** 游戏资源 */
        gameResource: ResourceStore;
    }
    /** 游戏资源 */
    const gameResource: ResourceStore;
}

window.gameResource = new ResourceStore();
