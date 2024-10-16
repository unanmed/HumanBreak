import { Animation, hyper, linear, power, sleep } from 'mutate-animate';
import { Chase, ChaseData, IChaseController } from './chase';
import { completeAchievement } from '../ui/achievement';
import { Camera, CameraAnimation, CameraScale } from '@/core/render/camera';
import { LayerGroup } from '@/core/render/preset/layer';
import { MotaRenderer } from '@/core/render/render';
import { Sprite } from '@/core/render/sprite';
import { bgm } from '@/core/audio/bgm';
import { PointEffect, PointEffectType } from '../fx/pointShader';

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
let contrastId: number = 0;
const effect = new PointEffect();

Mota.require('var', 'loading').once('loaded', () => {
    effect.create(Chase.shader, 40);
});

/**
 * 初始化并开始这个追逐战
 */
export function initChase(): IChaseController {
    const ani = new Animation();

    const render = MotaRenderer.get('render-main')!;
    const layer = render.getElementById('layer-main')! as LayerGroup;

    const camera = new Camera(layer);
    camera.clearOperation();
    camera.transform = layer.camera;
    camera.disable();
    const animation16 = new CameraAnimation(camera);
    const animation15 = new CameraAnimation(camera);
    const animation14 = new CameraAnimation(camera);
    effect.setTransform(layer.camera);

    const data: ChaseData = {
        path,
        camera: {
            MT16: animation16,
            MT15: animation15,
            MT14: animation14
        }
    };

    const chase = new Chase(data, flags.chaseHard === 0);

    // 旋转在前，平移在后
    const translate1 = camera.addTranslate();
    const scale = camera.addScale();
    const rotate = camera.addRotate();
    const translate2 = camera.addTranslate();
    const translate = camera.addTranslate();

    translate1.x = -7 * 32;
    translate1.y = -7 * 32;
    translate2.x = 7 * 32;
    translate2.y = 7 * 32;

    translate.x = 10 * 32;
    translate.y = 10 * 32;

    const inOut = hyper('sin', 'in-out');
    // MT16 摄像机动画
    animation16.translate(translate, 10, 10, 1, 0, linear());
    animation16.translate(translate, 0, 10, 1600, 0, hyper('sin', 'in'));
    // MT15 摄像机动画
    animation15.rotate(rotate, -Math.PI / 30, 4000, 0, inOut);
    animation15.rotate(rotate, 0, 3000, 5000, inOut);
    animation15.rotate(rotate, -Math.PI / 40, 1800, 11000, inOut);
    animation15.rotate(rotate, 0, 2000, 13000, inOut);
    animation15.translate(translate, 49, 0, 1, 0, linear());
    animation15.translate(translate, 45, 0, 2324, 0, hyper('sin', 'in'));
    animation15.translate(translate, 40, 0, 1992, 2324, hyper('sin', 'out'));
    animation15.translate(translate, 41, 0, 498, 5312, hyper('sin', 'in-out'));
    animation15.translate(translate, 37, 0, 1660, 5810, hyper('sin', 'in'));
    animation15.translate(translate, 29, 0, 830, 7470, hyper('sin', 'out'));
    animation15.translate(translate, 25, 0, 996, 11454, hyper('sin', 'in'));
    animation15.translate(translate, 12, 0, 996, 12450, linear());
    animation15.translate(translate, 0, 0, 1470, 13446, hyper('sin', 'out'));
    // MT14 摄像机动画
    animation14.rotate(rotate, -Math.PI / 70, 1000, 0, inOut);
    animation14.rotate(rotate, 0, 4000, 2000, inOut);
    animation14.translate(translate, 113, 0, 1, 0, hyper('sin', 'in'));
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

    chase.on('end', success => {
        camera.transform.reset();
        camera.transform.translate(
            -translate.x * 32 - 7 * 32,
            -translate.y * 32 - 7 * 32
        );
        animation16.destroy();
        animation15.destroy();
        animation14.destroy();
        camera.destroy();
        back?.destroy();
        back = void 0;
        core.removeFlag('onChase');
        core.removeFlag('chaseId');

        if (success) {
            completeAchievement('challenge', 0);
        }
    });

    judgeFail1(chase, ani, camera);
    drawBack(chase, ani);
    para1(chase, ani);
    para2(chase, ani);
    para3(chase, ani);
    processScale(chase, ani, scale, camera);

    Mota.Plugin.require('chase_g').chaseInit1();

    chase.on('end', () => {
        effect.end();
        camera.destroy();
    });

    chase.on('frame', () => {
        effect.requestUpdate();
    });

    chase.on('changeFloor', () => {
        effect.clearEffect();
    });

    const controller: IChaseController = {
        chase,
        start(fromSave) {
            core.setFlag('onChase', true);
            core.setFlag('chaseId', 1);
            chase.start();
            camera.enable();
            wolfMove(chase);
            effect.use();
            effect.start();
            if (fromSave) {
                initFromSave(chase);
            }
            // testEffect();
        },
        end(success) {
            chase.end(success);
        },
        initAudio(fromSave) {
            if (fromSave) initFromSave(chase);
            else initAudio(chase);
        }
    };
    return controller;
}

