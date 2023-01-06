import { cloneDeep, debounce } from 'lodash';
import { ref } from 'vue';
import { getDamageColor } from '../utils';

export const showFixed = ref(false);

const show = debounce((ev: MouseEvent) => {
    if (!window.flags) return;
    if (!flags.mouseLoc) return;
    flags.clientLoc = [ev.clientX, ev.clientY];
    const [x, y] = flags.mouseLoc;
    const mx = Math.round(x + core.bigmap.offsetX / 32);
    const my = Math.round(y + core.bigmap.offsetY / 32);
    const e = core.getBlockId(mx, my);
    if (!e || !core.getClsFromId(e)?.startsWith('enemy')) return;
    const enemy = core.material.enemys[e as EnemyIds];
    const detail = getDetailedEnemy(enemy, mx, my);
    core.plugin.bookDetailEnemy = detail;
    showFixed.value = true;
}, 200);

export default function init() {
    const data = core.canvas.data.canvas;
    data.addEventListener('mousemove', ev => {
        showFixed.value = false;
        show(ev);
    });

    return {
        showFixed
    };
}

export function getDetailedEnemy<I extends EnemyIds>(
    enemy: Enemy<I>,
    x: number,
    y: number,
    floorId: FloorIds = core.status.floorId
): DetailedEnemy<I> {
    const ratio = core.status.maps[floorId].ratio;
    const enemyInfo = Object.assign(
        core.getEnemyInfo(enemy, void 0, x, y),
        core.getDamageInfo(enemy, void 0, x, y) ?? {},
        enemy
    );
    const critical = core.nextCriticals(enemy, 1, x, y);
    const defDamage = core.getDefDamage(enemy, ratio, x, y);
    const specialText = core.getSpecialText(enemyInfo);
    let toShowSpecial = cloneDeep(specialText);
    if (toShowSpecial.length > 2) {
        toShowSpecial = toShowSpecial.slice(0, 2).concat(['...']);
    }
    const specialColor = core.getSpecialColor(enemyInfo);
    let toShowColor = cloneDeep(specialColor);
    if (toShowColor.length > 2) {
        toShowColor = toShowColor.slice(0, 2).concat(['#fff']);
    }
    if (toShowSpecial.length === 0) {
        toShowSpecial = ['无属性'];
        toShowColor = ['#fff'];
    }
    const damageColor = getDamageColor(enemyInfo.damage);
    const detail: DetailedEnemy<I> = Object.assign(enemyInfo, {
        critical: critical[0][0],
        criticalDamage: critical[0][1],
        defDamage,
        specialColor,
        specialText,
        toShowColor,
        toShowSpecial,
        damageColor
    });
    return detail;
}
