/** @file loader.js 主要负责资源的加载 */
declare class loader {
    /** 加载一系列图片 */
    loadImages(dir: any, names: any, toSave: any, callback?: () => any): any;

    /** 加载某一张图片 */
    loadImage(dir: any, imgName?: any, callback?: () => any): any;

    /** 从zip中加载一系列图片 */
    loadImagesFromZip(
        url?: any,
        names?: any,
        toSave?: any,
        onprogress?: any,
        onfinished?: any
    ): any;

    /** 加载一个音乐 */
    loadOneMusic(name?: string): any;

    /** 加载一个音效 */
    loadOneSound(name?: string): any;

    /** 加载一个bgm */
    loadBgm(name?: string): any;

    /** 释放一个bgm的缓存 */
    freeBgm(name?: string): any;
}
