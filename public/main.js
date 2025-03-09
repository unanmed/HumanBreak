///<reference path="../types/declaration/core.d.ts" />
function main() {
    //------------------------ 用户修改内容 ------------------------//

    this.version = '1.0.0'; // 游戏版本号；如果更改了游戏内容建议修改此version以免造成缓存问题。

    this.useCompress = false; // 是否使用压缩文件
    this.pluginUseCompress = false;
    // 当你即将发布你的塔时，请使用“JS代码压缩工具”将所有js代码进行压缩，然后将这里的useCompress改为true。
    // 请注意，只有useCompress是false时才会读取floors目录下的文件，为true时会直接读取libs目录下的floors.min.js文件。
    // 如果要进行剧本的修改请务必将其改成false。

    this.bgmRemote = false; // 是否采用远程BGM
    this.bgmRemoteRoot = 'https://h5mota.com/music/'; // 远程BGM的根目录

    this.isCompetition = false; // 是否是比赛模式

    this.savePages = 1000; // 存档页数，每页可存5个；默认为1000页5000个存档
    this.criticalUseLoop = 1; // 循环临界的分界

    //------------------------ 用户修改内容 END ------------------------//

    this.dom = {
        body: document.body,
        game: document.getElementById('game'),
        gameDraw: document.getElementById('game-draw'),
        gameCanvas: document.getElementsByClassName('gameCanvas'),
        data: document.getElementById('data'),
        inputDiv: document.getElementById('inputDiv'),
        inputMessage: document.getElementById('inputMessage'),
        inputBox: document.getElementById('inputBox'),
        inputYes: document.getElementById('inputYes'),
        inputNo: document.getElementById('inputNo'),
        next: document.getElementById('next')
    };
    this.mode = 'play';
    this.loadList = [
        'loader',
        'control',
        'utils',
        'items',
        'icons',
        'maps',
        'enemys',
        'events',
        'actions',
        'data',
        'ui',
        'core'
    ];
    this.pureData = [
        'data',
        'enemys',
        'icons',
        'maps',
        'items',
        'functions',
        'events',
        'plugins'
    ];
    this.materials = [
        'animates',
        'enemys',
        'items',
        'npcs',
        'terrains',
        'enemy48',
        'npc48',
        'icons'
    ];

    this.statusBar = {
        image: {},
        icons: {
            floor: 0,
            name: null,
            lv: 1,
            hpmax: 2,
            hp: 3,
            atk: 4,
            def: 5,
            mdef: 6,
            money: 7,
            exp: 8,
            up: 9,
            book: 10,
            fly: 11,
            toolbox: 12,
            keyboard: 13,
            shop: 14,
            save: 15,
            load: 16,
            settings: 17,
            play: 18,
            pause: 19,
            stop: 20,
            speedDown: 21,
            speedUp: 22,
            rewind: 23,
            equipbox: 24,
            mana: 25,
            skill: 26,
            btn1: 27,
            btn2: 28,
            btn3: 29,
            btn4: 30,
            btn5: 31,
            btn6: 32,
            btn7: 33,
            btn8: 34
        }
    };
    this.floors = {};
    this.canvas = {};

    this.__VERSION__ = '2.10.0';
    this.__VERSION_CODE__ = 510;
}
// >>>> body end

main.prototype.loadScript = function (src, module) {
    const script = document.createElement('script');
    script.src = src;
    if (module) script.type = 'module';
    document.body.appendChild(script);
    return new Promise((res, rej) => {
        script.addEventListener('load', res);
        script.addEventListener('error', rej);
    });
};

main.prototype.init = async function (mode, callback) {
    try {
        const a = {};
        const b = {};
        new Proxy(a, b);
        new Promise(res => res());
        eval('`${0}`');
    } catch {
        alert('浏览器版本过低，无法游玩本塔！');
        alert('建议使用Edge浏览器或Chrome浏览器游玩！');
        return;
    }

    if (main.replayChecking) {
        main.loadSync(mode, callback);
    } else {
        main.loadAsync(mode, callback);
    }
};

