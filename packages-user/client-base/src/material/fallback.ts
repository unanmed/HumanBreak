import { ITexture } from '@motajs/render-assets';
import { materials } from './ins';
import { IBlockIdentifier, IIndexedIdentifier } from './types';
import { isNil } from 'lodash-es';

function extractClsBlocks<C extends Exclude<Cls, 'tileset'>>(
    cls: C,
    map: Record<string, number>,
    icons: Record<string, number>
): IBlockIdentifier[] {
    const max = Math.max(...Object.values(icons));
    const arr = Array(max).fill(void 0);
    for (const [key, value] of Object.entries(icons)) {
        // 样板编辑器 bug 可能会导致多个 id 使用一个偏移，因此要判断下
        if (!(key in map) || !isNil(arr[value])) continue;
        const id = key as AllIdsOf<C>;
        const num = map[id] as keyof NumberToId;
        const identifier: IBlockIdentifier = {
            id: id as string,
            cls,
            num
        };
        arr[value] = identifier;
    }
    return arr;
}

function addTileset(set: Set<number>, map?: readonly (readonly number[])[]) {
    if (!map) return;
    map.forEach(line => {
        line.forEach(v => {
            if (v >= 10000) set.add(v);
        });
    });
}

function addAutotile(set: Set<number>, map?: readonly (readonly number[])[]) {
    if (!map) return;
    map.forEach(line => {
        line.forEach(v => {
            const id = core.maps.blocksInfo[v as keyof NumberToId];
            if (id?.cls === 'autotile') set.add(v);
        });
    });
}

/**
 * 兼容旧版加载
 */
export function fallbackLoad() {
    // 基本素材
    const icons = core.icons.icons;
    const images = core.material.images;
    const idNumMap: Record<string, number> = {};

    for (const [key, value] of Object.entries(core.maps.blocksInfo)) {
        const num = Number(key);
        idNumMap[value.id] = Number(num);
        if (!isNil(value.animate)) {
            materials.setDefaultFrame(num, value.animate - 1);
        }
    }

    const terrains = extractClsBlocks('terrains', idNumMap, icons.terrains);
    const animates = extractClsBlocks('animates', idNumMap, icons.animates);
    const items = extractClsBlocks('items', idNumMap, icons.items);
    const enemys = extractClsBlocks('enemys', idNumMap, icons.enemys);
    const npcs = extractClsBlocks('npcs', idNumMap, icons.npcs);
    const enemy48 = extractClsBlocks('enemy48', idNumMap, icons.enemy48);
    const npc48 = extractClsBlocks('npc48', idNumMap, icons.npc48);

    // Grid
    materials.addGrid(images.terrains, terrains);
    materials.addGrid(images.items, items);

    // Row Animates
    materials.addRowAnimate(images.animates, animates, 32);
    materials.addRowAnimate(images.enemys, enemys, 32);
    materials.addRowAnimate(images.npcs, npcs, 32);
    materials.addRowAnimate(images.enemy48, enemy48, 48);
    materials.addRowAnimate(images.npc48, npc48, 48);

    // Autotile
    for (const key of Object.keys(icons.autotile)) {
        const id = key as AllIdsOf<'autotile'>;
        const img = images.autotile[id];
        const identifier: IBlockIdentifier = {
            id,
            num: idNumMap[id],
            cls: 'autotile'
        };
        materials.addAutotile(img, identifier);
    }

    // Tilesets
    core.tilesets.forEach((v, i) => {
        const img = images.tilesets[v];
        const identifier: IIndexedIdentifier = {
            index: i,
            alias: v
        };
        materials.addTileset(img, identifier);
    });

    // Images
    core.images.forEach((v, i) => {
        const img = core.material.images.images[v];
        materials.addImage(img, { index: i, alias: v });
    });

    // 地图上出现过的 tileset
    const tilesetSet = new Set<number>();
    const autotileSet = new Set<number>();
    core.floorIds.forEach(v => {
        const floor = core.floors[v];
        addTileset(tilesetSet, floor.bgmap);
        addTileset(tilesetSet, floor.bg2map);
        addTileset(tilesetSet, floor.map);
        addTileset(tilesetSet, floor.fgmap);
        addTileset(tilesetSet, floor.fg2map);
        addAutotile(autotileSet, floor.bgmap);
        addAutotile(autotileSet, floor.bg2map);
        addAutotile(autotileSet, floor.map);
        addAutotile(autotileSet, floor.fgmap);
        addAutotile(autotileSet, floor.fg2map);
    });

    const heroTextures: ITexture[] = [];

    data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d.main.heroImages.forEach(v => {
        const tex = materials.getImageByAlias(v);
        if (tex) heroTextures.push(tex);
    });

    materials.buildAssets();

    materials.cacheAutotileList(autotileSet);
    materials.cacheTilesetList(tilesetSet);
    materials.buildListToAsset(heroTextures);
}
