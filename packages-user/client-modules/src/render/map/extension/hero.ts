import {
    degradeFace,
    FaceDirection,
    getFaceMovement,
    HeroAnimateDirection,
    IHeroState,
    IHeroStateHooks,
    IMapLayer,
    nextFaceDirection,
    state
} from '@user/data-state';
import { IMapRenderer, IMapRendererTicker, IMovingBlock } from '../types';
import { isNil } from 'lodash-es';
import { IHookController, logger } from '@motajs/common';
import { BlockCls, IMaterialFramedData } from '@user/client-base';
import {
    ITexture,
    ITextureSplitter,
    TextureRowSplitter
} from '@motajs/render-assets';
import { IMapHeroRenderer } from './types';
import { TimingFn } from 'mutate-animate';

/** 默认的移动时长 */
const DEFAULT_TIME = 100;

interface HeroRenderEntity {
    /** 移动图块对象 */
    readonly block: IMovingBlock;
    /** 标识符，用于判定跟随者 */
    readonly identifier: string;
    /** 目标横坐标，移动时有效 */
    targetX: number;
    /** 目标纵坐标，移动时有效 */
    targetY: number;
    /** 当前的移动朝向 */
    direction: FaceDirection;
    /** 下一个跟随者的移动方向 */
    nextDirection: FaceDirection;

    /** 当前是否正在移动 */
    moving: boolean;
    /** 当前是否正在动画，移动跟动画要分开，有的操作比如跳跃就是在移动中但是没动画 */
    animating: boolean;
    /** 帧动画间隔 */
    animateInterval: number;
    /** 当一次动画时刻 */
    lastAnimateTime: number;
    /** 当前的动画帧数 */
    animateFrame: number;
    /** 移动的 `Promise`，移动完成时兑现，如果停止，则一直是兑现状态 */
    promise: Promise<void>;
    /** 勇士移动的动画方向 */
    animateDirection: HeroAnimateDirection;
}

export class MapHeroRenderer implements IMapHeroRenderer {
    private static readonly splitter: ITextureSplitter<number> =
        new TextureRowSplitter();

    /** 勇士钩子 */
    readonly controller: IHookController<IHeroStateHooks>;
    /** 勇士每个朝向的贴图对象 */
    readonly textureMap: Map<FaceDirection, IMaterialFramedData> = new Map();
    /** 勇士渲染实体，与 `entities[0]` 同引用 */
    readonly heroEntity: HeroRenderEntity;

    /**
     * 渲染实体，索引 0 表示勇士，后续索引依次表示跟随的跟随者。
     * 整体是一个状态机，而且下一个跟随者只与上一个跟随者有关，下一个跟随者移动的方向就是上一个跟随者上一步移动后指向的方向。
     */
    readonly entities: HeroRenderEntity[] = [];

    /** 每帧执行的帧动画对象 */
    readonly ticker: IMapRendererTicker;

    constructor(
        readonly renderer: IMapRenderer,
        readonly layer: IMapLayer,
        readonly hero: IHeroState
    ) {
        this.controller = hero.addHook(new MapHeroHook(this));
        this.controller.load();
        const moving = this.addHeroMoving(renderer, layer, hero);
        const heroEntity: HeroRenderEntity = {
            block: moving,
            identifier: '',
            targetX: hero.x,
            targetY: hero.y,
            direction: hero.direction,
            nextDirection: FaceDirection.Unknown,
            moving: false,
            animating: false,
            animateInterval: 0,
            lastAnimateTime: 0,
            animateFrame: 0,
            promise: Promise.resolve(),
            animateDirection: HeroAnimateDirection.Forward
        };
        this.heroEntity = heroEntity;
        this.entities.push(heroEntity);
        this.ticker = renderer.requestTicker(time => this.tick(time));
    }

