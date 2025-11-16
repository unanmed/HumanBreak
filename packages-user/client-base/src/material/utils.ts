import { ITexture } from '@motajs/render-assets';
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

export function getTextureFrame(cls: BlockCls, texture: ITexture) {
    switch (cls) {
        case BlockCls.Animates:
        case BlockCls.Enemy48:
        case BlockCls.Npc48:
            return 4;
        case BlockCls.Autotile:
            return texture.width === 384 ? 4 : 1;
        case BlockCls.Enemys:
        case BlockCls.Npcs:
            return 2;
        case BlockCls.Items:
        case BlockCls.Terrains:
        case BlockCls.Tileset:
            return 1;
        case BlockCls.Unknown:
            return 0;
    }
}
