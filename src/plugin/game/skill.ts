// @ts-nocheck

// 所有的主动技能效果
var ignoreInJump = {
    event: ['X20007', 'X20001', 'X20006', 'X20014', 'X20010', 'X20007'],
    bg: [
        'X20037',
        'X20038',
        'X20039',
        'X20045',
        'X20047',
        'X20053',
        'X20054',
        'X20055',
        'X20067',
        'X20068',
        'X20075',
        'X20076'
    ]
};

export const jumpIgnoreFloor: FloorIds[] = [
    'MT31',
    'snowTown',
    'MT36',
    'MT37',
    'MT38',
    'MT39',
    'MT40',
    'MT42',
    'MT43',
    'MT44',
    'MT45',
    'MT46',
    'MT47',
    'MT48',
    'MT49',
    'MT50',
    'MT57',
    'MT59',
    'MT60',
    'MT61'
];
// 跳跃
export function jumpSkill() {
    if (core.status.floorId.startsWith('tower'))
        return core.drawTip('当无法使用该技能');
    if (jumpIgnoreFloor.includes(core.status.floorId) || flags.onChase) {
        return core.drawTip('当前楼层无法使用该技能');
    }
    if (!flags.skill2) return;
    if (!flags['jump_' + core.status.floorId])
        flags['jump_' + core.status.floorId] = 0;
    if (core.status.floorId == 'MT14') {
        const loc = core.status.hero.loc;
        if (loc.x === 77 && loc.y === 5) {
            flags.MT14Jump = true;
        }
        if (flags.jump_MT14 === 2 && !flags.MT14Jump) {
            return core.drawTip('该地图还有一个必跳的地方，你还没有跳');
        }
    }
    if (flags['jump_' + core.status.floorId] >= 3)
        return core.drawTip('当前地图使用次数已用完');
    var direction = core.status.hero.loc.direction;
    var loc = core.status.hero.loc;
    var checkLoc = {};
    switch (direction) {
        case 'up':
            checkLoc.x = loc.x;
            checkLoc.y = loc.y - 1;
            break;
        case 'right':
            checkLoc.x = loc.x + 1;
            checkLoc.y = loc.y;
            break;
        case 'down':
            checkLoc.x = loc.x;
            checkLoc.y = loc.y + 1;
            break;
        case 'left':
            checkLoc.x = loc.x - 1;
            checkLoc.y = loc.y;
            break;
    }
    // 前方是否可通行 或 是怪物
    var cls = core.getBlockCls(checkLoc.x, checkLoc.y);
    var noPass = core.noPass(checkLoc.x, checkLoc.y);
    var id = core.getBlockId(checkLoc.x, checkLoc.y) || '';
    var bgId =
        core.getBlockByNumber(core.getBgNumber(checkLoc.x, checkLoc.y)).event
            .id || '';
    // 可以通行
    if (
        !noPass ||
        cls == 'items' ||
        (id.startsWith('X') && !ignoreInJump.event.includes(id)) ||
        (bgId.startsWith('X') && !ignoreInJump.bg.includes(bgId))
    )
        return core.drawTip('当前无法使用技能');
    // 不是怪物且不可以通行
    if (noPass && !(cls == 'enemys' || cls == 'enemy48')) {
        var toLoc = checkNoPass(direction, checkLoc.x, checkLoc.y, true);
        if (!toLoc) return;
        core.autosave();
        if (flags.chapter <= 1) core.status.hero.hp -= 200 * flags.hard;
        core.updateStatusBar();
        flags['jump_' + core.status.floorId]++;
        if (core.status.hero.hp <= 0) {
            core.status.hero.hp = 0;
            core.updateStatusBar();
            core.events.lose('你跳死了');
        }
        core.playSound('015-Jump01.ogg');
        core.insertAction([
            { type: 'jumpHero', loc: [toLoc.x, toLoc.y], time: 500 }
        ]);
    }
    // 是怪物
    if (cls == 'enemys' || cls == 'enemy48') {
        var firstNoPass = checkNoPass(direction, checkLoc.x, checkLoc.y, false);
        if (!firstNoPass) return;
        core.autosave();
        if (flags.chapter <= 1) core.status.hero.hp -= 200 * flags.hard;
        core.updateStatusBar();
        flags['jump_' + core.status.floorId]++;
        if (core.status.hero.hp <= 0) {
            core.status.hero.hp = 0;
            core.updateStatusBar();
            core.events.lose('你跳死了');
        }
        core.playSound('015-Jump01.ogg');
        core.insertAction([
            {
                type: 'jump',
                from: [checkLoc.x, checkLoc.y],
                to: [firstNoPass.x, firstNoPass.y],
                time: 500,
                keep: true
            }
        ]);
    }
    // 检查一条线上的不可通过
    function checkNoPass(direction, x, y, startNo) {
        if (!startNo) startNo = false;
        switch (direction) {
            case 'up':
                y--;
                break;
            case 'right':
                x++;
                break;
            case 'down':
                y++;
                break;
            case 'left':
                x--;
                break;
        }
        if (
            x > core.status.thisMap.width - 1 ||
            y > core.status.thisMap.height - 1 ||
            x < 0 ||
            y < 0
        )
            return core.drawTip('当前无法使用技能');
        var id = core.getBlockId(x, y) || '';
        if (core.getBgNumber(x, y))
            var bgId =
                core.getBlockByNumber(core.getBgNumber(x, y)).event.id || '';
        else var bgId = '';
        if (
            core.noPass(x, y) ||
            core.getBlockCls(x, y) == 'items' ||
            (id.startsWith('X') && !ignoreInJump.event.includes(id)) ||
            (bgId.startsWith('X') && !ignoreInJump.bg.includes(bgId)) ||
            core.getBlockCls(x, y) == 'animates'
        )
            return checkNoPass(direction, x, y, true);
        if (!startNo) return checkNoPass(direction, x, y, false);
        return { x: x, y: y };
    }
}
