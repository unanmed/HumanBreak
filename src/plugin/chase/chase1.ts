import { Animation, bezier, hyper, linear, shake, sleep } from 'mutate-animate';
import { Chase, ChaseData } from './chase';
import { completeAchievement } from '../ui/achievement';
import { Camera, CameraAnimation } from '@/core/render/camera';
import { LayerGroup } from '@/core/render/preset/layer';
import { MotaRenderer } from '@/core/render/render';
import { Sprite } from '@/core/render/sprite';

const path: Partial<Record<FloorIds, LocArr[]>> = {
    MT16: [
        [23, 23],
        [0, 23]
    ],
    MT15: [
        [63, 4],
        [61, 4],
        [61, 5],
        [58, 5],
        [58, 8],
        [54, 8],
        [54, 11],
        [51, 11],
        [51, 8],
        [45, 8],
        [45, 4],
        [47, 4],
        [47, 6],
        [51, 6],
        [51, 5],
        [52, 5],
        [52, 3],
        [50, 3],
        [50, 5],
        [48, 5],
        [48, 3],
        [35, 3],
        [35, 5],
        [31, 5],
        [31, 7],
        [34, 7],
        [34, 9],
        [31, 9],
        [31, 11],
        [12, 11],
        [12, 8],
        [1, 8],
        [1, 7],
        [0, 7]
    ],
    MT14: [
        [127, 7],
        [126, 7],
        [126, 8],
        [124, 8],
        [124, 7],
        [115.2, 7],
        [115.2, 9.2],
        [110.2, 9.2],
        [110.2, 11],
        [109.8, 11],
        [109.8, 8.8],
        [111.8, 8.8],
        [111.8, 7],
        [104, 7],
        [104, 3],
        [100, 3],
        [100, 4],
        [98, 4],
        [98, 3],
        [96, 3],
        [96, 6],
        [95, 6],
        [95, 7],
        [88, 7],
        [88, 6],
        [85, 6],
        [85, 8],
        [83, 8],
        [83, 9],
        [81, 9],
        [81, 11],
        [72, 11],
        [72, 5],
        [68, 5],
        [68, 8],
        [67, 8],
        [67, 10],
        [65, 10],
        [65, 11],
        [62, 11],
        [62, 9],
        [60, 9],
        [60, 11],
        [57, 11],
        [57, 9],
        [54, 9]
    ]
};

let back: Sprite | undefined;

/**
 * 初始化并开始这个追逐战
 */
export function initChase() {
    const ani = new Animation();

    const render = MotaRenderer.get('render-main')!;
    const layer = render.getElementById('layer-main')! as LayerGroup;

    const camera = Camera.for(layer);
    camera.clearOperation();
    const animation16 = new CameraAnimation(camera);
    const animation15 = new CameraAnimation(camera);
    const animation14 = new CameraAnimation(camera);

    const data: ChaseData = {
        path,
        camera: {
            MT16: animation16,
            MT15: animation15,
            MT14: animation14
        }
    };

    const chase = new Chase(data, flags.chaseHard === 0);

    const translate = camera.addTranslate();
    const rotate = camera.addRotate();

    // MT16 摄像机动画
    animation16.translate(translate, 0, 10, 1600, 0, hyper('sin', 'in'));
    // MT15 摄像机动画
    animation15.translate(translate, 45, 0, 2324, 0, hyper('sin', 'in'));
    animation15.translate(translate, 40, 0, 1992, 2324, hyper('sin', 'out'));
    animation15.translate(translate, 41, 0, 498, 5312, hyper('sin', 'in-out'));
    animation15.translate(translate, 37, 0, 1660, 5810, hyper('sin', 'in'));
    animation15.translate(translate, 29, 0, 830, 7470, hyper('sin', 'out'));
    animation15.translate(translate, 25, 0, 996, 11454, hyper('sin', 'in'));
    animation15.translate(translate, 12, 0, 996, 12450, linear());
    animation15.translate(translate, 0, 0, 1470, 13446, hyper('sin', 'out'));
    // MT14 摄像机动画
    animation14.translate(translate, 109, 0, 1328, 0, hyper('sin', 'in'));
    animation14.translate(translate, 104, 0, 332, 1328, hyper('sin', 'out'));
    animation14.translate(translate, 92, 0, 2822, 5478, hyper('sin', 'in'));
    animation14.translate(translate, 84, 0, 1992, 8300, linear());
    animation14.translate(translate, 74, 0, 2988, 10292, linear());
    animation14.translate(translate, 65, 0, 2988, 13280, linear());
    animation14.translate(translate, 58, 0, 1992, 16268, linear());
    animation14.translate(translate, 47, 0, 3320, 18260, linear());
    animation14.translate(translate, 36, 0, 3320, 21580, linear());
    animation14.translate(translate, 0, 0, 9960, 24900, linear());

    judgeFail1(chase, ani);
    drawBack(chase, ani);
    para1(chase);
    para2(chase);
    para3(chase, ani);

    Mota.Plugin.require('chase_g').chaseInit1();

    chase.start();
    wolfMove(chase);
}

