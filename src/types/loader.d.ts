/**
 * 负责资源的加载
 */
interface Loader {
    /**
     * @deprecated
     * 加载一系列图片
     * @param dir 图片所在目录
     * @param names 图片名称列表
     * @param toSave 要保存到的对象
     * @param callback 加载完毕后的回调函数
     */
    loadImages(
        dir: string,
        names: string[],
        toSave: Record<string, HTMLImageElement>,
        callback?: () => void
    ): void;

    /**
     * @deprecated
     * 加载某一张图片
     * @param dir 图片所在目录
     * @param imgName 图片名称
     * @param callback 加载完毕的回调函数
     */
    loadImage(
        dir: string,
        imgName: string,
        callback?: (name: string, img: HTMLImageElement) => void
    ): void;

    /**
     * @deprecated
     * 从zip中加载一系列图片
     * @param url 图片所在目录
     * @param names 图片名称列表
     */
    loadImagesFromZip(
        url: string,
        names: string,
        toSave: Record<string, HTMLImageElement>,
        onprogress?: (loaded: number, total: number) => void,
        onfinished?: () => void
    ): void;

    /**
     * @deprecated
     * 加载一个音乐
     * @param name 要加载的音乐的名称
     */
    loadOneMusic(name: BgmIds): void;

    /**
     * @deprecated
     * 加载一个音效
     * @param name 要加载的音效的名称
     */
    loadOneSound(name: SoundIds): void;

    /**
     * @deprecated
     * 加载一个bgm
     * @param name 加载的bgm的id或名称
     */
    loadBgm(name: BgmIds | NameMapIn<BgmIds>): void;

    /**
     * @deprecated
     * 释放一个bgm的缓存
     * @param name 要释放的bgm的id或名称
     */
    freeBgm(name: BgmIds | NameMapIn<BgmIds>): void;

    _loadMaterials_afterLoad(): void;

    _loadAnimate(data: string): Animate;
}

declare const loader: new () => Loader;
