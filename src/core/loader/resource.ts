import axios, { AxiosResponse } from 'axios';
import { Disposable } from '../common/disposable';
import { ensureArray } from '../../plugin/utils';
import { has } from '../../plugin/utils';
import JSZip from 'jszip';
import { EmitableEvent, EventEmitter } from '../common/eventEmitter';

interface ResourceData {
    image: HTMLImageElement;
    arraybuffer: ArrayBuffer;
    text: string;
    json: any;
    zip: ZippedResource;
    bgm: HTMLAudioElement;
}

export type ResourceType = keyof ResourceData;
export type NonZipResource = Exclude<ResourceType, 'zip'>;

export class Resource<
    T extends ResourceType = ResourceType
> extends Disposable<string> {
    format: T;
    request?: Promise<
        AxiosResponse<ResourceData[T]> | '@imageLoaded' | '@bgmLoaded'
    >;
    loaded: boolean = false;
    uri: string;

    type!: string;
    name!: string;
    ext!: string;

    /** 资源数据 */
    resource?: ResourceData[T];

    constructor(resource: string, format: T) {
        super(resource);
        this.data = this.resolveUrl(resource);
        this.format = format;
        this.uri = resource;

        this.once('active', this.load);
        this.once('load', this.onLoad);
        this.once('loadstart', this.onLoadStart);
    }

    protected onLoadStart(v?: ResourceData[T]) {
        if (this.format === 'bgm') {
            // bgm 单独处理，因为它可以边播放边加载
            ancTe.bgm.add(this.uri, v!);
        }
    }

    protected onLoad(v: ResourceData[T]) {
        // 资源类型处理
        if (this.type === 'fonts') {
            document.fonts.add(new FontFace(this.name, v as ArrayBuffer));
        } else if (this.type === 'sounds') {
            ancTe.sound.add(this.uri, v as ArrayBuffer);
        }

        // 资源加载类型处理
        if (this.format === 'zip') {
            (this.resource as ZippedResource).once('ready', data => {
                data.forEach((path, file) => {
                    const [base, name] = path.split(/(\/|\\)/);
                    const id = `${base}.${name}`;
                    const type = getTypeByResource(id) as NonZipResource;
                    const format = getZipFormatByType(type);
                    ancTe.resource.set(
                        id,
                        new Resource(id, type).setData(file.async(format))
                    );
                });
            });
        }
    }

    /**
     * 解析资源url
     * @param resource 资源字符串
     * @returns 解析出的资源url
     */
    protected resolveUrl(resource: string) {
        const resolve = resource.split('.');
        const type = (this.type = resolve[0]);
        const name = (this.name = resolve.slice(1, -1).join('.'));
        const ext = (this.ext = '.' + resolve.at(-1));

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
        if (this.loaded) {
            throw new Error(`Cannot load one resource twice.`);
        }
        const data = this.data;
        if (!data) {
            throw new Error(`Unexpected null of url in loading resource.`);
        }
        if (this.format === 'image') {
            this.request = new Promise(res => {
                const img = new Image();
                img.src = data;
                this.emit('loadstart', img);
                img.addEventListener('load', () => {
                    this.resource = img;
                    this.loaded = true;
                    this.emit('load', img);
                    res('@imageLoaded');
                });
            });
        } else if (this.format === 'bgm') {
            this.request = new Promise(res => {
                const audio = new Audio();
                audio.src = data;
                this.emit('loadstart', audio);
                audio.addEventListener('load', () => {
                    this.resource = audio;
                    this.loaded = true;
                    this.emit('load', audio);
                    res('@bgmLoaded');
                });
            });
        } else if (
            this.format === 'json' ||
            this.format === 'text' ||
            this.format === 'arraybuffer'
        ) {
            this.emit('loadstart');
            this.request = axios
                .get(data, {
                    responseType: this.format,
                    onDownloadProgress: e => {
                        this.emit('progress', e);
                    }
                })
                .then(v => {
                    this.resource = v.data;
                    this.loaded = true;
                    this.emit('load', v.data);
                    return v;
                });
        } else if (this.format === 'zip') {
            this.emit('loadstart');
            this.request = axios
                .get(data, {
                    responseType: 'arraybuffer',
                    onDownloadProgress: e => {
                        this.emit('progress', e);
                    }
                })
                .then(v => {
                    this.resource = new ZippedResource(v.data);
                    this.loaded = true;
                    this.emit('load', this.resource);
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

    /**
     * 设置资源数据，不再需要加载
     * @param data 数据
     */
    protected setData(data: ResourceData[T] | Promise<ResourceData[T]>) {
        if (data instanceof Promise) {
            data.then(v => {
                this.loaded = true;
                this.resource = v;
                this.emit('load', v);
            });
        } else {
            this.loaded = true;
            this.resource = data;
            this.emit('load', data);
        }
        return this;
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

class ResourceStore<T extends ResourceType> extends Map<string, Resource<T>> {
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

    push(data: [string, Resource<T>][] | Record<string, Resource<T>>): void {
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

    getDataSync<T extends ResourceType = ResourceType>(
        key: string
    ): ResourceData[T] | null {
        return this.get(key)?.resource ?? null;
    }
}

export function getTypeByResource(resource: string): ResourceType {
    const type = resource.split('.')[0];

    if (type === 'zip') return 'zip';
    else if (type === 'bgms') return 'bgm';
    else if (['images', 'autotiles', 'materials', 'tilesets'].includes(type)) {
        return 'image';
    } else if (['sounds', 'fonts'].includes(type)) return 'arraybuffer';
    else if (type === 'animates') return 'json';

    return 'arraybuffer';
}

export function getZipFormatByType(type: ResourceType): 'arraybuffer' | 'text' {
    if (type === 'text' || type === 'json') return 'text';
    else return 'arraybuffer';
}

declare global {
    interface AncTe {
        /** 游戏资源 */
        resource: ResourceStore<Exclude<ResourceType, 'zip'>>;
        zipResource: ResourceStore<'zip'>;
    }
}

ancTe.resource = new ResourceStore();
ancTe.zipResource = new ResourceStore();
