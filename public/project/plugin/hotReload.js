///<reference path="../../../src/types/core.d.ts" />
'use strict';

(function () {
    if (main.mode !== 'play' || main.replayChecking) return;

    /**
     * 发送请求
     * @param {string} url
     * @param {string} type
     * @param {string} data
     * @returns {Promise<string>}
     */
    async function post(url, type, data) {
        const xhr = new XMLHttpRequest();
        xhr.open(type, url);
        xhr.send(data);
        const res = await new Promise(res => {
            xhr.onload = () => {
                if (xhr.status !== 200) {
                    console.error(`hot reload: http ${xhr.status}`);
                    res('@error');
                } else res('success');
            };
            xhr.onerror = () => {
                res('@error');
                console.error(`hot reload: error on connection`);
            };
        });
        if (res === 'success') return xhr.response;
        else return '@error';
    }

    /**
     * 热重载css
     * @param {string} data
     */
    function reloadCss(data) {
        const css = document.getElementById('mota-css');
        css.remove();
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = data;
        link.id = 'mota-css';
        document.head.appendChild(link);
        console.log(`css hot reload: ${data}`);
    }

    /**
     * 热重载楼层
     * @param {string} data
     */
    async function reloadFloor(data) {
        // 如果被砍层了直接忽略
        if (
            core.status.maps[data].deleted ||
            core.status.maps[data].forceDelete
        )
            return;
        // 首先重新加载main.floors对应的楼层
        await import(`/project/floors/${data}.js?v=${Date.now()}`);
        // 然后写入core.floors并解析
        core.floors[data] = main.floors[data];
        const floor = core.loadFloor(data);
        if (core.isPlaying()) {
            core.status.maps[data] = floor;
            delete core.status.mapBlockObjs[data];
            core.extractBlocks(data);
            if (data === core.status.floorId) {
                core.drawMap(data);
                let weather = core.getFlag('__weather__', null);
                if (!weather && core.status.thisMap.weather)
                    weather = core.status.thisMap.weather;
                if (weather) core.setWeather(weather[0], weather[1]);
                else core.setWeather();
            }
            core.updateStatusBar(true, true);
        }
        console.log(`floor hot reload: ${data}`);
    }

    /**
     * 热重载脚本编辑
     * @param {string} data
     */
    async function reloadScript() {
        // 脚本编辑略微麻烦点
        const before = functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a;
        // 这里不能用动态导入，因为动态导入会变成模块，变量就不是全局的了
        const script = document.createElement('script');
        script.src = `/project/functions.js?v=${Date.now()}`;
        document.body.appendChild(script);
        await new Promise(res => {
            script.onload = () => res('success');
        });
        const after = functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a;
        // 找到差异的函数
        for (const mod in before) {
            const fns = before[mod];
            for (const id in fns) {
                const fn = fns[id];
                if (typeof fn !== 'function' || id === 'hasSpecial') continue;
                const now = after[mod][id];
                if (fn.toString() !== now.toString()) {
                    try {
                        if (mod === 'events') {
                            core.events.eventdata[id] = now;
                        } else if (mod === 'enemys') {
                            core.enemys.enemydata[id] = now;
                        } else if (mod === 'actions') {
                            core.actions.actionsdata[id] = now;
                        } else if (mod === 'control') {
                            core.control.controldata[id] = now;
                        } else if (mod === 'ui') {
                            core.ui.uidata[id] = now;
                        }
                        core.updateStatusBar(true, true);
                        console.log(`function hot reload: ${mod}.${id}`);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }
    }

    async function reloadPlugin(data) {
        // 直接import就完事了
        await import(`/project/plugin/${data}.js?v=${Date.now()}`);
        console.log(`plugin hot reload: ${data}.js`);
    }

    /**
     * 属性热重载，包括全塔属性等
     * @param {string} data
     */
    async function reloadData(data) {
        const script = document.createElement('script');
        script.src = `/project/${data}.js?v=${Date.now()}`;
        document.body.appendChild(script);
        await new Promise(res => {
            script.onload = () => res('success');
        });

        let after;
        if (data === 'data') after = data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d;
        if (data === 'enemys')
            after = enemys_fcae963b_31c9_42b4_b48c_bb48d09f3f80;
        if (data === 'icons')
            after = icons_4665ee12_3a1f_44a4_bea3_0fccba634dc1;
        if (data === 'items')
            after = items_296f5d02_12fd_4166_a7c1_b5e830c9ee3a;
        if (data === 'maps') after = maps_90f36752_8815_4be8_b32b_d7fad1d0542e;
        if (data === 'events')
            after = events_c12a15a8_c380_4b28_8144_256cba95f760;

        if (data === 'enemys') {
            core.enemys.enemys = after;
            for (var enemyId in after) {
                core.enemys.enemys[enemyId].id = enemyId;
            }
            core.material.enemys = core.getEnemys();
        } else if (data === 'icons') {
            core.icons.icons = after;
            core.material.icons = core.getIcons();
        } else if (data === 'items') {
            core.items.items = after;
            for (var itemId in after) {
                core.items.items[itemId].id = itemId;
            }
            core.material.items = core.getItems();
        } else if (data === 'maps') {
            core.maps.blocksInfo = after;
            core.status.mapBlockObjs = {};
            core.status.number2block = {};
            Object.values(core.status.maps).forEach(v => delete v.blocks);
            core.extractBlocks();
            core.setWeather(
                core.animateFrame.weather.type,
                core.animateFrame.weather.level
            );
            core.drawMap();
        } else if (data === 'events') {
            core.events.commonEvent = after.commonEvent;
        } else if (data === 'data') {
            location.reload();
        }
        core.updateStatusBar(true, true);
        console.log(`data hot reload: ${data}`);
    }

    // 初始化
    (async function () {
        const data = await post('/reload', 'POST', 'test');
        if (data === '@error') {
            console.log(`未检测到node服务，热重载插件将无法使用`);
        } else {
            console.log(`热重载插件加载成功`);
            // reload
            setInterval(async () => {
                const res = await post('/reload', 'POST');
                if (res === '@error') return;
                if (res === 'true') location.reload();
                else return;
            }, 1000);

            // hot reload
            setInterval(async () => {
                const res = await post('/hotReload', 'POST');
                const data = res.split('@@');
                data.forEach(v => {
                    if (v === '') return;
                    const [type, file] = v.split(':');
                    if (type === 'css') reloadCss(file);
                    if (type === 'data') reloadData(file);
                    if (type === 'floor') reloadFloor(file);
                    if (type === 'script') reloadScript(file);
                    if (type === 'plugin') reloadPlugin(file);
                });
            }, 1000);
        }
    })();
})();
