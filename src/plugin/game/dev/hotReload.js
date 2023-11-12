///<reference path="../../../../src/types/core.d.ts" />
export {};

/* @__PURE__ */ (function () {
    if (main.mode !== 'play' || main.replayChecking) return;

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
        console.log(`Css hot reload: ${data}`);
    }

    /**
     * 热重载楼层
     * @param {string} data
     */
    async function reloadFloor(data) {
        // 如果被砍层了直接忽略
        if (
            core.status.maps &&
            (core.status.maps[data].deleted ||
                core.status.maps[data].forceDelete)
        )
            return;
        // 首先重新加载main.floors对应的楼层
        await import(
            /* @vite-ignore */ `/forceTem/project/floors/${data}.js?v=${Date.now()}`
        );
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
        console.log(`Floor hot reload: ${data}`);
    }

    /**
     * 属性热重载，包括全塔属性等
     * @param {string} data
     */
    async function reloadData(data) {
        const script = document.createElement('script');
        script.src = `/forceTem/project/${data}.js?v=${Date.now()}`;
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
        console.log(`Data hot reload: ${data}`);
    }

    const ws = new WebSocket('ws://127.0.0.1:3000');
    ws.addEventListener('open', () => {
        console.log(`Web socket connect successfully`);
    });
    ws.addEventListener('message', e => {
        const data = JSON.parse(e.data);
        if (data.type === 'reload') location.reload();
        if (data.type === 'floorHotReload') reloadFloor(data.floor);
        if (data.type === 'dataHotReload') reloadData(data.data);
        if (data.type === 'cssHotReload') reloadCss(data.path);
    });
})();
