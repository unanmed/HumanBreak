///<reference path="../../src/types/core.d.ts" />

'use strict';

function enemys() {
    this._init();
}

////// 初始化 //////
enemys.prototype._init = function () {
    this.enemys = enemys_fcae963b_31c9_42b4_b48c_bb48d09f3f80;
    for (var enemyId in this.enemys) {
        this.enemys[enemyId].id = enemyId;
    }
};

enemys.prototype.getEnemys = function () {
    var enemys = core.clone(this.enemys);
    var enemyInfo = core.getFlag('enemyInfo');
    if (enemyInfo) {
        for (var id in enemyInfo) {
            for (var name in enemyInfo[id]) {
                enemys[id][name] = core.clone(enemyInfo[id][name]);
            }
        }
    }
    // 将所有怪物的各项属性映射到朝下的
    for (var id in enemys) {
        if (enemys[id].faceIds) {
            var downId = enemys[id].faceIds.down;
            if (downId != null && downId != id && enemys[downId]) {
                enemys[id] = { id: id };
                for (var property in enemys[downId]) {
                    if (
                        property != 'id' &&
                        enemys[downId].hasOwnProperty(property)
                    ) {
                        (function (id, downId, property) {
                            Object.defineProperty(enemys[id], property, {
                                get: function () {
                                    return enemys[downId][property];
                                },
                                set: function (v) {
                                    enemys[downId][property] = v;
                                },
                                enumerable: true
                            });
                        })(id, downId, property);
                    }
                }
            }
        }
    }
    return enemys;
};

////// 判断是否含有某特殊属性 //////
enemys.prototype.hasSpecial = function (special, test) {
    // Deprecated. Use `Array.includes` instead.
};

enemys.prototype.getSpecials = function () {
    // Deprecated. See src/plugin/game/enemy/special.ts
};

////// 获得所有特殊属性的名称 //////
enemys.prototype.getSpecialText = function (enemy) {
    // Deprecated.
};

////// 获得所有特殊属性的颜色 //////
enemys.prototype.getSpecialColor = function (enemy) {
    // Deprecated.
};

////// 获得所有特殊属性的额外标记 //////
enemys.prototype.getSpecialFlag = function (enemy) {
    // Deprecated.
};

////// 获得每个特殊属性的说明 //////
enemys.prototype.getSpecialHint = function (enemy, special) {
    // Deprecated.
};

enemys.prototype._calSpecialContent = function (enemy, content) {
    // Deprecated.
};

////// 获得某个点上某个怪物的某项属性 //////
enemys.prototype.getEnemyValue = function (enemy, name, x, y, floorId) {
    // Deprecated.
};

////// 能否获胜 //////
enemys.prototype.canBattle = function (enemy, x, y, floorId) {
    // Deprecated. See src/plugin/game/enemy/battle.ts
};

enemys.prototype.getDamageString = function (enemy, x, y, floorId, hero) {
    // Deprecated.
};

////// 接下来N个临界值和临界减伤计算 //////
enemys.prototype.nextCriticals = function (enemy, number, x, y, floorId, hero) {
    // Deprecated. See src/game/enemy/damage.ts DamageEnemy.calCritical.
};

/// 未破防临界采用二分计算
enemys.prototype._nextCriticals_overAtk = function (enemy) {
    // Deprecated. See src/game/enemy/damage.ts DamageEnemy.calCritical.
};

enemys.prototype._nextCriticals_special = function (enemy) {
    // Deprecated. See src/game/enemy/damage.ts DamageEnemy.calCritical.
};

enemys.prototype._nextCriticals_useBinarySearch = function (enemy) {
    // Deprecated. See src/game/enemy/damage.ts DamageEnemy.calCritical.
};

////// N防减伤计算 //////
enemys.prototype.getDefDamage = function (enemy, k, x, y, floorId, hero) {
    // Deprecated. See src/game/enemy/damage.ts DamageEnemy.calDefDamage.
};

enemys.prototype.getEnemyInfo = function (enemy, hero, x, y, floorId) {
    // Deprecated. See src/game/enemy/damage.ts
};

////// 获得战斗伤害信息（实际伤害计算函数） //////
enemys.prototype.getDamageInfo = function (enemy, hero, x, y, floorId) {
    // Deprecated. See src/game/enemy/damage.ts
};

////// 获得在某个勇士属性下怪物伤害 //////
enemys.prototype.getDamage = function (enemy, x, y, floorId, hero) {
    // Deprecated. See src/game/enemy/damage.ts
};

enemys.prototype._getDamage = function (enemy, hero, x, y, floorId) {
    // Deprecated. See src/game/enemy/damage.ts
};

////// 获得当前楼层的怪物列表 //////
enemys.prototype.getCurrentEnemys = function (floorId) {
    // Deprecated. See src/plugin/game/enemy/battle.ts
};

enemys.prototype._getCurrentEnemys_getEnemy = function (enemyId) {
    // Deprecated. See src/plugin/game/enemy/battle.ts
};

enemys.prototype._getCurrentEnemys_addEnemy = function (enemyId) {
    // Deprecated. See src/plugin/game/enemy/battle.ts
};

enemys.prototype._getCurrentEnemys_addEnemy_defDamage = function (enemy) {
    // Deprecated. See src/plugin/game/enemy/battle.ts
};

enemys.prototype._getCurrentEnemys_sort = function (enemys) {
    // Deprecated. See src/plugin/game/enemy/battle.ts
};

enemys.prototype.hasEnemyLeft = function (enemyId, floorId) {
    // Deprecated.
};
