///<reference path="../../../src/types/core.d.ts" />

/**
 * 计算需要计算伤害的方向
 * @param {number} x
 * @param {number} y
 * @param {FloorIds} floorId
 */
export function getNeedCalculateDir(x, y, floorId) {}

/**
 * 获得怪物属性
 * @param {EnemyIds | Partial<Enemy>} enemy
 * @param {Partial<HeroStatus>?} hero
 * @param {number?} x
 * @param {number?} y
 * @param {FloorIds?} floorId
 */
export function getEnemyInfo(enemy, hero, x, y, floorId) {}

/**
 * 获得怪物伤害
 * @param {EnemyIds | Partial<Enemy>} enemy
 * @param {Partial<HeroStatus>?} hero
 * @param {number?} x
 * @param {number?} y
 * @param {FloorIds?} floorId
 */
export function getDamageInfo(enemy, hero, x, y, floorId) {}

/**
 * 计算地图伤害与光环效果
 * @param {FloorIds} floorId
 */
export function checkBlock(floorId) {}
