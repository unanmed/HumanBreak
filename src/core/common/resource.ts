import axios, { AxiosRequestConfig, ResponseType } from 'axios';
import { Disposable } from './disposable';
import { logger } from './logger';
import JSZip from 'jszip';
import { EventEmitter } from './eventEmitter';

type ProgressFn = (now: number, total: number) => void;

interface ResourceType {
    text: string;
    buffer: ArrayBuffer;
    image: HTMLImageElement;
    material: HTMLImageElement;
    audio: HTMLAudioElement;
    json: any;
    zip: JSZip;
}

interface ResourceMap {
    text: TextResource;
    buffer: BufferResource;
    image: ImageResource;
    material: MaterialResource;
    audio: AudioResource;
    json: JSONResource;
    zip: ZipResource;
}

interface CompressedLoadListItem {
    type: keyof ResourceType;
    name: string;
    usage: string;
}
type CompressedLoadList = Record<string, CompressedLoadListItem[]>;

const types: Record<keyof ResourceType, JSZip.OutputType> = {
    text: 'string',
    buffer: 'arraybuffer',
    image: 'blob',
    material: 'blob',
    audio: 'arraybuffer',
    json: 'string',
    zip: 'arraybuffer'
};

const base = import.meta.env.DEV ? '/' : '';

function toURL(uri: string) {
    return import.meta.env.DEV ? uri : `${import.meta.env.BASE_URL}${uri}`;
}

export abstract class Resource<T = any> extends Disposable<string> {
    type = 'none';

    uri: string = '';
    resource?: T;
    loaded: boolean = false;

    /**
     * 创建一个资源
     * @param uri 资源的URI，格式为 type/file
     * @param type 资源类型，不填为none，并会抛出警告
     */
    constructor(uri: string, type: string = 'none') {
        super(uri);
        this.type = type;
        this.uri = uri;

        if (this.type === 'none') {
            logger.warn(1);
        }
    }

    /**
     * 加载这个资源，需要被子类override
     */
    abstract load(onProgress?: ProgressFn): Promise<T>;

    /**
     * 解析资源URI，解析为一个URL，可以直接由请求获取
     */
    abstract resolveURI(): string;

    /**
     * 获取资源数据，当数据未加载完毕或未启用时返回null
     */
    getData(): T | null {
        if (!this.activated || !this.loaded) return null;
        if (this.resource === null || this.resource === void 0) return null;
        return this.resource;
    }
}

export class ImageResource extends Resource<HTMLImageElement> {
    /**
     * 创建一个图片资源
     * @param uri 图片资源的URI，格式为 image/file，例如 'image/project/images/hero.png'
     */
    constructor(uri: string) {
        super(uri, 'image');
    }

    load(onProgress?: ProgressFn): Promise<HTMLImageElement> {
        const img = new Image();
        img.src = this.resolveURI();
        this.resource = img;
        return new Promise<HTMLImageElement>(res => {
            img.addEventListener('load', () => {
                this.loaded = true;
                img.setAttribute('_width', img.width.toString());
                img.setAttribute('_height', img.height.toString());
                res(img);
            });
        });
    }

    resolveURI(): string {
        return toURL(`${base}${findURL(this.uri)}`);
    }
}

export class MaterialResource extends ImageResource {
    /**
     * 创建一个material资源
     * @param uri 资源的URI，格式为 material/file，例如 'material/enemys.png'
     */
    constructor(uri: string) {
        super(uri);
        this.type = 'material';
    }

    override resolveURI(): string {
        return toURL(`${base}project/materials/${findURL(this.uri)}`);
    }
}

export class TextResource extends Resource<string> {
    /**
     * 创建一个文字资源
     * @param uri 文字资源的URI，格式为 text/file，例如 'text/myText.txt'
     *            这样的话会加载塔根目录下的 myText.txt 文件
     */
    constructor(uri: string) {
        super(uri, 'text');
    }

