/**
 * 负责资源的加载
 */
interface Loader {
    /**
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
     * 加载某一张图片
     * @param dir 图片所在目录
     * @param imgName 图片名称
     * @param callback 加载完毕的回调函数
     */
    loadImage(dir: string, imgName: string, callback?: () => void): void;

    /**
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
     * 加载一个音乐
     * @param name 要加载的音乐的名称
     */
    loadOneMusic(name: BgmIds): void;

    /**
     * 加载一个音效
     * @param name 要加载的音效的名称
     */
    loadOneSound(name: SoundIds): void;

    /**
     * 加载一个bgm
     * @param name 加载的bgm的id或名称
     */
    loadBgm(name: BgmIds | NameMapIn<BgmIds>): void;

    /**
     * 释放一个bgm的缓存
     * @param name 要释放的bgm的id或名称
     */
    freeBgm(name: BgmIds | NameMapIn<BgmIds>): void;
}

declare const loader: new () => Loader;
