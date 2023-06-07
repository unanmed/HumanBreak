import axios, { AxiosResponse } from 'axios';
import { Disposable } from '../common/disposable';
import { ensureArray } from '../../plugin/game/utils';

interface ResourceData {
    image: HTMLImageElement;
    arraybuffer: ArrayBuffer;
    text: string;
    json: any;
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

    protected resolveUrl(resource: string) {
        const resolve = resource.split('.');
        const type = resolve[0];
        const name = resolve.slice(1).join('.');
        return resource;
    }

    /**
     * 加载资源
     */
    protected async load() {
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
        } else {
            this.request = axios
                .get(data, { responseType: this.format })
                .then(v => {
                    this.resource = v;
                    this.loaded = true;
                    return v;
                });
        }
    }

    /**
     * 获取资源，如果还没加载会等待加载完毕再获取
     */
    async getData(): Promise<ResourceData[T] | null> {
        if (this.loaded) return this.resource ?? null;
        else {
            await this.request;
            return this.resource ?? null;
        }
    }
}

class ReosurceStore extends Map<string, Resource> {
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
        gameResource: ReosurceStore;
    }
    /** 游戏资源 */
    const gameResource: ReosurceStore;
}

window.gameResource = new ReosurceStore();
