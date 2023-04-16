///<reference path="../../../src/types/core.d.ts" />
export {};

['up', 'down', 'left', 'right'].forEach(one => {
    // 指定中间帧动画
    core.material.icons.hero[one].midFoot = 2;
});

var heroMoving = timestamp => {
    if (core.status.heroMoving <= 0) return;
    if (timestamp - core.animateFrame.moveTime > core.values.moveSpeed) {
        core.animateFrame.leftLeg++;
        core.animateFrame.moveTime = timestamp;
    }
    core.drawHero(
        ['stop', 'leftFoot', 'midFoot', 'rightFoot'][
            core.animateFrame.leftLeg % 4
        ],
        4 * core.status.heroMoving
    );
};
core.registerAnimationFrame('heroMoving', true, heroMoving);

core.events._eventMoveHero_moving = function (step, moveSteps) {
    var curr = moveSteps[0];
    var direction = curr[0],
        x = core.getHeroLoc('x'),
        y = core.getHeroLoc('y');
    // ------ 前进/后退
    var o = direction == 'backward' ? -1 : 1;
    if (direction == 'forward' || direction == 'backward')
        direction = core.getHeroLoc('direction');
    var faceDirection = direction;
    if (direction == 'leftup' || direction == 'leftdown')
        faceDirection = 'left';
    if (direction == 'rightup' || direction == 'rightdown')
        faceDirection = 'right';
    core.setHeroLoc('direction', direction);
    if (curr[1] <= 0) {
        core.setHeroLoc('direction', faceDirection);
        moveSteps.shift();
        return true;
    }
    if (step <= 4) core.drawHero('stop', 4 * o * step);
    else if (step <= 8) core.drawHero('leftFoot', 4 * o * step);
    else if (step <= 12) core.drawHero('midFoot', 4 * o * (step - 8));
    else if (step <= 16) core.drawHero('rightFoot', 4 * o * (step - 8)); // if (step == 8) {
    if (step == 8 || step == 16) {
        core.setHeroLoc('x', x + o * core.utils.scan2[direction].x, true);
        core.setHeroLoc('y', y + o * core.utils.scan2[direction].y, true);
        core.updateFollowers();
        curr[1]--;
        if (curr[1] <= 0) moveSteps.shift();
        core.setHeroLoc('direction', faceDirection);
        return step == 16;
    }
    return false;
};
