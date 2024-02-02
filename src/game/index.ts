import './system';
import '../plugin/game/index';
import { DamageEnemy, EnemyCollection } from './enemy/damage';
import {
    EmitableEvent,
    EventEmitter,
    IndexedEventEmitter
} from '@/core/common/eventEmitter';
import { Range } from '@/plugin/game/range';
import { specials } from './enemy/special';
import { gameListener, hook, loading } from './game';

// ----- 类注册
Mota.register('class', 'DamageEnemy', DamageEnemy);
Mota.register('class', 'EnemyCollection', EnemyCollection);
Mota.register('class', 'EventEmitter', EventEmitter);
Mota.register('class', 'IndexedEventEmitter', IndexedEventEmitter);
Mota.register('class', 'Range', Range);
// ----- 函数注册

// ----- 变量注册
Mota.register('var', 'enemySpecials', specials);
Mota.register('var', 'hook', hook);
Mota.register('var', 'gameListener', gameListener);
Mota.register('var', 'loading', loading);
// ----- 模块注册

main.loading = loading;

loading.once('coreInit', () => {
    Mota.Plugin.init();
});