    /**
     * 添加勇士对应的移动图块
     * @param renderer 渲染器
     * @param layer 图块所属图层
     * @param hero 勇士状态对象
     */
    private addHeroMoving(
        renderer: IMapRenderer,
        layer: IMapLayer,
        hero: IHeroState
    ) {
        if (isNil(hero.image)) {
            logger.warn(88);
            return renderer.addMovingBlock(layer, 0, hero.x, hero.y);
        }
        const image = this.renderer.manager.getImageByAlias(hero.image);
        if (!image) {
            logger.warn(89, hero.image);
            return renderer.addMovingBlock(layer, 0, hero.x, hero.y);
        }
        this.updateHeroTexture(image);
        const tex = this.textureMap.get(degradeFace(hero.direction));
        if (!tex) {
            return renderer.addMovingBlock(layer, 0, hero.x, hero.y);
        }
        const block = renderer.addMovingBlock(layer, tex, hero.x, hero.y);
        block.useSpecifiedFrame(0);
        return block;
    }

    /**
     * 更新勇士贴图
     * @param image 勇士使用的贴图，包含四个方向
     */
    private updateHeroTexture(image: ITexture) {
        const textures = [
            ...image.split(MapHeroRenderer.splitter, image.height / 4)
        ];
        if (textures.length !== 4) {
            logger.warn(90, hero.image);
            return;
        }
        const faceList = [
            FaceDirection.Down,
            FaceDirection.Left,
            FaceDirection.Right,
            FaceDirection.Up
        ];
        faceList.forEach((v, i) => {
            const dirImage = textures[i];
            const data: IMaterialFramedData = {
                offset: dirImage.width / 4,
                texture: dirImage,
                cls: BlockCls.Unknown,
                frames: 4,
                defaultFrame: 0
            };
            this.textureMap.set(v, data);
        });
    }

    private tick(time: number) {
        this.entities.forEach(v => {
            if (v.animating) {
                const dt = time - v.lastAnimateTime;
                if (dt > v.animateInterval) {
                    if (v.animateDirection === HeroAnimateDirection.Forward) {
                        v.animateFrame++;
                    } else {
                        v.animateFrame--;
                        if (v.animateFrame < 0) {
                            // 小于 0，则加上帧数的整数倍，就写个 10000 倍吧
                            v.animateFrame += v.block.texture.frames * 10000;
                        }
                    }
                    v.lastAnimateTime = time;
                    v.block.useSpecifiedFrame(v.animateFrame);
                }
            } else {
                if (v.animateFrame !== 0) {
                    v.animateFrame = 0;
                    v.block.useSpecifiedFrame(0);
                }
            }
        });
    }

    setImage(image: ITexture): void {
        this.updateHeroTexture(image);
        const tex = this.textureMap.get(degradeFace(this.hero.direction));
        if (!tex) return;
        this.heroEntity.block.setTexture(tex);
    }

    setAlpha(alpha: number): void {
        this.heroEntity.block.setAlpha(alpha);
    }

    setPosition(x: number, y: number): void {
        this.entities.forEach(v => {
            v.block.setPos(x, y);
            v.nextDirection = FaceDirection.Unknown;
        });
    }

    /**
     * 移动指定渲染实体，不会影响其他渲染实体。多次调用时会按顺序依次移动
     * @param entity 渲染实体
     * @param direction 移动方向
     * @param time 移动时长
     */
    private moveEntity(
        entity: HeroRenderEntity,
        direction: FaceDirection,
        time: number
    ) {
        const { x: dx, y: dy } = getFaceMovement(direction);
        if (dx === 0 && dy === 0) return;
        const block = entity.block;
        const tx = block.x + dx;
        const ty = block.y + dy;
        const nextTile = state.roleFace.getFaceOf(block.tile, direction);
        const nextTex = this.renderer.manager.getIfBigImage(
            nextTile?.identifier ?? block.tile
        );
        entity.animateInterval = time;
        entity.promise = entity.promise.then(async () => {
            entity.moving = true;
            entity.animating = true;
            entity.direction = direction;
            if (nextTex) block.setTexture(nextTex);
            await block.lineTo(tx, ty, time);
            entity.nextDirection = entity.direction;
        });
    }

