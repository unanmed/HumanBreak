import { BlockCls } from './types';

export function getClsByString(cls: Cls): BlockCls {
    switch (cls) {
        case 'terrains':
            return BlockCls.Terrains;
        case 'animates':
            return BlockCls.Animates;
        case 'autotile':
            return BlockCls.Autotile;
        case 'enemys':
            return BlockCls.Enemys;
        case 'items':
            return BlockCls.Items;
        case 'npcs':
            return BlockCls.Npcs;
        case 'npc48':
            return BlockCls.Npc48;
        case 'enemy48':
            return BlockCls.Enemy48;
        case 'tileset':
            return BlockCls.Tileset;
        default:
            return BlockCls.Unknown;
    }
}