    load(onProgress?: ProgressFn): Promise<string> {
        return new Promise(res => {
            createAxiosLoader<string>(
                this.resolveURI(),
                'text',
                onProgress
            ).then(value => {
                this.resource = value.data;
                this.loaded = true;
                res(value.data);
            });
        });
    }

    resolveURI(): string {
        return toURL(`${base}${findURL(this.uri)}`);
    }
}

export class BufferResource extends Resource<ArrayBuffer> {
    /**
     * 创建一个二进制缓冲区资源
     * @param uri 资源的URI，格式为 buffer/file，例如 'buffer/myBuffer.mp3'
     */
    constructor(uri: string) {
        super(uri, 'buffer');
    }

    load(onProgress?: ProgressFn): Promise<ArrayBuffer> {
        return new Promise(res => {
            createAxiosLoader<ArrayBuffer>(
                this.resolveURI(),
                'arraybuffer',
                onProgress
            ).then(value => {
                this.resource = value.data;
                this.loaded = true;
                res(value.data);
            });
        });
    }

    resolveURI(): string {
        return toURL(`${base}${findURL(this.uri)}`);
    }
}

export class JSONResource<T = any> extends Resource<T> {
    /**
     * 创建一个JSON对象资源
     * @param uri 资源的URI，格式为 json/file，例如 'buffer/myJSON.json'
     */
    constructor(uri: string) {
        super(uri, 'json');
    }

    load(onProgress?: ProgressFn): Promise<any> {
        return new Promise(res => {
            createAxiosLoader<any>(this.resolveURI(), 'json', onProgress).then(
                value => {
                    this.resource = value.data;
                    this.loaded = true;
                    res(value.data);
                }
            );
        });
    }

    resolveURI(): string {
        return toURL(`${base}${findURL(this.uri)}`);
    }
}

export class AudioResource extends Resource<HTMLAudioElement> {
    /**
     * 创建一个音乐资源
     * @param uri 音乐资源的URI，格式为 audio/file，例如 'audio/bgm.mp3'
     *            注意这个资源类型为 bgm 等只在播放时才开始流式加载的音乐资源类型，
     *            对于需要一次性加载完毕的需要使用 BufferResource 进行加载，
     *            并可以通过 AudioPlayer 类进行解析播放
     */
    constructor(uri: string) {
        super(uri, 'audio');
    }

    load(onProgress?: ProgressFn): Promise<HTMLAudioElement> {
        const audio = new Audio();
        audio.src = this.resolveURI();
        this.resource = audio;
        return new Promise<HTMLAudioElement>(res => {
            this.loaded = true;
            res(audio);
        });
    }

    resolveURI(): string {
        return toURL(`${base}project/bgms/${findURL(this.uri)}`);
    }
}

export class ZipResource extends Resource<JSZip> {
    /**
     * 创建一个zip压缩资源
     * @param uri 资源的URI，格式为 zip/file，例如 'zip/myZip.h5data'
     *            注意后缀名不要是zip，不然有的浏览器会触发下载，而不是加载
     */
    constructor(uri: string) {
        super(uri, 'zip');
        this.type = 'zip';
    }

    async load(onProgress?: ProgressFn): Promise<JSZip> {
        const data = await new Promise<ArrayBuffer>(res => {
            createAxiosLoader<ArrayBuffer>(
                this.resolveURI(),
                'arraybuffer',
                onProgress
            ).then(value => {
                res(value.data);
            });
        });
        const unzipped = await JSZip.loadAsync(data);
        this.resource = unzipped;
        this.loaded = true;
        return unzipped;
    }

    resolveURI(): string {
        return toURL(`${base}${findURL(this.uri)}`);
    }
}

function createAxiosLoader<T = any>(
    url: string,
    responseType: ResponseType,
    onProgress?: (now: number, total: number) => void
) {
    const config: AxiosRequestConfig<T> = {};
    config.responseType = responseType;
    if (onProgress) {
        config.onDownloadProgress = e => {
            onProgress(e.loaded, e.total ?? 0);
        };
    }
    return axios.get<T>(url, config);
}

