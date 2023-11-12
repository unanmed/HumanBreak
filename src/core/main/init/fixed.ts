import { debounce } from 'lodash-es';
import { gameListener } from '../game';
import { fixedUi } from './ui';
import { ref } from 'vue';
import { sleep } from 'mutate-animate';

const close = ref(false);

let cx = 0;
let cy = 0;

/**
 * 显示定点查看
 */
const showFixed = debounce((block: Block) => {
    const e = core.material.enemys[block.event.id as EnemyIds];
    if (!e) return;
    const enemy = core.status.thisMap.enemy.get(block.x, block.y);
    fixedUi.open(
        'fixed',
        { enemy, close, loc: [cx, cy] },
        { close: closeFixed }
    );
}, 200);

/**
 * 关闭定点查看
 */
const closeFixed = () => {
    close.value = true;
    sleep(200).then(() => {
        fixedUi.closeByName('fixed');
        close.value = false;
    });
};

let hovered: Block | null;

gameListener.on('hoverBlock', block => {
    closeFixed();
    hovered = block;
});
gameListener.on('leaveBlock', (_, __, leaveGame) => {
    showFixed.cancel();
    if (!leaveGame) closeFixed();
    hovered = null;
});
gameListener.on('mouseMove', e => {
    cx = e.clientX;
    cy = e.clientY;
    showFixed.cancel();
    if (hovered) {
        showFixed(hovered);
    }
});
