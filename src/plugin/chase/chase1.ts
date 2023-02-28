import { Animation, bezier, hyper, linear, shake, sleep } from 'mutate-animate';
import { Chase, shake2 } from './chase';
import { ChaseCameraData } from './data';

const ani = new Animation();
ani.register('rect', 0);

export const path1: Partial<Record<FloorIds, LocArr[]>> = {
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

export const camera1: ChaseCameraData[] = [
    ['MT16', 0, 10, 0, 1600, hyper('sin', 'in')],
    ['MT15', 45, 0, 0, 2324, hyper('sin', 'in')],
    ['MT15', 40, 0, 2324, 1992, hyper('sin', 'out')],
    ['MT15', 41, 0, 5312, 498, hyper('sin', 'in-out')],
    ['MT15', 37, 0, 5810, 1660, hyper('sin', 'in')],
    ['MT15', 29, 0, 7470, 830, hyper('sin', 'out')],
    ['MT15', 25, 0, 11454, 996, hyper('sin', 'in')],
    ['MT15', 12, 0, 12450, 996, linear()],
    ['MT15', 0, 0, 13446, 1470, hyper('sin', 'out')],
    ['MT14', 109, 0, 0, 1328, hyper('sin', 'in')],
    ['MT14', 104, 0, 1328, 332, hyper('sin', 'out')],
    ['MT14', 92, 0, 5478, 2822, hyper('sin', 'in')],
    ['MT14', 84, 0, 8300, 1992, linear()],
    ['MT14', 74, 0, 10292, 2988, linear()],
    ['MT14', 65, 0, 13280, 2988, linear()],
    ['MT14', 58, 0, 16268, 1992, linear()],
    ['MT14', 47, 0, 18260, 3320, linear()],
    ['MT14', 36, 0, 21580, 3320, linear()],
    ['MT14', 0, 0, 24900, 9960, linear()]
];

/**
 * 追逐战开始前的初始化函数，移除所有血瓶和门等
 */
export function init1() {
    const ids: FloorIds[] = ['MT13', 'MT14', 'MT15'];
    const toRemove: [number, number, FloorIds][] = [];
    ids.forEach(v => {
        core.status.maps[v].cannotMoveDirectly = true;
        core.extractBlocks(v);
        core.status.maps[v].blocks.forEach(vv => {
            if (
                ['animates', 'items'].includes(vv.event.cls) &&
                !vv.event.id.endsWith('Portal')
            ) {
                toRemove.push([vv.x, vv.y, v]);
            }
        });
    });
    toRemove.forEach(v => {
        core.removeBlock(...v);
    });
}

export function chaseShake(chase: Chase) {
    chase.ani
        .mode(shake2(2 / 32, bezier(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)), true)
        .time(50000)
        .shake(1, 0);
}

export async function wolfMove(chase: Chase) {
    core.moveBlock(23, 17, Array(6).fill('down'), 80);
    await sleep(550);
    core.setBlock(508, 23, 23);
}

export function judgeFail1(chase: Chase) {
    chase.ani.ticker.add(() => {
        if (core.status.hero.loc.x > core.bigmap.offsetX / 32 + 17) {
            chase.end();
            ani.time(750).apply('rect', 0);
            core.lose('逃跑失败');
        }
    });
}

export function drawBack(chase: Chase) {
    chase.on('MT15', 0, () => {
        ani.mode(hyper('sin', 'out')).time(1500).absolute().apply('rect', 64);
        const ctx = core.createCanvas('chaseBack', 0, 0, 480, 480, 120);
        ctx.fillStyle = '#000';
        const fn = () => {
            if (!ctx) ani.ticker.remove(fn);
            core.clearMap(ctx);
            ctx.fillRect(0, 0, 480, ani.value.rect);
            ctx.fillRect(0, 480, 480, -ani.value.rect);
        };
        ani.ticker.add(fn);
    });
}

export function para1(chase: Chase) {
    chase.on('MT15', 830, () => {
        for (let tx = 53; tx < 58; tx++) {
            for (let ty = 3; ty < 8; ty++) {
                core.setBlock(336, tx, ty);
            }
        }
        core.drawAnimate('explosion3', 55, 5);
        core.drawAnimate('stone', 55, 5);
    });
    chase.on('MT15', 1080, () => {
        core.setBlock(336, 58, 9);
        core.setBlock(336, 59, 9);
        core.drawAnimate('explosion1', 58, 9);
        core.drawAnimate('explosion1', 59, 9);
    });
    chase.on('MT15', 1190, () => {
        core.setBlock(336, 53, 8);
        core.setBlock(336, 52, 8);
        core.drawAnimate('explosion1', 53, 8);
        core.drawAnimate('explosion1', 52, 8);
    });
    chase.on('MT15', 1580, () => {
        core.setBlock(336, 51, 7);
        core.drawAnimate('explosion1', 51, 7);
    });
    chase.on('MT15', 1830, () => {
        core.setBlock(336, 47, 7);
        core.setBlock(336, 49, 9);
        core.drawAnimate('explosion1', 49, 9);
        core.drawAnimate('explosion1', 47, 7);
    });
}

export function para2(chase: Chase) {
    chase.onHeroLoc(
        'MT15',
        () => {
            core.setBlock(336, 45, 9);
            core.drawAnimate('explosion1', 45, 9);
        },
        45,
        8
    );
    chase.onHeroLoc(
        'MT15',
        () => {
            core.setBlock(336, 44, 6);
            core.drawAnimate('explosion1', 44, 6);
        },
        45,
        6
    );
    chase.onHeroLoc(
        'MT15',
        () => {
            core.setBlock(336, 44, 4);
            core.drawAnimate('explosion1', 44, 4);
            core.drawAnimate('explosion1', 48, 6);
            core.removeBlock(48, 6);
        },
        45,
        4
    );
    chase.onHeroLoc(
        'MT15',
        () => {
            core.setBlock(336, 41, 4);
            core.setBlock(336, 32, 6);
            core.drawAnimate('explosion1', 41, 4);
            core.drawAnimate('explosion1', 32, 6);
        },
        41,
        3
    );
    chase.onHeroLoc(
        'MT15',
        () => {
            core.drawAnimate('explosion3', 37, 7);
            core.vibrate('vertical', 1000, 25, 10);
            for (let tx = 36; tx < 42; tx++) {
                for (let ty = 4; ty < 11; ty++) {
                    core.setBlock(336, tx, ty);
                }
            }
        },
        35,
        3
    );
    chase.onHeroLoc(
        'MT15',
        () => {
            core.vibrate('vertical', 10000, 25, 1);
            core.removeBlock(34, 8);
            core.removeBlock(33, 8);
            core.drawAnimate('explosion1', 34, 8);
            core.drawAnimate('explosion1', 33, 8);
        },
        31,
        5
    );
    chase.onHeroLoc(
        'MT15',
        () => {
            core.setBlock(336, 32, 9);
            core.drawAnimate('explosion1', 32, 9);
        },
        33,
        7
    );
    chase.onHeroLoc(
        'MT15',
        () => {
            core.removeBlock(32, 9);
            core.drawAnimate('explosion1', 32, 9);
        },
        [33, 34, 34],
        9
    );
    for (let x = 19; x < 31; x++) {
        const xx = x;
        chase.onHeroLoc(
            'MT15',
            () => {
                core.setBlock(336, xx + 1, 11);
                core.drawAnimate('explosion1', xx + 1, 11);
            },
            xx,
            11
        );
    }
}

export function para3(chase: Chase) {
    chase.onHeroLoc(
        'MT14',
        () => {
            core.setBlock(336, 126, 6);
            core.setBlock(336, 124, 6);
            core.setBlock(336, 124, 9);
            core.setBlock(336, 126, 9);
            core.drawAnimate('explosion1', 126, 6);
            core.drawAnimate('explosion1', 124, 6);
            core.drawAnimate('explosion1', 124, 9);
            core.drawAnimate('explosion1', 126, 9);
        },
        126,
        7
    );
    chase.onHeroLoc(
        'MT14',
        () => {
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
        },
        123,
        7
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            core.setBlock(336, 109, 11);
            core.removeBlock(112, 8);
            core.drawAnimate('explosion1', 109, 11);
            core.drawAnimate('explosion1', 112, 8);
            core.insertAction([
                { type: 'moveHero', time: 400, steps: ['backward:1'] }
            ]);
            chase.onHeroLoc(
                'MT14',
                () => {
                    core.jumpBlock(112, 7, 110, 4, 500, true);
                    core.drawHeroAnimate('amazed');
                    setTimeout(() => {
                        core.setBlock(506, 110, 4);
                    }, 540);
                },
                112,
                8
            );
        },
        110,
        10
    );
    chase.onHeroLoc(
        'MT14',
        () => {
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
        },
        118,
        7
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            core.setBlock(336, 112, 8);
            core.setBlock(336, 113, 7);
            core.drawAnimate('explosion1', 112, 8);
            core.drawAnimate('explosion1', 113, 7);
        },
        112,
        7
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            for (let tx = 111; tx <= 115; tx++) {
                core.setBlock(336, tx, 10);
                core.drawAnimate('explosion1', tx, 10);
            }
            core.setBlock(336, 112, 8);
            core.drawAnimate('explosion1', 112, 8);
        },
        115,
        7
    );
    chase.onHeroLoc(
        'MT14',
        () => {
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
        },
        110,
        7
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            core.setBlock(336, 95, 3);
            core.setBlock(336, 93, 6);
            core.drawAnimate('explosion1', 95, 3);
            core.drawAnimate('explosion1', 93, 6);
        },
        97,
        3
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            core.setBlock(336, 87, 4);
            core.setBlock(336, 88, 5);
            core.drawAnimate('explosion1', 87, 4);
            core.drawAnimate('explosion1', 88, 5);
        },
        88,
        6
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            core.setBlock(336, 84, 6);
            core.setBlock(336, 85, 5);
            core.setBlock(336, 86, 8);
            core.drawAnimate('explosion1', 84, 6);
            core.drawAnimate('explosion1', 85, 5);
            core.drawAnimate('explosion1', 86, 8);
        },
        86,
        6
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            core.setBlock(336, 81, 8);
            core.setBlock(336, 82, 11);
            core.drawAnimate('explosion1', 81, 8);
            core.drawAnimate('explosion1', 82, 11);
        },
        81,
        9
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            core.setBlock(336, 73, 8);
            core.setBlock(336, 72, 4);
            core.drawAnimate('explosion1', 73, 8);
            core.drawAnimate('explosion1', 72, 4);
        },
        72,
        11
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            for (let tx = 74; tx < 86; tx++) {
                for (let ty = 3; ty < 12; ty++) {
                    core.setBlock(336, tx, ty);
                }
            }
            core.drawAnimate('explosion2', 79, 7);
            core.vibrate('vertical', 4000, 25, 15);
        },
        71,
        7
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            core.setBlock(336, 68, 4);
            core.setBlock(336, 67, 6);
            core.drawAnimate('explosion1', 68, 4);
            core.drawAnimate('explosion1', 67, 6);
        },
        68,
        5
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            for (let tx = 65; tx <= 72; tx++) {
                for (let ty = 3; ty <= 9; ty++) {
                    core.setBlock(336, tx, ty);
                }
            }
            core.setBlock(336, 72, 10);
            core.setBlock(336, 72, 11);
            core.drawAnimate('explosion3', 69, 5);
        },
        67,
        10
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            core.setBlock(336, 63, 9);
            core.setBlock(336, 60, 8);
            core.setBlock(336, 56, 11);
            core.drawAnimate('explosion1', 63, 9);
            core.drawAnimate('explosion1', 60, 8);
            core.drawAnimate('explosion1', 56, 11);
        },
        64,
        11
    );
    chase.onHeroLoc(
        'MT14',
        () => {
            for (let tx = 58; tx <= 64; tx++) {
                for (let ty = 3; ty <= 11; ty++) {
                    core.setBlock(336, tx, ty);
                }
            }
            core.drawAnimate('explosion2', 61, 7);
        },
        57,
        9
    );
    for (let x = 21; x < 49; x++) {
        chase.onHeroLoc(
            'MT14',
            () => {
                for (let ty = 3; ty <= 11; ty++) {
                    core.setBlock(336, x + 4, ty);
                    core.drawAnimate('explosion1', x + 4, ty);
                }
            },
            x
        );
    }
    chase.onHeroLoc(
        'MT14',
        async () => {
            flags.finishChase1 = true;
            core.plugin.towerBoss.autoFixRouteBoss();
            core.showStatusBar();
            ani.time(750).apply('rect', 0);
            chase.end();
            await sleep(750);
            ani.ticker.destroy();
            core.deleteCanvas('chaseBack');
        },
        21
    );
}