function findURL(uri: string) {
    return uri.slice(uri.indexOf('/') + 1);
}

export const resourceTypeMap = {
    text: TextResource,
    buffer: BufferResource,
    image: ImageResource,
    material: MaterialResource,
    audio: AudioResource,
    json: JSONResource,
    zip: ZipResource
};

interface LoadEvent<T extends keyof ResourceType> {
    progress: (
        type: keyof ResourceType,
        uri: string,
        now: number,
        total: number
    ) => void;
    load: (resource: ResourceMap[T]) => void | Promise<any>;
    loadStart: (resource: ResourceMap[T]) => void;
}

type TaskProgressFn = (
    loadedByte: number,
    totalByte: number,
    loadedTask: number,
    totalTask: number
) => void;

export class LoadTask<
    T extends keyof ResourceType = keyof ResourceType
> extends EventEmitter<LoadEvent<T>> {
    static totalByte: number = 0;
    static loadedByte: number = 0;
    static totalTask: number = 0;
    static loadedTask: number = 0;
    static errorTask: number = 0;

    /** 所有的资源，包括没有添加到加载任务里面的 */
    static store: Map<string, Resource> = new Map();
    static taskList: Set<LoadTask> = new Set();
    static loadedTaskList: Set<LoadTask> = new Set();

    private static progress: TaskProgressFn;
    private static caledTask: Set<string> = new Set();

    resource: Resource;
    type: T;
    uri: string;

    private loadingStarted: boolean = false;
    loading: boolean = false;
    loaded: number = 0;

    /**
     * 新建一个加载任务
     * @param type 任务类型
     * @param uri 加载内容的URL
     */
    constructor(type: T, uri: string) {
        super();
        this.resource = new resourceTypeMap[type](uri);
        this.type = type;
        this.uri = uri;
        LoadTask.store.set(uri, this.resource);
    }

    /**
     * 执行加载过程，当加载完毕后，返回的Promise将会被resolve
     * @returns 加载的Promise
     */
    async load(): Promise<ResourceType[T]> {
        if (this.loadingStarted) {
            logger.warn(2, this.resource.type, this.resource.uri);
            return new Promise<void>(res => res());
        }
        this.loadingStarted = true;
        let totalByte = 0;
        const load = this.resource
            .load((now, total) => {
                this.loading = true;
                this.emit('progress', this.type, this.uri, now, total);
                if (!LoadTask.caledTask.has(this.uri) && total !== 0) {
                    LoadTask.totalByte += total;
                    totalByte = total;
                    LoadTask.caledTask.add(this.uri);
                }
                this.loaded = now;
            })
            .catch(reason => {
                LoadTask.errorTask++;
                logger.error(2, this.resource.type, this.resource.uri);
            });
        this.emit('loadStart', this.resource);
        const value = await load;
        // @ts-ignore
        LoadTask.loadedTaskList.add(this);
        this.loaded = totalByte;
        LoadTask.loadedTask++;
        await Promise.all(this.emit('load', this.resource));
        return await value;
    }

    /**
     * 新建一个加载任务，同时将任务加入加载列表
     * @param type 任务类型
     * @param uri 加载内容的URI
     */
    static add<T extends keyof ResourceType>(
        type: T,
        uri: string
    ): LoadTask<T> {
        const task = new LoadTask(type, uri);
        // @ts-ignore
        this.taskList.add(task);
        return task;
    }

    /**
     * 将一个加载任务加入加载列表
     * @param task 要加入列表的任务
     */
    static addTask(task: LoadTask) {
        this.taskList.add(task);
    }

    /**
     * 执行所有加载
     */
    static async load() {
        this.totalTask = this.taskList.size;
        const fn = () => {
            this.loadedByte = [...this.taskList].reduce((prev, curr) => {
                return prev + curr.loaded;
            }, 0);
            this.progress?.(
                this.loadedByte,
                this.totalByte,
                this.loadedTask,
                this.totalTask
            );
        };
        fn();
        const interval = window.setInterval(fn, 100);
        const data = await Promise.all([...this.taskList].map(v => v.load()));
        window.clearInterval(interval);
        this.loadedByte = this.totalByte;
        fn();
        this.progress?.(
            this.totalByte,
            this.totalByte,
            this.totalTask,
            this.totalTask
        );
        return data;
    }

    /**
     * 设置当加载进度改变时执行的函数
     */
    static onProgress(progress: TaskProgressFn) {
        this.progress = progress;
    }

    /**
     * 重置加载设置
     */
    static reset() {
        this.loadedByte = 0;
        this.loadedTask = 0;
        this.totalByte = 0;
        this.totalTask = 0;
        this.errorTask = 0;
        this.caledTask.clear();
        this.taskList.clear();
    }
}