// function chaseShake(chase: Chase) {
//     chase.ani
//         .mode(shake2(2 / 32, bezier(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)), true)
//         .time(50000)
//         .shake(1, 0);
// }

async function wolfMove(chase: Chase) {
    core.moveBlock(23, 17, Array(6).fill('down'), 80);
    await sleep(550);
    core.setBlock(508, 23, 23);
}

function judgeFail1(chase: Chase, ani: Animation) {
    chase.on('frame', () => {
        if (core.status.hero.loc.x > core.bigmap.offsetX / 32 + 17) {
            chase.end(false);
            ani.time(750).apply('rect', 0);
            core.lose('逃跑失败');
        }
    });
}

function drawBack(chase: Chase, ani: Animation) {
    chase.onFloorTime('MT15', 0, () => {
        ani.register('rect', 0);
        ani.mode(hyper('sin', 'out')).time(1500).absolute().apply('rect', 64);

        const render = MotaRenderer.get('render-main')!;
        const layer = render.getElementById('layer-main')! as LayerGroup;
        back = new Sprite('absolute', false);
        back.size(480, 480);
        back.pos(0, 0);
        back.append(layer);
        back.setRenderFn(canvas => {
            const ctx = canvas.ctx;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, 480, ani.value.rect);
            ctx.fillRect(0, 480, 480, -ani.value.rect);
        });
    });
}

function para1(chase: Chase) {
    chase.onFloorTime('MT15', 830, () => {
        for (let tx = 53; tx < 58; tx++) {
            for (let ty = 3; ty < 8; ty++) {
                core.setBlock(336, tx, ty);
            }
        }
        core.drawAnimate('explosion3', 55, 5);
        core.drawAnimate('stone', 55, 5);
    });
    chase.onFloorTime('MT15', 1080, () => {
        core.setBlock(336, 58, 9);
        core.setBlock(336, 59, 9);
        core.drawAnimate('explosion1', 58, 9);
        core.drawAnimate('explosion1', 59, 9);
    });
    chase.onFloorTime('MT15', 1190, () => {
        core.setBlock(336, 53, 8);
        core.setBlock(336, 52, 8);
        core.drawAnimate('explosion1', 53, 8);
        core.drawAnimate('explosion1', 52, 8);
    });
    chase.onFloorTime('MT15', 1580, () => {
        core.setBlock(336, 51, 7);
        core.drawAnimate('explosion1', 51, 7);
    });
    chase.onFloorTime('MT15', 1830, () => {
        core.setBlock(336, 47, 7);
        core.setBlock(336, 49, 9);
        core.drawAnimate('explosion1', 49, 9);
        core.drawAnimate('explosion1', 47, 7);
    });
}