function testEffect() {
    // effect.addEffect(
    //     PointEffectType.CircleContrast,
    //     Date.now(),
    //     100000,
    //     [7 * 32 + 16, 17 * 32 + 16, 200, 150],
    //     [1, 0, 0, 0]
    // );
    effect.addEffect(
        PointEffectType.CircleWarp,
        Date.now(),
        100000,
        [7 * 32 + 16, 17 * 32 + 16, 200, 20],
        [1 / 20, 1, 0.5, 0],
        [0, Math.PI * 2, 0, 0]
    );
    // chase.on('frame', () => {
    //     effect.requestUpdate();
    // });
}

function initAudio(chase: Chase) {
    playAudio(0, chase);
}

function initFromSave(chase: Chase) {
    playAudio(43.5, chase);
}

function playAudio(from: number, chase: Chase) {
    bgm.changeTo('escape.mp3', from);
    bgm.blockChange();
    chase.on('end', () => {
        bgm.unblockChange();
        bgm.undo();
    });
}

// function chaseShake(chase: Chase) {
//     chase.ani
//         .mode(shake2(2 / 32, bezier(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)), true)
//         .time(50000)
//         .shake(1, 0);
// }

function processScale(
    chase: Chase,
    ani: Animation,
    scale: CameraScale,
    camera: Camera
) {
    chase.onceLoc(35, 3, 'MT15', () => {
        camera.applyScaleAnimation(scale, ani, 2200);
        ani.mode(linear()).time(1).scale(1.2);
        sleep(150).then(() => {
            ani.mode(hyper('sin', 'out')).time(2000).scale(1);
        });
    });
    chase.onFloorTime('MT14', 100, () => {
        camera.applyScaleAnimation(scale, ani, 30000);
        ani.mode(hyper('sin', 'in-out')).time(3000).scale(0.8);
    });
    chase.onceLoc(57, 10, 'MT14', () => {
        ani.mode(power(6, 'in')).time(200).scale(1.1);
        sleep(200).then(() => {
            ani.mode(hyper('sin', 'in-out')).time(3000).scale(1);
        });
    });
}

async function wolfMove(chase: Chase) {
    core.moveBlock(23, 17, Array(6).fill('down'), 80);
    await sleep(550);
    core.setBlock(508, 23, 23);
}

