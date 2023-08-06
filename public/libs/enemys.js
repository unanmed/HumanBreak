///<reference path="../../src/types/core.d.ts" />

'use strict';

function enemys() {
    this._init();
}

////// 初始化 //////
enemys.prototype._init = function () {
    this.enemys = enemys_fcae963b_31c9_42b4_b48c_bb48d09f3f80;
    this.enemydata = functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a.enemys;
    for (var enemyId in this.enemys) {
        this.enemys[enemyId].id = enemyId;
    }
    if (main.mode == 'play') {
        this.enemydata.hasSpecial = function (a, b) {
            return core.enemys.hasSpecial(a, b);
        };
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
    if (special == null) return false;

    if (special instanceof Array) {
        return special.indexOf(test) >= 0;
    }

    if (typeof special == 'number') {
        return special === test;
    }

    if (typeof special == 'string') {
        return this.hasSpecial(core.material.enemys[special], test);
    }

    if (special.special != null) {
        return this.hasSpecial(special.special, test);
    }

    return false;
};

enemys.prototype.getSpecials = function () {
    return this.enemydata.getSpecials();
};

////// 获得所有特殊属性的名称 //////
enemys.prototype.getSpecialText = function (enemy) {
    if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
    if (!enemy) return [];
    var special = enemy.special;
    var text = [];

    var specials = this.getSpecials();
    if (specials) {
        for (var i = 0; i < specials.length; i++) {
            if (this.hasSpecial(special, specials[i][0]))
                text.push(this._calSpecialContent(enemy, specials[i][1]));
        }
    }
    return text;
};

////// 获得所有特殊属性的颜色 //////
enemys.prototype.getSpecialColor = function (enemy) {
    if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
    if (!enemy) return [];
    var special = enemy.special;
    var colors = [];

    var specials = this.getSpecials();
    if (specials) {
        for (var i = 0; i < specials.length; i++) {
            if (this.hasSpecial(special, specials[i][0]))
                colors.push(specials[i][3] || null);
        }
    }
    return colors;
};

////// 获得所有特殊属性的额外标记 //////
enemys.prototype.getSpecialFlag = function (enemy) {
    if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
    if (!enemy) return [];
    var special = enemy.special;
    var flag = 0;

    var specials = this.getSpecials();
    if (specials) {
        for (var i = 0; i < specials.length; i++) {
            if (this.hasSpecial(special, specials[i][0]))
                flag |= specials[i][4] || 0;
        }
    }
    return flag;
};

////// 获得每个特殊属性的说明 //////
enemys.prototype.getSpecialHint = function (enemy, special) {
    var specials = this.getSpecials();

    if (special == null) {
        if (specials == null) return [];
        var hints = [];
        for (var i = 0; i < specials.length; i++) {
            if (this.hasSpecial(enemy, specials[i][0]))
                hints.push(
                    '\r[' +
                        core.arrayToRGBA(specials[i][3] || '#FF6A6A') +
                        ']\\d' +
                        this._calSpecialContent(enemy, specials[i][1]) +
                        '：\\d\r[]' +
                        this._calSpecialContent(enemy, specials[i][2])
                );
        }
        return hints;
    }

    if (specials == null) return '';
    for (var i = 0; i < specials.length; i++) {
        if (special == specials[i][0])
            return (
                '\r[#FF6A6A]\\d' +
                this._calSpecialContent(enemy, specials[i][1]) +
                '：\\d\r[]' +
                this._calSpecialContent(enemy, specials[i][2])
            );
    }
    return '';
};

enemys.prototype._calSpecialContent = function (enemy, content) {
    if (typeof content == 'string') return content;
    if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
    if (content instanceof Function) {
        return content(enemy);
    }
    return '';
};

////// 获得某个点上某个怪物的某项属性 //////
enemys.prototype.getEnemyValue = function (enemy, name, x, y, floorId) {
    floorId = floorId || core.status.floorId;
    if (
        (((flags.enemyOnPoint || {})[floorId] || {})[x + ',' + y] || {})[
            name
        ] != null
    ) {
        return flags.enemyOnPoint[floorId][x + ',' + y][name];
    }
    if (enemy == null) {
        var block = core.getBlock(x, y, floorId);
        if (block == null) return null;
        enemy = core.material.enemys[block.event.id];
    }
    if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
    if (enemy == null) return null;
    return enemy[name];
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
    // Deprecated. See src/plugin/game/enemy/damage.ts DamageEnemy.calCritical.
};

/// 未破防临界采用二分计算
enemys.prototype._nextCriticals_overAtk = function (enemy) {
    // Deprecated. See src/plugin/game/enemy/damage.ts DamageEnemy.calCritical.
};

enemys.prototype._nextCriticals_special = function (enemy) {
    // Deprecated. See src/plugin/game/enemy/damage.ts DamageEnemy.calCritical.
};

enemys.prototype._nextCriticals_useBinarySearch = function (enemy) {
    // Deprecated. See src/plugin/game/enemy/damage.ts DamageEnemy.calCritical.
};

////// N防减伤计算 //////
enemys.prototype.getDefDamage = function (enemy, k, x, y, floorId, hero) {
    // Deprecated. See src/plugin/game/enemy/damage.ts DamageEnemy.calDefDamage.
};

enemys.prototype.getEnemyInfo = function (enemy, hero, x, y, floorId) {
    // Deprecated. See src/plugin/game/enemy/damage.ts
};

////// 获得战斗伤害信息（实际伤害计算函数） //////
enemys.prototype.getDamageInfo = function (enemy, hero, x, y, floorId) {
    // Deprecated. See src/plugin/game/enemy/damage.ts
};

////// 获得在某个勇士属性下怪物伤害 //////
enemys.prototype.getDamage = function (enemy, x, y, floorId, hero) {
    // Deprecated. See src/plugin/game/enemy/damage.ts
};

enemys.prototype._getDamage = function (enemy, hero, x, y, floorId) {
    // Deprecated. See src/plugin/game/enemy/damage.ts
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
    if (floorId == null) floorId = core.status.floorId;
    if (!(floorId instanceof Array)) floorId = [floorId];
    var enemyMap = {};
    if (enemyId instanceof Array)
        enemyId.forEach(function (v) {
            enemyMap[v] = true;
        });
    else if (enemyId) enemyMap[enemyId] = true;
    else enemyMap = null;
    for (var i = 0; i < floorId.length; i++) {
        core.extractBlocks(floorId[i]);
        var mapBlocks = core.status.maps[floorId[i]].blocks;
        for (var b = 0; b < mapBlocks.length; b++) {
            if (
                !mapBlocks[b].disable &&
                mapBlocks[b].event.cls.indexOf('enemy') === 0
            ) {
                if (
                    enemyMap === null ||
                    enemyMap[core.getFaceDownId(mapBlocks[b])]
                )
                    return true;
            }
        }
    }
    return false;
};