function para2(chase: Chase) {
    let emitted32x9 = false;
    chase.onceLoc(45, 8, 'MT15', () => {
        core.setBlock(336, 45, 9);
        core.drawAnimate('explosion1', 45, 9);
    });
    chase.onceLoc(45, 6, 'MT15', () => {
        core.setBlock(336, 44, 6);
        core.drawAnimate('explosion1', 44, 6);
    });
    chase.onceLoc(45, 4, 'MT15', () => {
        core.setBlock(336, 44, 4);
        core.drawAnimate('explosion1', 44, 4);
        core.drawAnimate('explosion1', 48, 6);
        core.removeBlock(48, 6);
    });
    chase.onceLoc(41, 3, 'MT15', () => {
        core.setBlock(336, 41, 4);
        core.setBlock(336, 32, 6);
        core.drawAnimate('explosion1', 41, 4);
        core.drawAnimate('explosion1', 32, 6);
    });
    chase.onceLoc(35, 3, 'MT15', () => {
        core.drawAnimate('explosion3', 37, 7);
        core.vibrate('vertical', 1000, 25, 10);
        for (let tx = 36; tx < 42; tx++) {
            for (let ty = 4; ty < 11; ty++) {
                core.setBlock(336, tx, ty);
            }
        }
    });
    chase.onceLoc(31, 5, 'MT15', () => {
        core.vibrate('vertical', 10000, 25, 1);
        core.removeBlock(34, 8);
        core.removeBlock(33, 8);
        core.drawAnimate('explosion1', 34, 8);
        core.drawAnimate('explosion1', 33, 8);
    });
    chase.onceLoc(33, 7, 'MT15', () => {
        core.setBlock(336, 32, 9);
        core.drawAnimate('explosion1', 32, 9);
    });
    chase.onceLoc(33, 9, 'MT15', () => {
        if (emitted32x9) return;
        emitted32x9 = true;
        core.removeBlock(32, 9);
        core.drawAnimate('explosion1', 32, 9);
    });
    chase.onceLoc(34, 9, 'MT15', () => {
        if (emitted32x9) return;
        emitted32x9 = true;
        core.removeBlock(32, 9);
        core.drawAnimate('explosion1', 32, 9);
    });
    chase.onceLoc(35, 9, 'MT15', () => {
        if (emitted32x9) return;
        emitted32x9 = true;
        core.removeBlock(32, 9);
        core.drawAnimate('explosion1', 32, 9);
    });
    for (let x = 19; x < 31; x++) {
        const xx = x;
        chase.onceLoc(xx, 11, 'MT15', () => {
            core.setBlock(336, xx + 1, 11);
            core.drawAnimate('explosion1', xx + 1, 11);
        });
    }
}