    /**
     * 生成跳跃曲线
     * @param dx 横向偏移量
     * @param dy 纵向偏移量
     */
    private generateJumpFn(dx: number, dy: number): TimingFn<2> {
        const distance = Math.hypot(dx, dy);
        const peak = 3 + distance;

        return (progress: number) => {
            const x = dx * progress;
            const y = progress * dy + (progress ** 2 - progress) * peak;

            return [x, y];
        };
    }

    /**
     * 将指定渲染实体跳跃至目标点，多次调用时会按顺序依次执行，可以与 `moveEntity` 混用
     * @param entity 渲染实体
     * @param x 目标横坐标
     * @param y 目标纵坐标
     * @param time 跳跃时长
     */
    private jumpEntity(
        entity: HeroRenderEntity,
        x: number,
        y: number,
        time: number
    ) {
        const block = entity.block;
        entity.promise = entity.promise.then(async () => {
            const dx = block.x - x;
            const dy = block.y - y;
            const fn = this.generateJumpFn(dx, dy);
            entity.moving = true;
            entity.animating = false;
            entity.animateFrame = 0;
            await block.moveRelative(fn, time);
        });
    }

    startMove(): void {
        this.heroEntity.moving = true;
        this.heroEntity.animating = true;
        this.heroEntity.lastAnimateTime = this.ticker.timestamp;
    }

    private endEntityMoving(entity: HeroRenderEntity) {
        entity.moving = false;
        entity.animating = false;
        entity.animateFrame = 0;
        entity.block.useSpecifiedFrame(0);
    }

    async waitMoveEnd(): Promise<void> {
        await Promise.all(this.entities.map(v => v.promise));
        this.entities.forEach(v => this.endEntityMoving(v));
    }

    stopMove(): void {
        this.entities.forEach(v => {
            v.block.endMoving();
            this.endEntityMoving(v);
        });
    }

    async move(direction: FaceDirection, time: number): Promise<void> {
        this.moveEntity(this.heroEntity, direction, time);
        for (let i = 1; i < this.entities.length; i++) {
            const last = this.entities[i - 1];
            this.moveEntity(this.entities[i], last.nextDirection, time);
        }
        await Promise.all(this.entities.map(v => v.promise));
    }

    async jumpTo(
        x: number,
        y: number,
        time: number,
        waitFollower: boolean
    ): Promise<void> {
        // 首先要把所有的跟随者移动到勇士所在位置
        for (let i = 1; i < this.entities.length; i++) {
            // 对于每一个跟随者，需要向前遍历每一个跟随者，然后朝向移动，这样就可以聚集在一起了
            const now = this.entities[i];
            for (let j = i - 1; j >= 0; j--) {
                const last = this.entities[j];
                this.moveEntity(now, last.nextDirection, DEFAULT_TIME);
            }
        }
        this.entities.forEach(v => {
            this.jumpEntity(v, x, y, time);
        });
        if (waitFollower) {
            await Promise.all(this.entities.map(v => v.promise));
        } else {
            return this.heroEntity.promise;
        }
    }

    addFollower(image: number, id: string): void {
        const last = this.entities[this.entities.length - 1];
        if (last.moving) {
            logger.warn(92);
            return;
        }
        const nowFace = degradeFace(last.nextDirection, FaceDirection.Down);
        const faced = state.roleFace.getFaceOf(image, nowFace);
        const tex = this.renderer.manager.getIfBigImage(faced?.face ?? image);
        if (!tex) {
            logger.warn(91, image.toString());
            return;
        }
        const { x: dxn, y: dyn } = getFaceMovement(last.nextDirection);
        const { x: dx, y: dy } = getFaceMovement(last.direction);
        const x = last.block.x - dxn;
        const y = last.block.y - dyn;
        const moving = this.renderer.addMovingBlock(this.layer, tex, x, y);
        const entity: HeroRenderEntity = {
            block: moving,
            identifier: id,
            targetX: last.targetX - dx,
            targetY: last.targetY - dy,
            direction: nowFace,
            nextDirection: FaceDirection.Unknown,
            moving: false,
            animating: false,
            animateInterval: 0,
            lastAnimateTime: 0,
            animateFrame: 0,
            promise: Promise.resolve(),
            animateDirection: HeroAnimateDirection.Forward
        };
        moving.useSpecifiedFrame(0);
        this.entities.push(entity);
    }