function judgeFail1(chase: Chase, ani: Animation, camera: Camera) {
    chase.on('frame', () => {
        const now = Date.now();
        const time = now - chase.nowFloorTime;
        if (time < 500) return;
        if (core.status.hero.loc.x > -camera.transform.x / 32 + 22) {
            chase.end(false);
            if (ani.value.rect !== void 0) {
                ani.time(750).apply('rect', 0);
            }
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
        back.setZIndex(100);
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

function addCommonWarp(x: number, y: number) {
    effect.addEffect(
        PointEffectType.CircleWarp,
        Date.now(),
        500,
        [x * 32 + 16, y * 32 + 16, 48, 32],
        [1 / 10, 6, 0.8, 0],
        [0, -Math.PI, 0, 0]
    );
}

function addMediumWarp(x: number, y: number) {
    effect.addEffect(
        PointEffectType.CircleWarp,
        Date.now(),
        5000,
        [x * 32 + 16, y * 32 + 16, 480, 64],
        [1 / 40, 1, 0.5, 0],
        [0, Math.PI * 2, 0, 0]
    );
}

function addLargeWarp(x: number, y: number) {
    effect.addEffect(
        PointEffectType.CircleWarp,
        Date.now(),
        10000,
        [x * 32 + 16, y * 32 + 16, 1080, 96],
        [1 / 25, 1, 0.5, 0],
        [0, Math.PI * 2, 0, 0]
    );
}

function addCommonContrast(x: number, y: number, ani: Animation, chase: Chase) {
    const id = contrastId++;
    const name = 'contrast' + id;
    ani.register(name, 1);
    sleep(500).then(() => {
        ani.mode(linear()).absolute().time(1500).apply(name, 0);
    });
    const fx = effect.addEffect(
        PointEffectType.CircleContrast,
        Date.now(),
        2000,
        [x * 32 + 16, y * 32 + 16, 48, 8],
        [1, 0, 0, 0]
    );
    const fn = () => {
        effect.setEffect(fx, void 0, [ani.value[name], 0, 0, 0]);
    };
    chase.on('frame', fn);
    sleep(2000).then(() => {
        chase.off('frame', fn);
    });
}

function addMediumContrast(x: number, y: number, ani: Animation, chase: Chase) {
    const id = contrastId++;
    const name = 'contrast' + id;
    ani.register(name, 1);
    sleep(1500).then(() => {
        ani.mode(linear()).absolute().time(5000).apply(name, 0);
    });
    const fx = effect.addEffect(
        PointEffectType.CircleContrast,
        Date.now(),
        7500,
        [x * 32 + 16, y * 32 + 16, 144, 32],
        [1, 0, 0, 0]
    );
    const fn = () => {
        effect.setEffect(
            fx,
            [x * 32 + 16, y * 32 + 16, 144 + (1 - ani.value[name]) * 240, 32],
            [ani.value[name], 0, 0, 0]
        );
    };
    chase.on('frame', fn);
    sleep(7500).then(() => {
        chase.off('frame', fn);
    });
}

function addLargeContrast(x: number, y: number, ani: Animation, chase: Chase) {
    const id = contrastId++;
    const name = 'contrast' + id;
    ani.register(name, 1);
    sleep(500).then(() => {
        ani.mode(linear()).absolute().time(9500).apply(name, 0);
    });
    const fx = effect.addEffect(
        PointEffectType.CircleContrast,
        Date.now(),
        7500,
        [x * 32 + 16, y * 32 + 16, 324, 240],
        [1, 0, 0, 0]
    );
    const fn = () => {
        effect.setEffect(
            fx,
            [x * 32 + 16, y * 32 + 16, 324 + (1 - ani.value[name]) * 720, 240],
            [ani.value[name], 0, 0, 0]
        );
    };
    chase.on('frame', fn);
    sleep(10000).then(() => {
        chase.off('frame', fn);
    });
}

function explode1(x: number, y: number, ani: Animation, chase: Chase) {
    core.setBlock(336, x, y);
    core.drawAnimate('explosion1', x, y);
    addCommonWarp(x, y);
    addCommonContrast(x, y, ani, chase);
}

function para1(chase: Chase, ani: Animation) {
    chase.onFloorTime('MT15', 830, () => {
        for (let tx = 53; tx < 58; tx++) {
            for (let ty = 3; ty < 8; ty++) {
                core.setBlock(336, tx, ty);
            }
        }
        core.drawAnimate('explosion3', 55, 5);
        addMediumWarp(55, 5);
        addMediumContrast(55, 5, ani, chase);
    });
    chase.onFloorTime('MT15', 1080, () => {
        explode1(58, 9, ani, chase);
        explode1(59, 9, ani, chase);
    });
    chase.onFloorTime('MT15', 1190, () => {
        explode1(53, 8, ani, chase);
        explode1(52, 8, ani, chase);
    });
    chase.onFloorTime('MT15', 1580, () => {
        explode1(51, 7, ani, chase);
    });
    chase.onFloorTime('MT15', 1830, () => {
        explode1(47, 7, ani, chase);
        explode1(49, 9, ani, chase);
    });
}

function para2(chase: Chase, ani: Animation) {
    let emitted32x9 = false;
    chase.onceLoc(45, 8, 'MT15', () => {
        explode1(45, 9, ani, chase);
    });
    chase.onceLoc(45, 6, 'MT15', () => {
        explode1(44, 6, ani, chase);
    });
    chase.onceLoc(45, 4, 'MT15', () => {
        explode1(44, 4, ani, chase);
        core.drawAnimate('explosion1', 48, 6);
        core.removeBlock(48, 6);
        addCommonWarp(48, 6);
        addCommonContrast(48, 6, ani, chase);
    });
    chase.onceLoc(41, 3, 'MT15', () => {
        explode1(41, 4, ani, chase);
        explode1(32, 6, ani, chase);
    });
    chase.onceLoc(35, 3, 'MT15', () => {
        core.drawAnimate('explosion3', 37, 7);
        addMediumWarp(37, 7);
        addMediumContrast(37, 7, ani, chase);
        for (let tx = 36; tx < 42; tx++) {
            for (let ty = 4; ty < 11; ty++) {
                core.setBlock(336, tx, ty);
            }
        }
    });
    chase.onceLoc(31, 5, 'MT15', () => {
        core.removeBlock(34, 8);
        core.removeBlock(33, 8);
        core.drawAnimate('explosion1', 34, 8);
        core.drawAnimate('explosion1', 33, 8);
        addCommonWarp(34, 8);
        addCommonWarp(33, 8);
        addCommonContrast(34, 8, ani, chase);
        addCommonContrast(33, 8, ani, chase);
    });
    chase.onceLoc(33, 7, 'MT15', () => {
        explode1(32, 9, ani, chase);
    });
    chase.onceLoc(33, 9, 'MT15', () => {
        if (emitted32x9) return;
        emitted32x9 = true;
        core.removeBlock(32, 9);
        core.drawAnimate('explosion1', 32, 9);
        addCommonWarp(32, 9);
        addCommonContrast(32, 9, ani, chase);
    });
    chase.onceLoc(34, 9, 'MT15', () => {
        if (emitted32x9) return;
        emitted32x9 = true;
        core.removeBlock(32, 9);
        core.drawAnimate('explosion1', 32, 9);
        addCommonWarp(32, 9);
        addCommonContrast(32, 9, ani, chase);
    });
    chase.onceLoc(35, 9, 'MT15', () => {
        if (emitted32x9) return;
        emitted32x9 = true;
        core.removeBlock(32, 9);
        core.drawAnimate('explosion1', 32, 9);
        addCommonWarp(32, 9);
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
        explode1(126, 6, ani, chase);
        explode1(124, 6, ani, chase);
        explode1(124, 9, ani, chase);
        explode1(126, 9, ani, chase);
    });
    chase.onceLoc(123, 7, 'MT14', () => {
        core.setBlock(508, 127, 7);
        core.jumpBlock(127, 7, 112, 7, 500, true);
        setTimeout(() => {
            core.setBlock(509, 112, 7);
        }, 520);
        core.drawHeroAnimate('amazed');
        explode1(121, 6, ani, chase);
        explode1(122, 6, ani, chase);
        explode1(120, 8, ani, chase);
        explode1(121, 8, ani, chase);
        explode1(122, 8, ani, chase);
    });
    let emitted110x10 = false;
    let emitted112x8 = false;
    chase.onceLoc(110, 10, 'MT14', () => {
        explode1(109, 11, ani, chase);
        core.removeBlock(112, 8);
        core.drawAnimate('explosion1', 112, 8);
        addCommonWarp(112, 8);
        addCommonContrast(112, 8, ani, chase);
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
        explode1(117, 6, ani, chase);
        explode1(116, 6, ani, chase);
        explode1(115, 6, ani, chase);
        explode1(114, 6, ani, chase);
        explode1(117, 8, ani, chase);
        explode1(116, 8, ani, chase);
    });
    chase.onceLoc(112, 7, 'MT14', () => {
        explode1(112, 8, ani, chase);
        explode1(113, 7, ani, chase);
    });
    chase.onceLoc(115, 7, 'MT14', () => {
        for (let tx = 111; tx <= 115; tx++) {
            explode1(tx, 10, ani, chase);
        }
        explode1(112, 8, ani, chase);
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
        addLargeWarp(119, 7);
        addLargeContrast(119, 7, ani, chase);
        core.removeBlock(105, 7);
        core.drawAnimate('explosion1', 105, 7);
        addCommonWarp(105, 7);
        addCommonContrast(105, 7, ani, chase);
    });
    chase.onceLoc(97, 3, 'MT14', () => {
        explode1(95, 3, ani, chase);
        explode1(93, 6, ani, chase);
    });
    chase.onceLoc(88, 6, 'MT14', () => {
        explode1(87, 4, ani, chase);
        explode1(88, 5, ani, chase);
    });
    chase.onceLoc(86, 6, 'MT14', () => {
        explode1(84, 6, ani, chase);
        explode1(85, 5, ani, chase);
        explode1(86, 8, ani, chase);
    });
    chase.onceLoc(81, 9, 'MT14', () => {
        explode1(81, 8, ani, chase);
        explode1(82, 11, ani, chase);
    });
    chase.onceLoc(72, 11, 'MT14', () => {
        explode1(73, 8, ani, chase);
        explode1(72, 4, ani, chase);
    });
    chase.onceLoc(72, 7, 'MT14', () => {
        for (let tx = 74; tx < 86; tx++) {
            for (let ty = 3; ty < 12; ty++) {
                core.setBlock(336, tx, ty);
            }
        }
        core.drawAnimate('explosion2', 79, 7);
        addLargeWarp(79, 7);
        addLargeContrast(79, 7, ani, chase);
    });
    chase.onceLoc(68, 5, 'MT14', () => {
        explode1(68, 4, ani, chase);
        explode1(67, 6, ani, chase);
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
        addMediumWarp(69, 5);
        addMediumContrast(69, 5, ani, chase);
    });
    chase.onceLoc(64, 11, 'MT14', () => {
        explode1(63, 9, ani, chase);
        explode1(60, 8, ani, chase);
        explode1(56, 11, ani, chase);
    });
    chase.onceLoc(57, 9, 'MT14', () => {
        for (let tx = 58; tx <= 64; tx++) {
            for (let ty = 3; ty <= 11; ty++) {
                core.setBlock(336, tx, ty);
            }
        }
        core.drawAnimate('explosion2', 61, 7);
        addLargeWarp(61, 7);
        addLargeContrast(61, 7, ani, chase);
    });
    const exploded: Set<number> = new Set();
    chase.on('step', (x, y) => {
        if (core.status.floorId !== 'MT14') return;
        if (exploded.has(x)) return;
        if (x > 20 && x < 49) {
            for (let ty = 3; ty <= 11; ty++) {
                core.setBlock(336, x + 4, ty);
                core.drawAnimate('explosion1', x + 4, ty);
            }
            exploded.add(x);
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
