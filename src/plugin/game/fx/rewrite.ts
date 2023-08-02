import { getEnemy } from '../enemy/battle';
import { formatDamage } from '../utils';

core.maps._initDetachedBlock = function (
    info: BlockInfo,
    x: number,
    y: number,
    displayDamage: boolean = false
) {
    let headCanvas = null,
        bodyCanvas = '__body_' + x + '_' + y,
        damageCanvas = null;

    // head
    if (!info.bigImage && info.height > 32) {
        headCanvas = '__head_' + x + '_' + y;
        core.createCanvas(headCanvas, 0, 0, 32, info.height - 32, 55);
    }
    // body
    if (info.bigImage) {
        var bigImageInfo = this._getBigImageInfo(
            info.bigImage,
            info.face,
            info.posX
        );
        const { per_width, per_height } = bigImageInfo;
        core.createCanvas(bodyCanvas, 0, 0, per_width, per_height, 35);
    } else {
        core.createCanvas(bodyCanvas, 0, 0, 32, 32, 35);
    }

    // 伤害
    if (
        info.cls.indexOf('enemy') == 0 &&
        core.hasItem('book') &&
        displayDamage
    ) {
        const enemy = getEnemy(x, y);
        const dam = enemy.calDamage();
        const { damage, color } = formatDamage(dam.damage);

        damageCanvas = '__damage_' + x + '_' + y;
        const ctx = core.createCanvas(damageCanvas, 0, 0, 32, 32, 65);
        ctx.textAlign = 'left';
        ctx.font = '14px normal';
        core.fillBoldText(ctx, damage, 1, 31, color as string);
        if (core.flags.displayCritical) {
            const critical = enemy.calCritical(1);
            const atk = core.formatBigNumber(critical[0]?.delta, true);
            const display = atk === '???' ? '?' : atk;
            core.fillBoldText(ctx, display, 1, 21, '#FFFFFF');
        }
    }
    return {
        headCanvas,
        bodyCanvas,
        damageCanvas
    };
};