main.prototype.loadSync = function (mode, callback) {
    main.mode = mode;
    if (main.useCompress) {
        main.loadMod('project', 'project', () => 0);
    } else {
        main.pureData.forEach(v => {
            main.loadMod('project', v, () => 0);
        });
    }

    const mainData = data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d.main;
    Object.assign(main, mainData);

    if (main.useCompress) {
        main.loadMod('libs', 'libs', () => 0);
    } else {
        main.loadList.forEach(v => {
            main.loadMod('libs', v, () => 0);
        });
    }

    for (const name of main.loadList) {
        if (name === 'core') continue;
        core[name] = new window[name]();
    }

    main.loadFloors(() => 0);

    const coreData = {};
    [
        'dom',
        'statusBar',
        'canvas',
        'images',
        'tilesets',
        'materials',
        'animates',
        'bgms',
        'sounds',
        'floorIds',
        'floors',
        'floorPartitions'
    ].forEach(function (t) {
        coreData[t] = main[t];
    });

    core.initSync(coreData, callback);
    main.loading.emit('coreLoaded');
    main.loading.emit('coreInit');
    core.initStatus.maps = core.maps._initMaps();
    core.resize();
    main.core = core;

    core.completeAchievement = () => 0;

    core.plugin = { drawLight: 0 };
};

main.prototype.loadAsync = async function (mode, callback) {
    for (var i = 0; i < main.dom.gameCanvas.length; i++) {
        main.canvas[main.dom.gameCanvas[i].id] =
            main.dom.gameCanvas[i].getContext('2d');
    }
    main.mode = mode;

    // 加载全塔属性代码
    if (main.useCompress) {
        await main.loadScript(`project/project.min.js?v=${main.version}`);
    } else {
        await Promise.all(
            main.pureData.map(v =>
                main.loadScript(`project/${v}.js?v=${main.version}`)
            )
        );
    }
    const mainData = data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d.main;
    Object.assign(main, mainData);

    // main.importFonts(main.fonts);

    // 加载核心js代码
    if (main.useCompress) {
        await main.loadScript(`libs/libs.min.js?v=${main.version}`);
        if (main.mode === 'play') main.loading.emit('coreLoaded');
    } else {
        await Promise.all(
            main.loadList.map(v =>
                main.loadScript(`libs/${v}.js?v=${main.version}`).then(() => {
                    if (v === 'core' && main.mode === 'play') {
                        main.loading.emit('coreLoaded');
                    }
                })
            )
        );
    }

    for (const name of main.loadList) {
        if (name === 'core') continue;
        core[name] = new window[name]();
    }

    // 加载楼层
    main.setMainTipsText('正在加载楼层文件...');
    if (main.useCompress) {
        await main.loadScript(`project/floors.min.js?v=${main.version}`);
    } else {
        await new Promise(res => {
            main.loadScript(
                `/all/__all_floors__.js?v=${
                    main.version
                }&id=${main.floorIds.join(',')}`
            ).then(
                () => {
                    main.supportBunch = true;
                    res();
                },
                async () => {
                    await Promise.all(
                        mainData.floorIds.map(v =>
                            main.loadScript(`project/floors/${v}.js`)
                        )
                    );
                    res();
                }
            );
        });
    }

    // 初始化core
    const coreData = {};
    [
        'dom',
        'statusBar',
        'canvas',
        'images',
        'tilesets',
        'materials',
        'animates',
        'bgms',
        'sounds',
        'floorIds',
        'floors',
        'floorPartitions'
    ].forEach(function (t) {
        coreData[t] = main[t];
    });
    if (main.mode === 'play') {
        await core.init(coreData, callback);
        main.loading.emit('coreInit');
        core.initStatus.maps = core.maps._initMaps();
    } else {
        await core.init(coreData, () => {
            callback();
            core.initStatus.maps = core.maps._initMaps();
        });
        main.loading.emit('coreInit');
    }

    core.resize();

    main.core = core;

    if (main.mode === 'editor') return;

    // 自动放缩最大化
    let auto = Mota.require('@motajs/legacy-ui').mainSetting.getValue(
        'autoScale',
        true
    );

    if (auto && !core.domStyle.isVertical) {
        const height = window.innerHeight;
        const width = window.innerWidth;
        const maxScale = Math.min(height / core._PY_, width / core._PX_);
        const target = Number((Math.floor(maxScale * 4) / 4).toFixed(2));
        core.domStyle.scale = target - 0.25;
    }
    if (core.domStyle.isVertical) {
        core.domStyle.scale = window.innerWidth / core._PX_;
    }
    Mota.r(() => {
        Mota.require('@motajs/render').MotaOffscreenCanvas2D.refreshAll();
    });
};

