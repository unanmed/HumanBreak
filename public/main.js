///<reference path="../src/types/declaration/core.d.ts" />
function main() {
    //------------------------ 用户修改内容 ------------------------//

    this.version = '1.0.0'; // 游戏版本号；如果更改了游戏内容建议修改此version以免造成缓存问题。

    this.useCompress = false; // 是否使用压缩文件
    this.scriptCompress = false; // 是否经过打包
    this.skipResourcePackage = true; // 跳过资源打包

    this.bgmRemote = false; // 是否采用远程BGM
    this.bgmRemoteRoot = 'https://h5mota.com/music/'; // 远程BGM的根目录

    this.isCompetition = false; // 是否是比赛模式

    this.savePages = 1000; // 存档页数，每页可存5个；默认为1000页5000个存档
    this.criticalUseLoop = 1; // 循环临界的分界

    //------------------------ 用户修改内容 END ------------------------//

    this.dom = {
        body: document.body,
        gameDraw: document.getElementById('game-draw'),
        gameCanvas: document.getElementsByClassName('gameCanvas'),
        inputDiv: document.getElementById('inputDiv'),
        inputMessage: document.getElementById('inputMessage'),
        inputBox: document.getElementById('inputBox'),
        inputYes: document.getElementById('inputYes'),
        inputNo: document.getElementById('inputNo')
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
    this.__VERSION_CODE__ = 610;
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
    if (main.replayChecking) {
        main.loadSync(mode, callback);
    } else {
        main.loadAsync(mode, callback);
    }
};

main.prototype.loadSync = function (mode, callback) {
    // 录像验证中应该在所有内容初始化之前加载 data.process.js
    loadSource('data.process.js');

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

    main.loading.emit('coreLoaded');

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

    core.initSync(coreData, () => {});
    main.loading.emit('coreInit');
    core.resize();
    main.core = core;

    callback?.();
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
        await main
            .loadScript(
                `/all/__all_floors__.js?v=${
                    main.version
                }&id=${main.floorIds.join(',')}`
            )
            .then(
                () => {
                    main.supportBunch = true;
                },
                async () => {
                    await Promise.all(
                        mainData.floorIds.map(v =>
                            main.loadScript(`project/floors/${v}.js`)
                        )
                    );
                }
            );
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
    const mainSetting = Mota.require('@motajs/legacy-ui').mainSetting;
    const auto = mainSetting.getValue('utils.autoScale', true);

    // 暂时不考虑手机端
    if (auto) {
        const height = window.innerHeight;
        const width = window.innerWidth;
        const maxScale = Math.min(height / core._PY_, width / core._PX_);
        const target = Number((Math.floor(maxScale * 4) / 4).toFixed(2));
        mainSetting.setValue('screen.scale', Math.round(target * 100) - 25);
    }

    Mota.r(() => {
        Mota.require('@user/client-modules').mainRenderer.setScale(
            core.domStyle.scale
        );
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
