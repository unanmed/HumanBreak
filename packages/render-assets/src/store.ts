import { isNil } from 'lodash-es';
import { Texture } from './texture';
import { ITexture, ITextureStore, SizedCanvasImageSource } from './types';
import { logger } from '@motajs/common';

export class TextureStore implements ITextureStore {
    private readonly texMap: Map<number, ITexture> = new Map();
    private readonly invMap: Map<ITexture, number> = new Map();
    private readonly aliasMap: Map<string, number> = new Map();
    private readonly aliasInvMap: Map<number, string> = new Map();

    [Symbol.iterator](): Iterator<[key: number, tex: ITexture]> {
        return this.texMap.entries();
    }

    entries(): Iterable<[key: number, tex: ITexture]> {
        return this.texMap.entries();
    }

    keys(): Iterable<number> {
        return this.texMap.keys();
    }

    values(): Iterable<ITexture> {
        return this.texMap.values();
    }

    createTexture(source: SizedCanvasImageSource): ITexture {
        return new Texture(source);
    }

    addTexture(identifier: number, texture: ITexture): void {
        if (this.texMap.has(identifier)) {
            logger.warn(66, identifier.toString());
            return;
        }
        this.texMap.set(identifier, texture);
        this.invMap.set(texture, identifier);
    }

    private removeBy(id: number, tex: ITexture, alias?: string) {
        this.texMap.delete(id);
        this.invMap.delete(tex);
        if (alias) {
            this.aliasMap.delete(alias);
            this.aliasInvMap.delete(id);
        }
    }

    removeTexture(identifier: number | string | ITexture): void {
        if (typeof identifier === 'string') {
            const id = this.aliasMap.get(identifier);
            if (isNil(id)) return;
            const tex = this.texMap.get(id);
            if (isNil(tex)) return;
            this.removeBy(id, tex, identifier);
        } else if (typeof identifier === 'number') {
            const tex = this.texMap.get(identifier);
            if (isNil(tex)) return;
            const alias = this.aliasInvMap.get(identifier);
            this.removeBy(identifier, tex, alias);
        } else {
            const id = this.invMap.get(identifier);
            if (isNil(id)) return;
            const alias = this.aliasInvMap.get(id);
            this.removeBy(id, identifier, alias);
        }
    }

    getTexture(identifier: number): ITexture | null {
        return this.texMap.get(identifier) ?? null;
    }

    alias(identifier: number, alias: string): void {
        const id = this.aliasMap.get(alias);
        const al = this.aliasInvMap.get(identifier);
        if (!isNil(al)) {
            logger.warn(67, alias, identifier.toString(), al);
            return;
        }
        if (!isNil(id)) {
            logger.warn(68, alias, identifier.toString(), id.toString());
            return;
        }
        this.aliasMap.set(alias, identifier);
        this.aliasInvMap.set(identifier, alias);
    }

    fromAlias(alias: string): ITexture | null {
        const id = this.aliasMap.get(alias);
        if (isNil(id)) return null;
        return this.texMap.get(id) ?? null;
    }

    idOf(texture: ITexture): number | undefined {
        return this.invMap.get(texture);
    }

    aliasOf(identifier: number): string | undefined {
        return this.aliasInvMap.get(identifier);
    }
}
