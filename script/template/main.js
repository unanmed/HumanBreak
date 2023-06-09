function main() {
    //------------------------ 用户修改内容 ------------------------//

    this.version = 'v0.1'; // 游戏版本号；如果更改了游戏内容建议修改此version以免造成缓存问题。

    this.useCompress = false; // 是否使用压缩文件
    // 当你即将发布你的塔时，请使用“JS代码压缩工具”将所有js代码进行压缩，然后将这里的useCompress改为true。
    // 请注意，只有useCompress是false时才会读取floors目录下的文件，为true时会直接读取libs目录下的floors.min.js文件。
    // 如果要进行剧本的修改请务必将其改成false

    this.bgmRemote = false; // 是否采用远程BGM
    this.bgmRemoteRoot = 'https://h5mota.com/music/'; // 远程BGM的根目录

    this.isCompetition = false; // 是否是比赛模式

    this.savePages = 1000; // 存档页数，每页可存5个；默认为1000页5000个存档
    this.criticalUseLoop = 1; // 循环临界的分界

    //------------------------ 用户修改内容 END ------------------------//

    this.dom = {};
    this.mode = 'play';
    this.loadList = ['none'];
    this.pureData = ['data'];
    this.materials = [];

    this.statusBar = {
        image: {},
        icons: {}
    };
    this.floors = {};
    this.canvas = {};

    this.__VERSION__ = 'v0.1';
    this.__VERSION_CODE__ = 1000;
}

main.prototype.loadMod = function () {};

main.prototype.init = function () {};