    async removeFollower(follower: string, animate: boolean): Promise<void> {
        const index = this.entities.findIndex(v => v.identifier === follower);
        if (index === -1) return;
        if (this.entities[index].moving) {
            logger.warn(93);
            return;
        }
        if (index === this.entities.length - 1) {
            this.entities[index].block.destroy();
            this.entities.splice(index, 1);
            return;
        }
        // 展示动画
        if (animate) {
            for (let i = index + 1; i < this.entities.length; i++) {
                const last = this.entities[i - 1];
                const moving = this.entities[i];
                this.moveEntity(moving, last.nextDirection, DEFAULT_TIME);
            }
            this.entities[index].block.destroy();
            this.entities.splice(index, 1);
            await Promise.all(this.entities.map(v => v.promise));
            return;
        }
        // 不展示动画
        for (let i = index + 1; i < this.entities.length; i++) {
            const last = this.entities[i - 1];
            const moving = this.entities[i];
            moving.block.setPos(last.block.x, last.block.y);
            const nextFace = state.roleFace.getFaceOf(
                moving.block.tile,
                last.nextDirection
            );
            if (!nextFace) continue;
            const tile = this.renderer.manager.getIfBigImage(
                nextFace.identifier
            );
            if (!tile) continue;
            moving.block.setTexture(tile);
            moving.direction = last.nextDirection;
            moving.nextDirection = moving.direction;
        }
        this.entities[index].block.destroy();
        this.entities.splice(index, 1);
    }

    removeAllFollowers(): void {
        for (let i = 1; i < this.entities.length; i++) {
            this.entities[i].block.destroy();
        }
        this.entities.length = 1;
    }

    setFollowerAlpha(identifier: string, alpha: number): void {
        const follower = this.entities.find(v => v.identifier === identifier);
        if (!follower) return;
        follower.block.setAlpha(alpha);
    }

    setHeroAnimateDirection(direction: HeroAnimateDirection): void {
        this.heroEntity.animateDirection = direction;
    }

    turn(direction?: FaceDirection): void {
        const next = isNil(direction)
            ? nextFaceDirection(this.heroEntity.direction)
            : direction;
        const tex = this.textureMap.get(next);
        if (tex) {
            this.heroEntity.block.setTexture(tex);
            this.heroEntity.direction = next;
        }
    }

    destroy() {
        this.controller.unload();
    }
}

class MapHeroHook implements Partial<IHeroStateHooks> {
    constructor(readonly hero: MapHeroRenderer) {}

    onSetImage(image: ImageIds): void {
        const texture = this.hero.renderer.manager.getImageByAlias(image);
        if (!texture) {
            logger.warn(89, hero.image);
            return;
        }
        this.hero.setImage(texture);
    }

    onSetPosition(x: number, y: number): void {
        this.hero.setPosition(x, y);
    }

    onTurnHero(direction: FaceDirection): void {
        this.hero.turn(direction);
    }

    onStartMove(): void {
        this.hero.startMove();
    }

    onMoveHero(direction: FaceDirection, time: number): Promise<void> {
        return this.hero.move(direction, time);
    }

    onEndMove(): Promise<void> {
        return this.hero.waitMoveEnd();
    }

    onJumpHero(
        x: number,
        y: number,
        time: number,
        waitFollower: boolean
    ): Promise<void> {
        return this.hero.jumpTo(x, y, time, waitFollower);
    }

    onSetAlpha(alpha: number): void {
        this.hero.setAlpha(alpha);
    }

    onAddFollower(follower: number, identifier: string): void {
        this.hero.addFollower(follower, identifier);
    }

    onRemoveFollower(identifier: string, animate: boolean): void {
        this.hero.removeFollower(identifier, animate);
    }

    onRemoveAllFollowers(): void {
        this.hero.removeAllFollowers();
    }

    onSetFollowerAlpha(identifier: string, alpha: number): void {
        this.hero.setFollowerAlpha(identifier, alpha);
    }
}