////// 加载过程提示 //////
main.prototype.setMainTipsText = function (text) {};

main.prototype.createOnChoiceAnimation = function () {};

////// 创建字体 //////
main.prototype.importFonts = function (fonts) {};

main.prototype.listen = function () {
    ////// 窗口大小变化时 //////
    window.onresize = function () {
        try {
            core.resize();
        } catch (ee) {
            console.error(ee);
        }
    };

    ////// 在界面上按下某按键时 //////
    main.dom.body.onkeydown = function (e) {
        if (main.editorOpened) return;
        try {
            if (e.keyCode === 27) e.preventDefault();
            if (main.dom.inputDiv.style.display == 'block') return;
            if (core && (core.isPlaying() || core.status.lockControl))
                core.onkeyDown(e);
        } catch (ee) {
            console.error(ee);
        }
    };

    ////// 开始选择时 //////
    main.dom.body.onselectstart = function () {
        return false;
    };

    ////// 鼠标按下时 //////
    main.dom.data.onmousedown = function (e) {
        try {
            e.stopPropagation();
            var loc = core.actions._getClickLoc(e.offsetX, e.offsetY);
            if (loc == null) return;
            core.ondown(loc);
        } catch (ee) {
            console.error(ee);
        }
    };

    ////// 鼠标移动时 //////
    main.dom.data.onmousemove = function (e) {
        try {
            var loc = core.actions._getClickLoc(e.offsetX, e.offsetY);
            if (loc == null) return;
            core.onmove(loc);
        } catch (ee) {
            console.error(ee);
        }
    };

    ////// 鼠标放开时 //////
    main.dom.data.onmouseup = function (e) {
        try {
            var loc = core.actions._getClickLoc(e.offsetX, e.offsetY);
            if (loc == null) return;
            core.onup(loc);
        } catch (ee) {
            console.error(ee);
        }
    };

    ////// 鼠标滑轮滚动时 //////
    main.dom.data.onmousewheel = function (e) {
        try {
            if (e.wheelDelta) core.onmousewheel(Math.sign(e.wheelDelta));
            else if (e.detail) core.onmousewheel(Math.sign(e.detail));
        } catch (ee) {
            console.error(ee);
        }
    };

    ////// 手指在触摸屏开始触摸时 //////
    main.dom.data.ontouchstart = function (e) {
        try {
            e.preventDefault();
            var loc = core.actions._getClickLoc(
                e.targetTouches[0].clientX,
                e.targetTouches[0].clientY,
                true
            );
            if (loc == null) return;
            main.lastTouchLoc = loc;
            core.ondown(loc);
        } catch (ee) {
            console.error(ee);
        }
    };

    ////// 手指在触摸屏上移动时 //////
    main.dom.data.ontouchmove = function (e) {
        try {
            e.preventDefault();
            var loc = core.actions._getClickLoc(
                e.targetTouches[0].clientX,
                e.targetTouches[0].clientY,
                true
            );
            if (loc == null) return;
            main.lastTouchLoc = loc;
            core.onmove(loc);
        } catch (ee) {
            console.error(ee);
        }
    };

    ////// 手指离开触摸屏时 //////
    main.dom.data.ontouchend = function (e) {
        try {
            e.preventDefault();
            if (main.lastTouchLoc == null) return;
            var loc = main.lastTouchLoc;
            delete main.lastTouchLoc;
            core.onup(loc);
        } catch (e) {
            console.error(e);
        }
    };

    window.onblur = function () {
        if (core && core.control) {
            try {
                core.control.checkAutosave();
            } catch (e) {}
        }
    };

    main.dom.inputYes.onclick = function () {
        main.dom.inputDiv.style.display = 'none';
        var func = core.platform.successCallback;
        core.platform.successCallback = core.platform.errorCallback = null;
        if (func) func(main.dom.inputBox.value);
    };

    main.dom.inputNo.onclick = function () {
        main.dom.inputDiv.style.display = 'none';
        var func = core.platform.errorCallback;
        core.platform.successCallback = core.platform.errorCallback = null;
        if (func) func(null);
    };
}; //listen end

var main = new main();
