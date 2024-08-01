import './system';
import '../plugin/game/index';
import * as damage from './enemy/damage';
import { EventEmitter, IndexedEventEmitter } from '@/core/common/eventEmitter';
import { Range } from '@/plugin/game/range';
import { specials } from './enemy/special';
import { gameListener, hook, loading } from './game';
import * as battle from './enemy/battle';
import * as hero from './state/hero';
import * as miscMechanism from './mechanism/misc';
import * as study from './mechanism/study';

// ----- 类注册
Mota.register('class', 'DamageEnemy', damage.DamageEnemy);
Mota.register('class', 'EnemyCollection', damage.EnemyCollection);
Mota.register('class', 'EventEmitter', EventEmitter);
Mota.register('class', 'IndexedEventEmitter', IndexedEventEmitter);
Mota.register('class', 'Range', Range);
// ----- 函数注册
Mota.register('fn', 'getEnemy', battle.getEnemy);
Mota.register('fn', 'getHeroStatusOn', hero.getHeroStatusOn);
Mota.register('fn', 'getHeroStatusOf', hero.getHeroStatusOf);
Mota.register('fn', 'ensureFloorDamage', damage.ensureFloorDamage);
// ----- 变量注册
Mota.register('var', 'enemySpecials', specials);
Mota.register('var', 'hook', hook);
Mota.register('var', 'gameListener', gameListener);
Mota.register('var', 'loading', loading);
// ----- 模块注册
Mota.register('module', 'Mechanism', {
    BluePalace: miscMechanism.BluePalace,
    Study: study
});

main.loading = loading;

loading.once('coreInit', () => {
    Mota.Plugin.init();
});