export function loadDefaultResource() {
    const data = data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d;
    const icon = icons_4665ee12_3a1f_44a4_bea3_0fccba634dc1;
    // bgm
    data.main.bgms.forEach(v => {
        const res = LoadTask.add('audio', `audio/${v}`);
        Mota.r(() => {
            res.once('loadStart', res => {
                Mota.require('var', 'bgm').add(`bgms.${v}`, res.resource!);
            });
        });
    });
    // fonts
    data.main.fonts.forEach(v => {
        const res = LoadTask.add('buffer', `buffer/project/fonts/${v}.ttf`);
        Mota.r(() => {
            res.once('load', res => {
                document.fonts.add(new FontFace(v, res.resource!));
            });
        });
    });
    // image
    data.main.images.forEach(v => {
        const res = LoadTask.add('image', `image/project/images/${v}`);
        res.once('load', res => {
            core.material.images.images[v] = res.resource!;
        });
    });
    // sound
    data.main.sounds.forEach(v => {
        const res = LoadTask.add('buffer', `buffer/project/sounds/${v}`);
        Mota.r(() => {
            res.once('load', res => {
                Mota.require('var', 'sound').add(`sounds.${v}`, res.resource!);
            });
        });
    });
    // tileset
    data.main.tilesets.forEach(v => {
        const res = LoadTask.add('image', `image/project/tilesets/${v}`);
        res.once('load', res => {
            core.material.images.tilesets[v] = res.resource!;
        });
    });
    // autotile
    const autotiles: Partial<Record<AllIdsOf<'autotile'>, HTMLImageElement>> =
        {};
    Object.keys(icon.autotile).forEach(v => {
        const res = LoadTask.add('image', `image/project/autotiles/${v}.png`);
        res.once('load', res => {
            autotiles[v as AllIdsOf<'autotile'>] = res.resource;
            const loading = Mota.require('var', 'loading');
            loading.addAutotileLoaded();
            loading.onAutotileLoaded(autotiles);
            core.material.images.autotile[v as AllIdsOf<'autotile'>] =
                res.resource!;
        });
    });
    // materials
    const imgs = core.materials.slice() as SelectKey<
        MaterialImages,
        HTMLImageElement
    >[];
    imgs.push('keyboard');
    core.materials
        .map(v => `${v}.png`)
        .forEach(v => {
            const res = LoadTask.add('material', `material/${v}`);
            res.once('load', res => {
                // @ts-ignore
                core.material.images[
                    v.slice(0, -4) as SelectKey<
                        MaterialImages,
                        HTMLImageElement
                    >
                ] = res.resource;
            });
        });
    const weathers: (keyof Weather)[] = ['fog', 'cloud', 'sun'];
    weathers.forEach(v => {
        const res = LoadTask.add('material', `material/${v}.png`);
        res.once('load', res => {
            // @ts-ignore
            core.animateFrame.weather[v] = res.resource;
        });
    });
    // animates
    {
        const res = LoadTask.add(
            'text',
            `text/all/__all_animates__?v=${
                main.version
            }&id=${data.main.animates.join(',')}`
        );
        res.once('load', res => {
            const data = res.resource!.split('@@@~~~###~~~@@@');
            data.forEach((v, i) => {
                const id = main.animates[i];
                if (v === '') {
                    throw new Error(`Cannot find animate: '${id}'`);
                }
                core.material.animates[id] = core.loader._loadAnimate(v);
            });
        });
    }
}