function para3(chase: Chase, ani: Animation) {
    chase.onceLoc(126, 7, 'MT14', () => {
        core.setBlock(336, 126, 6);
        core.setBlock(336, 124, 6);
        core.setBlock(336, 124, 9);
        core.setBlock(336, 126, 9);
        core.drawAnimate('explosion1', 126, 6);
        core.drawAnimate('explosion1', 124, 6);
        core.drawAnimate('explosion1', 124, 9);
        core.drawAnimate('explosion1', 126, 9);
    });
    chase.onceLoc(123, 7, 'MT14', () => {
        core.setBlock(508, 127, 7);
        core.jumpBlock(127, 7, 112, 7, 500, true);
        setTimeout(() => {
            core.setBlock(509, 112, 7);
        }, 520);
        core.drawHeroAnimate('amazed');
        core.setBlock(336, 121, 6);
        core.setBlock(336, 122, 6);
        core.setBlock(336, 120, 8);
        core.setBlock(336, 121, 8);
        core.setBlock(336, 122, 8);
        core.drawAnimate('explosion1', 121, 6);
        core.drawAnimate('explosion1', 122, 6);
        core.drawAnimate('explosion1', 120, 8);
        core.drawAnimate('explosion1', 121, 8);
        core.drawAnimate('explosion1', 122, 8);
    });
    let emitted110x10 = false;
    let emitted112x8 = false;
    chase.onceLoc(110, 10, 'MT14', () => {
        core.setBlock(336, 109, 11);
        core.removeBlock(112, 8);
        core.drawAnimate('explosion1', 109, 11);
        core.drawAnimate('explosion1', 112, 8);
        core.insertAction([
            { type: 'moveHero', time: 400, steps: ['backward:1'] }
        ]);
        emitted110x10 = true;
    });
    chase.onLoc(112, 8, 'MT14', () => {
        if (!emitted110x10 || emitted112x8) return;
        core.jumpBlock(112, 7, 110, 4, 500, true);
        core.drawHeroAnimate('amazed');
        setTimeout(() => {
            core.setBlock(506, 110, 4);
        }, 540);
        emitted112x8 = true;
    });
    chase.onceLoc(118, 7, 'MT14', () => {
        core.setBlock(336, 117, 6);
        core.setBlock(336, 116, 6);
        core.setBlock(336, 115, 6);
        core.setBlock(336, 114, 6);
        core.setBlock(336, 117, 8);
        core.setBlock(336, 116, 8);
        core.drawAnimate('explosion1', 117, 6);
        core.drawAnimate('explosion1', 116, 6);
        core.drawAnimate('explosion1', 115, 6);
        core.drawAnimate('explosion1', 114, 6);
        core.drawAnimate('explosion1', 116, 8);
        core.drawAnimate('explosion1', 117, 8);
    });
    chase.onceLoc(112, 7, 'MT14', () => {
        core.setBlock(336, 112, 8);
        core.setBlock(336, 113, 7);
        core.drawAnimate('explosion1', 112, 8);
        core.drawAnimate('explosion1', 113, 7);
    });
    chase.onceLoc(115, 7, 'MT14', () => {
        for (let tx = 111; tx <= 115; tx++) {
            core.setBlock(336, tx, 10);
            core.drawAnimate('explosion1', tx, 10);
        }
        core.setBlock(336, 112, 8);
        core.drawAnimate('explosion1', 112, 8);
    });
    chase.onceLoc(110, 7, 'MT14', () => {
        core.jumpBlock(97, 4, 120, -3, 2000);
        for (let tx = 109; tx <= 120; tx++) {
            for (let ty = 3; ty <= 11; ty++) {
                if (ty == 7) continue;
                core.setBlock(336, tx, ty);
            }
        }
        core.drawAnimate('explosion2', 119, 7);
        core.removeBlock(105, 7);
        core.drawAnimate('explosion1', 105, 7);
    });
    chase.onceLoc(97, 3, 'MT14', () => {
        core.setBlock(336, 95, 3);
        core.setBlock(336, 93, 6);
        core.drawAnimate('explosion1', 95, 3);
        core.drawAnimate('explosion1', 93, 6);
    });
    chase.onceLoc(88, 6, 'MT14', () => {
        core.setBlock(336, 87, 4);
        core.setBlock(336, 88, 5);
        core.drawAnimate('explosion1', 87, 4);
        core.drawAnimate('explosion1', 88, 5);
    });
    chase.onceLoc(86, 6, 'MT14', () => {
        core.setBlock(336, 84, 6);
        core.setBlock(336, 85, 5);
        core.setBlock(336, 86, 8);
        core.drawAnimate('explosion1', 84, 6);
        core.drawAnimate('explosion1', 85, 5);
        core.drawAnimate('explosion1', 86, 8);
    });
    chase.onceLoc(81, 9, 'MT14', () => {
        core.setBlock(336, 81, 8);
        core.setBlock(336, 82, 11);
        core.drawAnimate('explosion1', 81, 8);
        core.drawAnimate('explosion1', 82, 11);
    });
    chase.onceLoc(72, 11, 'MT14', () => {
        core.setBlock(336, 73, 8);
        core.setBlock(336, 72, 4);
        core.drawAnimate('explosion1', 73, 8);
        core.drawAnimate('explosion1', 72, 4);
    });
    chase.onceLoc(71, 7, 'MT14', () => {
        for (let tx = 74; tx < 86; tx++) {
            for (let ty = 3; ty < 12; ty++) {
                core.setBlock(336, tx, ty);
            }
        }
        core.drawAnimate('explosion2', 79, 7);
        core.vibrate('vertical', 4000, 25, 15);
    });
    chase.onceLoc(68, 5, 'MT14', () => {
        core.setBlock(336, 68, 4);
        core.setBlock(336, 67, 6);
        core.drawAnimate('explosion1', 68, 4);
        core.drawAnimate('explosion1', 67, 6);
    });
    chase.onceLoc(67, 10, 'MT14', () => {
        for (let tx = 65; tx <= 72; tx++) {
            for (let ty = 3; ty <= 9; ty++) {
                core.setBlock(336, tx, ty);
            }
        }
        core.setBlock(336, 72, 10);
        core.setBlock(336, 72, 11);
        core.drawAnimate('explosion3', 69, 5);
    });
    chase.onceLoc(64, 11, 'MT14', () => {
        core.setBlock(336, 63, 9);
        core.setBlock(336, 60, 8);
        core.setBlock(336, 56, 11);
        core.drawAnimate('explosion1', 63, 9);
        core.drawAnimate('explosion1', 60, 8);
        core.drawAnimate('explosion1', 56, 11);
    });
    chase.onceLoc(57, 9, 'MT14', () => {
        for (let tx = 58; tx <= 64; tx++) {
            for (let ty = 3; ty <= 11; ty++) {
                core.setBlock(336, tx, ty);
            }
        }
        core.drawAnimate('explosion2', 61, 7);
    });
    chase.on('step', (x, y) => {
        if (core.status.floorId !== 'MT14') return;
        if (x > 20 && x < 49) {
            for (let ty = 3; ty <= 11; ty++) {
                core.setBlock(336, x + 4, ty);
                core.drawAnimate('explosion1', x + 4, ty);
            }
        }
    });
    chase.onceLoc(21, 7, 'MT14', async () => {
        flags.finishChase1 = true;
        Mota.Plugin.require('replay_g').clip('choices:0');
        core.showStatusBar();
        ani.time(750).apply('rect', 0);
        chase.end(true);
        await sleep(750);
        ani.ticker.destroy();
        core.deleteCanvas('chaseBack');
    });
}
