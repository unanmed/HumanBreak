import { Danmaku } from '../danmaku';
import { Component, h } from 'vue';
import { mainSetting } from './ui';
import { getIconHeight } from '../utils';
import { BoxAnimate } from '../components';

// 图标类型
Danmaku.registerSpecContent('i', content => {
    const height = getIconHeight(content as AllIds);

    return h(BoxAnimate as Component, {
        id: content,
        noborder: true,
        noAnimate: true,
        width: 32,
        height
    });
});

if (import.meta.env.DEV) {
    Danmaku.backend = `/danmaku`;
}

Mota.require('var', 'hook').once('reset', () => {
    Danmaku.fetch();
});

// 勇士移动后显示弹幕
Mota.require('var', 'hook').on('moveOneStep', (x, y, floor) => {
    const enabled = mainSetting.getValue('ui.danmaku', true);
    if (!enabled) return;
    const f = Danmaku.allInPos[floor];
    if (f) {
        const danmaku = f[`${x},${y}`];
        if (danmaku) {
            danmaku.forEach(v => {
                setTimeout(() => {
                    v.show();
                }, Math.random() * 1000);
            });
        }
    }
});