export async function loadCompressedResource() {
    const data = await axios.get(toURL('loadList.json'), {
        responseType: 'text'
    });
    const list: CompressedLoadList = JSON.parse(data.data);

    const d = data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d;
    // 对于bgm，直接按照原来的方式加载即可
    d.main.bgms.forEach(v => {
        const res = LoadTask.add('audio', `audio/${v}`);
        Mota.r(() => {
            res.once('loadStart', res => {
                Mota.require('var', 'bgm').add(`bgms.${v}`, res.resource!);
            });
        });
    });
    // 对于区域内容，按照zip格式进行加载，然后解压处理
    const autotiles: Partial<Record<AllIdsOf<'autotile'>, HTMLImageElement>> =
        {};
    const materialImages = core.materials.slice() as SelectKey<
        MaterialImages,
        HTMLImageElement
    >[];
    materialImages.push('keyboard');
    const weathers: (keyof Weather)[] = ['fog', 'cloud', 'sun'];

    Object.entries(list).forEach(v => {
        const [uri, list] = v;
        const res = LoadTask.add('zip', `zip/${uri}`);

        res.once('load', resource => {
            const res = resource.resource;
            if (!res) return;
            return Promise.all(
                list.map(async v => {
                    const { type, name, usage } = v;
                    const asyncType = types[type];
                    const value = await res
                        .file(`${type}/${name}`)
                        ?.async(asyncType);

                    if (!value) return;

                    // 图片类型的资源
                    if (type === 'image') {
                        const img = value as Blob;
                        const image = new Image();
                        image.src = URL.createObjectURL(img);
                        image.addEventListener('load', () => {
                            image.setAttribute(
                                '_width',
                                image.width.toString()
                            );
                            image.setAttribute(
                                '_height',
                                image.height.toString()
                            );
                        });

                        // 图片
                        if (usage === 'image') {
                            core.material.images.images[name as ImageIds] =
                                image;
                        } else if (usage === 'tileset') {
                            // 额外素材
                            core.material.images.tilesets[name] = image;
                        } else if (usage === 'autotile') {
                            // 自动元件
                            autotiles[
                                name.slice(0, -4) as AllIdsOf<'autotile'>
                            ] = image;
                            const loading = Mota.require('var', 'loading');
                            loading.addAutotileLoaded();
                            loading.onAutotileLoaded(autotiles);
                            core.material.images.autotile[
                                name.slice(0, -4) as AllIdsOf<'autotile'>
                            ] = image;
                        }
                    } else if (type === 'material') {
                        const img = value as Blob;
                        const image = new Image();
                        image.src = URL.createObjectURL(img);
                        image.addEventListener('load', () => {
                            image.setAttribute(
                                '_width',
                                image.width.toString()
                            );
                            image.setAttribute(
                                '_height',
                                image.height.toString()
                            );
                        });

                        // material
                        if (materialImages.some(v => name === v + '.png')) {
                            // @ts-ignore
                            core.material.images[
                                name.slice(0, -4) as SelectKey<
                                    MaterialImages,
                                    HTMLImageElement
                                >
                            ] = image;
                        } else if (weathers.some(v => name === v + '.png')) {
                            // @ts-ignore
                            core.animateFrame.weather[v] = image;
                        }
                    }

                    if (usage === 'font') {
                        const font = value as ArrayBuffer;
                        document.fonts.add(
                            new FontFace(name.slice(0, -4), font)
                        );
                    } else if (usage === 'sound') {
                        const sound = value as ArrayBuffer;
                        Mota.require('var', 'sound').add(
                            `sounds.${name}`,
                            sound
                        );
                    } else if (usage === 'animate') {
                        const ani = value as string;
                        core.material.animates[
                            name.slice(0, -8) as AnimationIds
                        ] = core.loader._loadAnimate(ani);
                    }
                })
            );
        });
    });
}
